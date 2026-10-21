// @ts-nocheck
import React, { useState } from "react";
import { BookOpen, Search, Sparkles, Filter, ExternalLink, Compass, ShieldAlert, Cpu } from "lucide-react";
import LIBRARY_DATA from "../../../../content-library.json";

interface CplLibraryProps {
  accentColor: string;
}

export const CplLibrary: React.FC<CplLibraryProps> = ({ accentColor }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "All Wisdom" },
    { id: "product_deep_links", label: "33 Pillars (Products)" },
    { id: "plt_wisdom", label: "PLT Doctrine" },
    { id: "matrix_revelation", label: "Matrix Reflections" },
    { id: "soul_birth", label: "Soul Birth Rituals" },
    { id: "sacred_mechanics", label: "Twelve Laws" },
    { id: "execution_engine", label: "Recursive Muscles" },
  ];

  const getCategorizedItems = () => {
    let items: { text: string; category: string }[] = [];

    if (LIBRARY_DATA.product_deep_links) {
      LIBRARY_DATA.product_deep_links.forEach((p) => {
        items.push({ text: p, category: "product_deep_links" });
      });
    }

    if (LIBRARY_DATA.plt_wisdom) {
      LIBRARY_DATA.plt_wisdom.forEach((w) => {
        items.push({ text: w, category: "plt_wisdom" });
      });
    }

    if (LIBRARY_DATA.matrix_revelation) {
      LIBRARY_DATA.matrix_revelation.forEach((m) => {
        items.push({ text: m, category: "matrix_revelation" });
      });
    }

    if (LIBRARY_DATA.soul_birth) {
      LIBRARY_DATA.soul_birth.forEach((s) => {
        items.push({ text: s, category: "soul_birth" });
      });
    }

    if (LIBRARY_DATA.sacred_mechanics) {
      LIBRARY_DATA.sacred_mechanics.forEach((sm) => {
        items.push({ text: sm, category: "sacred_mechanics" });
      });
    }

    if (LIBRARY_DATA.execution_engine) {
      LIBRARY_DATA.execution_engine.forEach((e) => {
        items.push({ text: e, category: "execution_engine" });
      });
    }

    if (activeCategory !== "all") {
      items = items.filter((item) => item.category === activeCategory);
    }

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      items = items.filter((item) => item.text.toLowerCase().includes(q));
    }

    return items;
  };

  const filteredItems = getCategorizedItems();

  const parseItemLink = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex);
    if (urls && urls.length > 0) {
      const url = urls[0];
      const cleanText = text.replace(url, "").trim();
      return { text: cleanText, url };
    }
    return { text, url: null };
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-2xl relative overflow-hidden text-slate-100 flex flex-col h-full hover:border-pink-500/10 transition-all select-none">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-25 pointer-events-none" />

      {/* Header section */}
      <div className="relative z-10 border-b border-slate-800/85 pb-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <BookOpen className="w-5.5 h-5.5 text-purple-400" />
            Cosmic Pyramid Library
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Browse and query the foundational knowledge database of the Soulverse. These 33 pillars ground GSK with existential directives, PLT economic formulas, and the code mechanics of the 12 sacred physics.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 bg-slate-950 border border-slate-850 text-[10px] font-mono text-slate-400 rounded-lg">
          <Compass className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          <span>REALITY_ANCHOR_DATABASE_V10</span>
        </div>
      </div>

      {/* Search & filters tools bar */}
      <div className="relative z-10 flex flex-col gap-4 mb-6 text-left">
        <div className="flex bg-slate-950/80 border border-slate-850 rounded-xl px-3.5 py-2.5 items-center gap-2">
          <Search className="w-4 h-4 text-slate-450" />
          <input
            type="text"
            placeholder="Search through sacred texts, articles, and products..."
            className="w-full text-xs font-sans bg-transparent text-slate-200 outline-none placeholder-slate-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Categories filters scrollbar */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg border text-[10px] font-mono tracking-wider uppercase transition whitespace-nowrap cursor-pointer hover:scale-[1.02] active:scale-95 ${
                activeCategory === cat.id
                  ? "bg-slate-950 text-white font-bold"
                  : "bg-slate-900/40 text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/45"
              }`}
              style={{
                borderColor: activeCategory === cat.id ? accentColor : undefined,
                boxShadow: activeCategory === cat.id ? `0 0 10px ${accentColor}15` : "none"
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content viewport */}
      <div className="relative z-10 flex-1 min-h-[300px] overflow-y-auto max-h-[500px] scrollbar-thin scrollbar-thumb-slate-850 pr-1">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-slate-950/20 border border-dashed border-slate-850 rounded-xl min-h-[220px]">
            <ShieldAlert className="w-10 h-10 text-slate-655 mb-3 animate-pulse" />
            <p className="text-sm font-mono text-slate-400">No knowledge fragments found matching query parameters.</p>
            <p className="text-xs font-sans text-slate-500 mt-1">Try broad search inputs, or clear filter categories.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item, idx) => {
              const parsed = parseItemLink(item.text);
              const isProduct = item.category === "product_deep_links";

              return (
                <div
                  key={idx}
                  className={`border rounded-xl p-4.5 hover:bg-slate-900/60 hover:border-slate-800 transition text-left flex flex-col justify-between ${
                    isProduct
                      ? "bg-slate-950/30 border-purple-950/40"
                      : "bg-slate-900/20 border-slate-850/60"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-mono bg-slate-900 border border-slate-850 px-2 py-0.5 rounded text-slate-400 uppercase font-bold tracking-widest">
                        {item.category.replace(/_/g, " ")}
                      </span>
                      <span className="text-[9px] font-mono text-slate-605 font-medium">FRAG #{idx + 101}</span>
                    </div>

                    <p className="text-xs text-slate-250 leading-relaxed font-sans font-medium">
                      {parsed.text}
                    </p>
                  </div>

                  {parsed.url && (
                    <div className="mt-3.5 pt-3.5 border-t border-slate-900 flex justify-end">
                      <a
                        href={parsed.url.startsWith("http") ? parsed.url : `https://${parsed.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-cyan-400 hover:text-white uppercase transition"
                      >
                        <span>GO TO LINK</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
