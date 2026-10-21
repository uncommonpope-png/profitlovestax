import React, { useState, useRef, useEffect } from "react";
import { 
  Globe, 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Eye, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  BookOpen, 
  Search, 
  Check, 
  AlertCircle,
  Bug,
  AlertTriangle,  // contradiction warning
  FileText,            // PDF format
  Terminal,            // code/GitHub format
  Github,              // GitHub icon if available, or use BoxSelect
  LayoutDashboard      // general format badge
} from "lucide-react";

interface InternetTabProps {
  accentColor?: string;
  providerConfig?: any;
}

export const InternetTab: React.FC<InternetTabProps> = ({ accentColor = "#ec4899" }) => {
  const [urlInput, setUrlInput] = useState("https://google.com");
  const [currentUrl, setCurrentUrl] = useState("https://duckduckgo.com");
  const [history, setHistory] = useState<string[]>(["https://duckduckgo.com"]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [mode, setMode] = useState<"proxy" | "reader">("proxy");
  const [loading, setLoading] = useState(false);
  const [witnessing, setWitnessing] = useState(false);
  const [witnessSuccess, setWitnessSuccess] = useState(false);
  const [readerContent, setReaderContent] = useState<{ title: string; content: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [crawlStatus, setCrawlStatus] = useState<{domain: string; depth: number; maxDepth: number; isActive: boolean} | null>(null);
  const [iframeBlocked, setIframeBlocked] = useState<boolean>(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const navigateTo = async (targetUrl: string) => {
    let formatted = targetUrl.trim();
    if (!formatted) return;
    if (!/^https?:\/\//i.test(formatted)) {
      if (formatted.includes(".") && !formatted.includes(" ")) {
        formatted = "https://" + formatted;
      } else {
        formatted = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(formatted)}`;
      }
    }

    setLoading(true);
    setErrorMsg(null);
    setUrlInput(formatted);

    // Manage crawl session
    const sessionId = "net-tab-" + Date.now().toString(36);
    const newDepth = formatted !== currentUrl ? 0 : 1;

    try {
      const crawlRes = await fetch(`/api/browse/status?sessionId=${sessionId}&url=${encodeURIComponent(formatted)}&depth=${newDepth}`);
      if (crawlRes.ok) {
        const cData = await crawlRes.json();
        if (cData.blocked) {
          setErrorMsg(`Crawl Depth Limit: ${cData.blocked.reason}. Click "Release" to continue.`);
          setUrlInput(formatted);
          setCurrentUrl(formatted);
          setLoading(false);
          return;
        }
        setCrawlStatus(cData.status || null);
      }
    } catch (e) {
      // Silent — crawl tracking is enhancement
      console.warn('Crawl status unavailable');
    }

    const newHist = [...history.slice(0, historyIdx + 1), formatted];
    setHistory(newHist);
    setHistoryIdx(newHist.length - 1);

    setCurrentUrl(formatted);

    if (mode === "reader") {
      await fetchReaderData(formatted);
    } else if (iframeRef.current) {
      iframeRef.current.src = `/api/browse?url=${encodeURIComponent(formatted)}`;
    }
    setLoading(false);
  };

  const fetchReaderData = async (target: string) => {
    try {
      const res = await fetch(`/api/browse?url=${encodeURIComponent(target)}&format=json`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to load reader mode");
      }
      const data = await res.json();
      setReaderContent({ title: data.title || target, content: data.content || "" });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to fetch page reader view");
    }
  };

  const handleBack = () => {
    if (historyIdx > 0) {
      const prev = history[historyIdx - 1];
      setHistoryIdx(historyIdx - 1);
      setCurrentUrl(prev);
      setUrlInput(prev);
      if (mode === "reader") fetchReaderData(prev);
    }
  };

  const handleForward = () => {
    if (historyIdx < history.length - 1) {
      const next = history[historyIdx + 1];
      setHistoryIdx(historyIdx + 1);
      setCurrentUrl(next);
      setUrlInput(next);
      if (mode === "reader") fetchReaderData(next);
    }
  };

  const handleReload = () => {
    if (mode === "reader") {
      fetchReaderData(currentUrl);
    } else if (iframeRef.current) {
      iframeRef.current.src = `/api/browse?url=${encodeURIComponent(currentUrl)}`;
    }
  };

  const handleWitnessToScribe = async () => {
    setWitnessing(true);
    setWitnessSuccess(false);
    try {
      // Fetch JSON version of content
      const res = await fetch(`/api/browse?url=${encodeURIComponent(currentUrl)}&format=json`);
      const data = await res.json();

      const memoryContent = `[HUMAN BROWSER WITNESS] URL: ${currentUrl}\nTitle: ${data.title || currentUrl}\nExcerpt: ${(data.content || "").replace(/<[^>]+>/g, " ").slice(0, 1500)}`;

      await fetch("/api/gsk/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "human_research",
          content: memoryContent,
          source: "internet_tab",
          url: currentUrl
        })
      });

      setWitnessSuccess(true);
      setTimeout(() => setWitnessSuccess(false), 3000);
    } catch (err) {
      console.error("Witnessing failed:", err);
    } finally {
      setWitnessing(false);
    }
  };

  const proxySrc = `/api/browse?url=${encodeURIComponent(currentUrl)}`;

  return (
    <div className="flex flex-col w-full h-full bg-slate-950 text-slate-100 font-mono select-none">
      {/* Top Browser Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-slate-900 border-b border-slate-800 shrink-0 h-12">
        <div className="flex items-center gap-1">
          <button
            onClick={handleBack}
            disabled={historyIdx <= 0}
            className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleForward}
            disabled={historyIdx >= history.length - 1}
            className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300"
            title="Forward"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleReload}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
            title="Reload"
          >
            <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          {crawlStatus && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/60 border border-slate-700 rounded text-xs font-mono" title={`Crawl depth ${crawlStatus.depth}/${crawlStatus.maxDepth} for ${crawlStatus.domain}`}>
            <Bug className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-300">
              {crawlStatus.depth}/{crawlStatus.maxDepth}
            </span>
            </div>
          )}
        </div>

        {crawlStatus && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/60 border border-slate-700/60 rounded text-xs font-mono text-slate-300">
            Depth {crawlStatus.depth}/{crawlStatus.maxDepth} ({crawlStatus.domain})
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigateTo(urlInput);
          }}
          className="flex-1 flex items-center bg-slate-950 border border-slate-700/60 rounded px-2 py-1 gap-2 focus-within:border-emerald-500/80 transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Search or enter web URL..."
            className="w-full bg-transparent text-xs text-slate-200 outline-none font-mono"
          />
          <button type="submit" className="text-slate-400 hover:text-white">
            <Search className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              const newMode = mode === "proxy" ? "reader" : "proxy";
              setMode(newMode);
              if (newMode === "reader") fetchReaderData(currentUrl);
            }}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors ${
              mode === "reader"
                ? "bg-purple-950/80 border-purple-500 text-purple-200"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            }`}
            title="Toggle Reader Mode"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{mode === "reader" ? "Reader ON" : "Proxy View"}</span>
          </button>

          {/* Witness Button */}
          <button
            onClick={handleWitnessToScribe}
            disabled={witnessing}
            style={{ borderColor: accentColor }}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded border bg-slate-900 hover:bg-slate-800 text-slate-100 transition-all"
            title="Witness current page into GSK memory"
          >
            {witnessSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Witnessed!</span>
              </>
            ) : witnessing ? (
              <>
                <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>Witnessing...</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Witness to Soul</span>
              </>
            )}
          </button>

          <a
            href={currentUrl}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            title="Open in native new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Quick Access Bookmarks Bar */}
      <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/60 border-b border-slate-800/80 text-[10px] text-slate-400 shrink-0 overflow-x-auto">
        <span className="text-slate-500 uppercase tracking-widest font-semibold text-[9px]">Quick Nav:</span>
        {[
          { name: "DuckDuckGo", url: "https://duckduckgo.com" },
          { name: "Wikipedia", url: "https://en.wikipedia.org" },
          { name: "GitHub", url: "https://github.com" },
          { name: "Hacker News", url: "https://news.ycombinator.com" },
          { name: "MDN Docs", url: "https://developer.mozilla.org" },
          { name: "StackOverflow", url: "https://stackoverflow.com" },
          { name: "NPM", url: "https://www.npmjs.com" },
          { name: "Reddit", url: "https://old.reddit.com" },
          { name: "ArXiv", url: "https://arxiv.org" },
          { name: "Devvit Docs", url: "https://developers.reddit.com" }
        ].map((b) => (
          <button
            key={b.name}
            onClick={() => navigateTo(b.url)}
            className="px-2 py-0.5 rounded bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors whitespace-nowrap"
          >
            {b.name}
          </button>
        ))}
      </div>

      {/* Content Viewport */}
      <div className="flex-1 relative w-full h-full min-h-0 bg-slate-950 overflow-hidden">
        {errorMsg ? (
          <div className="flex flex-col items-center justify-center w-full h-full p-6 text-center text-rose-400 gap-2">
            <AlertCircle className="w-8 h-8" />
            <div className="text-sm font-semibold">Proxy Navigation Error</div>
            <div className="text-xs text-slate-400 max-w-md">{errorMsg}</div>
            <button
              onClick={handleReload}
              className="mt-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded"
            >
              Retry
            </button>
          </div>
        ) : mode === "reader" ? (
          <div className="h-full overflow-y-auto p-6 max-w-4xl mx-auto text-slate-200">
            <h1 className="text-xl font-bold mb-4 text-emerald-400 border-b border-slate-800 pb-2">
              {readerContent?.title || "Reader View"}
            </h1>
            <div
              className="prose prose-invert max-w-none text-xs leading-relaxed space-y-4"
              dangerouslySetInnerHTML={{ __html: readerContent?.content || "<p>Loading reader view...</p>" }}
            />
          </div>
        ) : (
          <div className="flex-1 relative">
            {iframeBlocked && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/95 text-slate-300 gap-4 p-8">
                <div className="text-amber-400 font-bold text-sm">This site blocked iframe embedding</div>
                <div className="text-xs text-slate-500 text-center max-w-md">
                  The site sent security headers that prevent rendering inside the browser proxy.
                  Switching to Reader Mode to extract the content...
                </div>
                <button
                  onClick={() => {
                    setMode("reader");
                    setIframeBlocked(false);
                    fetchReaderData(currentUrl);
                  }}
                  className="px-4 py-2 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold hover:bg-amber-500/30 transition-colors"
                >
                  Switch to Reader Mode
                </button>
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={proxySrc}
              title="Sovereign Internet Browser"
              className="w-full h-full border-none bg-white"
              sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
              onLoad={() => {
                setLoading(false);
                // Check if iframe loaded blank content (blocked)
                try {
                  const doc = iframeRef.current?.contentDocument;
                  const body = doc?.body;
                  if (!body || body.innerHTML.length < 50 || body.textContent?.includes("refused to connect")) {
                    setIframeBlocked(true);
                  }
                } catch {
                  // Cross-origin — can't inspect, assume it's fine
                }
              }}
              onError={() => {
                setLoading(false);
                setIframeBlocked(true);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
