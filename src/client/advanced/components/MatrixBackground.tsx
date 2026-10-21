// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import { Sparkles, Play, Pause, RefreshCw, Heart, DollarSign, CloudMoon } from "lucide-react";

interface MatrixBackgroundProps {
  accentColor: string;
}

export const MatrixBackground: React.FC<MatrixBackgroundProps> = ({ accentColor }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Customization controls
  const [colorTheme, setColorTheme] = useState<"pyramid-neon" | "monochrome-pink" | "monochrome-cyan" | "classic-green">("pyramid-neon");
  const [speed, setSpeed] = useState<number>(1.2);
  const [density, setDensity] = useState<number>(0.65); // Multiplier for stream count
  const [showFlowingParticles, setShowFlowingParticles] = useState<boolean>(true);
  const [showPyramids, setShowPyramids] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Floating ambient hearts/bills particles state (handled separately for smooth CSS animations)
  const [hearts, setHearts] = useState<{ id: number; left: number; size: number; delay: number; duration: number }[]>([]);
  const [bills, setBills] = useState<{ id: number; left: number; size: number; delay: number; duration: number; rotation: number }[]>([]);

  // Initialize floating background items
  useEffect(() => {
    const listHearts = Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 14 + 8,
      delay: Math.random() * 15,
      duration: Math.random() * 12 + 8,
    }));
    const listBills = Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 16 + 12,
      delay: Math.random() * 12,
      duration: Math.random() * 14 + 10,
      rotation: Math.random() * 360,
    }));
    setHearts(listHearts);
    setBills(listBills);
  }, []);

  // Main canvas drawing and animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let resizeObserver: ResizeObserver;

    // Track stream vertical positions
    let columns: number[] = [];
    // Track columns streaming speed and color modes
    let multipliers: number[] = [];
    let characters: string[] = [];

    const CHARS = "0123456789ABCDEF♥♡$¥★⚙⚡🧬010101XYZΩΨ";

    const reinitColumns = (width: number) => {
      const fontSize = 14;
      const colCount = Math.floor((width / fontSize) * density);
      columns = Array.from({ length: colCount }).map(() => Math.random() * -100);
      multipliers = Array.from({ length: colCount }).map(() => Math.random() * 0.5 + 0.5);
      characters = Array.from({ length: colCount }).map(() => CHARS[Math.floor(Math.random() * CHARS.length)]);
    };

    // Responsive Canvas Resizing using ResizeObserver
    const handleResize = (entries: ResizeObserverEntry[]) => {
      if (isPaused) return;
      for (const entry of entries) {
        let width = entry.contentRect.width;
        let height = entry.contentRect.height;
        
        // Compensate for viewport minimum bounds
        width = Math.max(width, 400);
        height = Math.max(height, 400);

        canvas.width = width;
        canvas.height = height;
        reinitColumns(width);
      }
    };

    if (containerRef.current) {
      resizeObserver = new ResizeObserver((entries) => {
        // Debounce or directly run. Direct execution is great inside requestAnimationFrame logic
        handleResize(entries);
      });
      resizeObserver.observe(containerRef.current);
    }

    // Set initial size
    const initialWidth = containerRef.current?.clientWidth || window.innerWidth;
    const initialHeight = containerRef.current?.clientHeight || window.innerHeight;
    canvas.width = initialWidth;
    canvas.height = initialHeight;
    reinitColumns(initialWidth);

    // Render loop
    const fontSize = 14;
    ctx.font = `bold ${fontSize}px monospace`;

    const draw = () => {
      if (isPaused) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }

      // Transparent overlay to create fading vaporwave trails
      ctx.fillStyle = "rgba(10, 10, 18, 0.12)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw all interactive code streams
      for (let i = 0; i < columns.length; i++) {
        // Randomly change characters occasionally
        if (Math.random() < 0.05) {
          characters[i] = CHARS[Math.floor(Math.random() * CHARS.length)];
        }

        const char = characters[i];
        const x = i * (fontSize / density);
        const y = columns[i] * fontSize;

        // Choose color palette based on theme
        let textFill = "#06b6d4"; // Default cyan
        let glowColor = "rgba(6, 182, 212, 0.5)";

        if (colorTheme === "pyramid-neon") {
          // Dynamic mix of colors mimicking the images
          const val = (i + Math.floor(columns[i] / 5)) % 4;
          if (val === 0) {
            textFill = "#ec4899"; // Hot Pink
            glowColor = "rgba(236, 72, 153, 0.6)";
          } else if (val === 1) {
            textFill = "#22d3ee"; // Bright Teal
            glowColor = "rgba(34, 211, 238, 0.6)";
          } else if (val === 2) {
            textFill = "#a855f7"; // Cyber Violet
            glowColor = "rgba(168, 85, 247, 0.6)";
          } else {
            textFill = "#f59e0b"; // Moon Amber
            glowColor = "rgba(245, 158, 11, 0.6)";
          }
        } else if (colorTheme === "monochrome-pink") {
          textFill = "#f472b6";
          glowColor = "rgba(244, 114, 182, 0.5)";
        } else if (colorTheme === "monochrome-cyan") {
          textFill = "#67e8f9";
          glowColor = "rgba(103, 232, 249, 0.5)";
        } else {
          textFill = "#10b981"; // Retro Green Matrix
          glowColor = "rgba(16, 185, 129, 0.5)";
        }

        // Apply glow properties to text drops
        ctx.shadowBlur = Math.random() < 0.15 ? 12 : 3;
        ctx.shadowColor = glowColor;
        ctx.fillStyle = textFill;

        // Draw character
        ctx.fillText(char, x, y);

        // Move drop down
        columns[i] += multipliers[i] * speed;

        // Reset if it random-spills off-screen
        if (y > canvas.height && Math.random() > 0.965) {
          columns[i] = Math.random() * -20;
        }
      }

      // Reset shadow blur
      ctx.shadowBlur = 0;

      // Draw custom vector outline layers onto canvas for deeper blend mode integration (if showPyramids is toggled)
      if (showPyramids) {
        ctx.strokeStyle = "rgba(34, 211, 238, 0.08)";
        ctx.lineWidth = 1.5;
        
        // Draw Left Neon Pyramid Outline inside container
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - 20);
        ctx.lineTo(canvas.width * 0.25, canvas.height - 280);
        ctx.lineTo(canvas.width * 0.45, canvas.height - 20);
        ctx.stroke();

        ctx.strokeStyle = "rgba(236, 72, 153, 0.06)";
        ctx.beginPath();
        ctx.moveTo(canvas.width * 0.1, canvas.height - 20);
        ctx.lineTo(canvas.width * 0.25, canvas.height - 280);
        ctx.stroke();

        // Draw Right Neon Pyramid Outline
        ctx.strokeStyle = "rgba(34, 211, 238, 0.08)";
        ctx.beginPath();
        ctx.moveTo(canvas.width * 0.55, canvas.height - 20);
        ctx.lineTo(canvas.width * 0.78, canvas.height - 320);
        ctx.lineTo(canvas.width, canvas.height - 20);
        ctx.stroke();

        ctx.strokeStyle = "rgba(236, 72, 153, 0.06)";
        ctx.beginPath();
        ctx.moveTo(canvas.width * 0.9, canvas.height - 20);
        ctx.lineTo(canvas.width * 0.78, canvas.height - 320);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [colorTheme, speed, density, showPyramids, isPaused]);

  return (
    <div
      ref={containerRef}
      id="matrix-app-backdrop"
      className="absolute inset-0 w-full h-full overflow-hidden bg-[#05050c] select-none pointer-events-none"
    >
      {/* 1. STARFIELD PARTICLES */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />

      {/* 2. SURREAL CELESTIAL MOON (From Image 2 - emitting neon liquid auroras) */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[80px] w-[140px] h-[140px] sm:w-[190px] sm:h-[190px] rounded-full bg-gradient-to-tr from-rose-500 via-amber-400 to-pink-500 flex items-center justify-center animate-pulse shadow-[0_0_80px_rgba(244,63,94,0.35)] mix-blend-screen opacity-90">
        {/* Glowing inner shadow core */}
        <div className="w-[92%] h-[92%] rounded-full bg-[#05050c] flex items-center justify-center relative overflow-hidden">
          {/* Eerie stylized eyes or face mapping inside moon */}
          <div className="absolute top-[35%] left-[25%] bg-rose-500/80 w-3 h-1.5 rounded-full filter blur-[1px]" />
          <div className="absolute top-[35%] right-[25%] bg-rose-500/80 w-3 h-1.5 rounded-full filter blur-[1px]" />
          <div className="absolute top-[48%] left-1/2 -translate-x-1/2 w-8 h-8 rounded-b-full bg-gradient-to-b from-transparent to-pink-500/90 border border-t-0 border-pink-500/60 animate-bounce" style={{ animationDuration: "6s" }} />
          
          {/* Ambient center moon glow */}
          <div className="absolute inset-0 bg-radial-gradient from-transparent to-pink-500/10" />
        </div>

        {/* Dynamic waterfalls/dripping streams under the moon (Image 2) */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 flex flex-col items-center select-none pointer-events-none origin-top">
          {/* Dripping pink beams */}
          <div className="w-1.5 h-[160px] bg-gradient-to-b from-pink-550 via-rose-500/40 to-transparent blur-[1px] animate-pulse rounded-full" />
          <div className="absolute left-[-15px] w-1 h-[110px] bg-gradient-to-b from-pink-400 via-rose-450/30 to-transparent rounded-full animate-bounce" style={{ animationDelay: "1.2s" }} />
          <div className="absolute right-[-15px] border-l border-rose-550/40 w-px h-[130px] animate-pulse" />
        </div>
      </div>

      {/* 3. SURREAL GLOWING PYRAMIDS LAYERS with 3rd-Eyes & Heart Sockets */}
      {showPyramids && (
        <>
          {/* Left Pyramid visual element */}
          <div className="absolute left-[2%] bottom-[-20px] w-[35vw] max-w-[340px] aspect-square rounded-lg flex flex-col justify-end items-center relative overflow-visible filter drop-shadow-[0_0_35px_rgba(6,182,212,0.15)] select-none pointer-events-none">
            {/* Pyramid Face Overlay with Eye of Providence */}
            <div 
              className="absolute inset-0 w-full h-full bg-gradient-to-t from-cyan-950/40 via-purple-950/20 to-transparent border-t-2 border-l-2 border-cyan-400/30 font-mono"
              style={{
                clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)"
              }}
            >
              {/* Internal neon brick grid pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.1)_1px,transparent_1px)] bg-[size:16px_16px] opacity-40" />

              {/* Glowing third eye inside Left Pyramid */}
              <div className="absolute top-[42%] left-1/2 -translate-x-1/2 w-14 h-8 bg-cyan-950/80 border border-cyan-400 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.4)] overflow-hidden animate-pulse">
                {/* Pupil */}
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-pink-500 to-cyan-400 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                </div>
              </div>

              {/* Glowing Heart module placed on the pyramid face */}
              <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 flex items-center justify-center gap-1">
                <Heart className="w-4.5 h-4.5 text-pink-500 fill-pink-500 animate-pulse text-shadow-lg shadow-pink-500" />
              </div>
            </div>
          </div>

          {/* Right Pyramid visual element with Surreal Details */}
          <div className="absolute right-[2%] bottom-[-20px] w-[38vw] max-w-[360px] aspect-square flex flex-col justify-end items-center relative overflow-visible filter drop-shadow-[0_0_40px_rgba(244,63,94,0.12)] select-none pointer-events-none">
            {/* Pyramid Face with dynamic patterns */}
            <div 
              className="absolute inset-0 w-full h-full bg-gradient-to-t from-pink-950/30 via-slate-950/10 to-transparent border-t-2 border-r-2 border-pink-400/30"
              style={{
                clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)"
              }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(rgba(244,63,94,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(244,63,94,0.12)_1px,transparent_1px)] bg-[size:20px_20px] opacity-30" />

              {/* Big eerie neon glowing eyeball inside Right Pyramid */}
              <div className="absolute top-[45%] left-1/2 -translate-x-1/2 w-16 h-9 bg-pink-950/80 border border-pink-400 rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(236,72,153,0.45)] overflow-hidden">
                <div className="w-5.5 h-5.5 rounded-full bg-cyan-400/90 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-950" />
                </div>
                {/* Tears of pink sand flowing down */}
                <div className="absolute bottom-0 w-1 h-3 bg-pink-400 animate-bounce" />
              </div>

              {/* Money dynamic coin module symbol */}
              <div className="absolute bottom-[18%] left-[45%] flex items-center justify-center bg-amber-500/20 border border-amber-400/40 rounded-full p-1 animate-spin" style={{ animationDuration: "12s" }}>
                <span className="text-[10px] text-amber-300 font-mono font-bold">$</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 4. THE INTERACTIVE MATRIX CODE RAIN CANVAS OVERLAY */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover mix-blend-screen opacity-75"
      />

      {/* 5. FLOWING HEARTS & CRYPTOCURRENCY/DOLLAR BILL PARTICLES DRIP */}
      {showFlowingParticles && (
        <>
          {hearts.map((h) => (
            <div
              key={`heart-${h.id}`}
              className="absolute text-pink-500 pointer-events-none text-shadow animate-float-slow opacity-60"
              style={{
                left: `${h.left}%`,
                bottom: "-40px",
                fontSize: `${h.size}px`,
                animationDelay: `${h.delay}s`,
                animationDuration: `${h.duration}s`,
              }}
            >
              ♥
            </div>
          ))}
          {bills.map((b) => (
            <div
              key={`bill-${b.id}`}
              className="absolute text-cyan-400/50 pointer-events-none font-mono selection:bg-transparent font-extrabold animate-float-spin"
              style={{
                left: `${b.left}%`,
                bottom: "-50px",
                fontSize: `${b.size}px`,
                transform: `rotate(${b.rotation}deg)`,
                animationDelay: `${b.delay}s`,
                animationDuration: `${b.duration}s`,
              }}
            >
              $
            </div>
          ))}
        </>
      )}

      {/* 6. NEON BOTTOM OCEAN WAVE EFFECT GRID (From bottom of Image 1 & 3) */}
      <div className="absolute bottom-0 left-0 right-0 h-[60px] bg-gradient-to-t from-cyan-950/80 to-transparent border-t border-cyan-400/20">
        <div className="absolute bottom-0 inset-x-0 h-full bg-[radial-gradient(ellipse_at_bottom,rgba(6,182,212,0.2),transparent_70%)] animate-pulse" />
      </div>

      {/* CSS custom keyframe style definitions for floats */}
      <style>{`
        @keyframes float-slow {
          0% {
            transform: translateY(0) scale(0.6) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.65;
          }
          90% {
            opacity: 0.55;
          }
          100% {
            transform: translateY(-110vh) scale(1.1) rotate(15deg);
            opacity: 0;
          }
        }
        @keyframes float-spin {
          0% {
            transform: translateY(0) scale(0.6) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 0.5;
          }
          85% {
            opacity: 0.35;
          }
          100% {
            transform: translateY(-110vh) scale(1) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-float-slow {
          animation: float-slow infinite linear;
        }
        .animate-float-spin {
          animation: float-spin infinite linear;
        }
      `}</style>
      
      {/* 7. HIGHLY INTERACTIVE FLOATING MATRIX HUD CONTROL CABINET (Allows user interactive control over their matrix/pyramid mindspace) */}
      <div className="absolute bottom-4 left-4 z-40 bg-slate-900/90 border border-slate-800/80 backdrop-blur-md rounded-xl p-3 flex flex-col gap-2.5 max-w-[280px] pointer-events-auto shadow-2xl filter drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
            <span className="text-[9px] font-mono font-black text-slate-300 tracking-wider">PYRAMID DECISION CABINET</span>
          </div>
          <CloudMoon className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        </div>

        <div className="h-px bg-slate-800/60" />

        {/* Matrix Color selector */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="text-left">
            <label className="text-[8px] font-mono text-slate-500 block mb-1 uppercase font-bold">STREAM MATRICES</label>
            <select
              value={colorTheme}
              onChange={(e) => setColorTheme(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[9px] text-slate-200 outline-none w-full font-mono cursor-pointer hover:border-slate-700"
            >
              <option value="pyramid-neon">CyberPsychedelic</option>
              <option value="monochrome-pink">Hyper Pink</option>
              <option value="monochrome-cyan">Neon Cyan</option>
              <option value="classic-green">Original Green</option>
            </select>
          </div>

          <div className="text-left">
            <label className="text-[8px] font-mono text-slate-500 block mb-1 uppercase font-bold">SPEED SCALE</label>
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded px-1 py-0.5">
              <input
                type="range"
                min="0.2"
                max="3"
                step="0.2"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full accent-pink-500 h-1 rounded cursor-pointer"
              />
              <span className="text-[8px] font-mono text-pink-400 shrink-0 w-6 text-right font-black">{speed.toFixed(1)}x</span>
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap gap-1.5 pt-0.5 justify-start">
          <button
            onClick={() => setShowPyramids(!showPyramids)}
            className={`px-1.5 py-0.5 rounded text-[8px] font-mono transition-all cursor-pointer border uppercase ${
              showPyramids
                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 font-bold"
                : "bg-slate-950/60 text-slate-550 border-slate-800"
            }`}
          >
            ▲ Pyramids
          </button>

          <button
            onClick={() => setShowFlowingParticles(!showFlowingParticles)}
            className={`px-1.5 py-0.5 rounded text-[8px] font-mono transition-all cursor-pointer border uppercase ${
              showFlowingParticles
                ? "bg-pink-500/10 text-pink-400 border-pink-500/30 font-bold"
                : "bg-slate-950/60 text-slate-550 border-slate-800"
            }`}
          >
            ♥ Floaters
          </button>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-1.5 py-0.5 rounded text-[8px] font-mono transition-all cursor-pointer border uppercase flex items-center gap-1 ${
              isPaused
                ? "bg-amber-500/15 text-amber-400 border-amber-500/30 font-bold animate-pulse"
                : "bg-slate-950/60 text-slate-450 border-slate-800"
            }`}
          >
            {isPaused ? <Play className="w-2.5 h-2.5 shrink-0" /> : <Pause className="w-2.5 h-2.5 shrink-0" />}
            {isPaused ? "Frozen" : "Animate"}
          </button>
        </div>
      </div>
    </div>
  );
};
