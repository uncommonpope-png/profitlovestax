import React, { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import "@xterm/xterm/css/xterm.css";

/**
 * XtermDrawer — ConPTY terminal pane.
 *
 * CRITICAL: xterm must NEVER be opened into a zero-size container. Inside
 * Dockview the panel body is 0x0 on first mount; opening then triggers
 * xterm's internal Viewport.syncScrollArea -> _renderService.dimensions
 * access, which throws and unmounts the whole React tree ("IDE disappears").
 * So we wait until the host div has real pixels BEFORE creating/opening.
 */
export const XtermDrawer: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const host = terminalRef.current;
    if (!host) return;

    let disposed = false;
    let raf = 0;
    const windowResize = () => {
      try {
        wsRef.current?.send(JSON.stringify({ type: "resize", cols: termRef.current?.cols ?? 80, rows: termRef.current?.rows ?? 24 }));
      } catch {}
    };
    window.addEventListener("resize", windowResize);

    const initTerminal = () => {
      if (disposed || !host.clientWidth || !host.clientHeight) return false;

      const term = new Terminal({
        cursorBlink: true,
        fontFamily: 'Consolas, "Fira Code", monospace',
        fontSize: 13,
        theme: { background: "#090d16", foreground: "#d1d5db" },
      });
      termRef.current = term;

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(host);
      try {
        term.loadAddon(new WebglAddon());
      } catch {
        // Fallback to standard 2D canvas renderer if WebGL is unavailable
      }
      try {
        fitAddon.fit();
      } catch {
        // Non-fatal: first fit may race layout; ResizeObserver will re-fit.
      }

      const ws = new WebSocket(`ws://${window.location.host}/api/ide/ws/terminal`);
      wsRef.current = ws;
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "stdout") term.write(msg.data);
          else if (msg.type === "exit") term.write(`\r\n[process exited: ${msg.code}]\r\n`);
        } catch {}
      };
      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "stdin", data }));
        }
      });

      const ro = new ResizeObserver(() => {
        try {
          fitAddon.fit();
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
          }
        } catch {}
      });
      ro.observe(host);
      roRef.current = ro;
      return true;
    };

    // Poll until Dockview gives the panel real dimensions, then boot xterm.
    const waitForLayout = () => {
      if (disposed) return;
      if (initTerminal()) return;
      raf = requestAnimationFrame(waitForLayout);
    };
    waitForLayout();

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", windowResize);
      roRef.current?.disconnect();
      try { wsRef.current?.close(); } catch {}
      termRef.current?.dispose();
      termRef.current = null;
    };
  }, []);

  return <div ref={terminalRef} style={{ width: "100%", height: "100%" }} />;
};
