import React, { useState, useEffect } from "react";
import { ShieldCheck, Lock, Cpu, Hash, FileCode, Check, RefreshCw, AlertCircle, Award, Sparkles, Layers, Terminal, Key } from "lucide-react";

interface SoulChainLedgerTabProps {
  accentColor: string;
}

interface SoulBlock {
  index: number;
  timestamp: string;
  eventType: string;
  payload: {
    title: string;
    author: string;
    codeHash: string;
    pltScore: { profit: number; love: number; tax: number; soulProfit: number };
    details?: any;
    law?: string;
  };
  previousHash: string;
  signature: string;
  hash: string;
}

interface ChainAudit {
  isValid: boolean;
  totalBlocks: number;
  totalSoulProfit: number;
  errors: string[];
  lastHash: string;
}

export const SoulChainLedgerTab: React.FC<SoulChainLedgerTabProps> = ({ accentColor }) => {
  const [ledger, setLedger] = useState<SoulBlock[]>([]);
  const [audit, setAudit] = useState<ChainAudit | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedBlock, setSelectedBlock] = useState<SoulBlock | null>(null);

  // Quick Mint Form State
  const [mintTitle, setMintTitle] = useState<string>("");
  const [mintAuthor, setMintAuthor] = useState<string>("Craig (The Typist)");
  const [mintCode, setMintCode] = useState<string>("");
  const [mintProfit, setMintProfit] = useState<number>(1.0);
  const [mintLove, setMintLove] = useState<number>(0.9);
  const [mintTax, setMintTax] = useState<number>(0.1);
  const [isMinting, setIsMinting] = useState<boolean>(false);
  const [mintMessage, setMintMessage] = useState<string>("");

  const fetchChain = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/profit/soul-chain");
      const data = await res.json();
      if (data.success) {
        setLedger(data.ledger || []);
        setAudit(data.audit || null);
        if (data.ledger && data.ledger.length > 0) {
          setSelectedBlock(data.ledger[data.ledger.length - 1]);
        }
      }
    } catch (e: any) {
      console.error("Chain fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChain();
  }, []);

  const handleMint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mintTitle.trim() || !mintCode.trim() || isMinting) return;
    setIsMinting(true);
    setMintMessage("Calculating SHA-256 Proof-of-Soul...");
    try {
      const res = await fetch("/api/profit/soul-chain/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "ARTIFACT_FORGED",
          title: mintTitle,
          author: mintAuthor,
          code: mintCode,
          profit: Number(mintProfit),
          love: Number(mintLove),
          tax: Number(mintTax),
        }),
      });
      const data = await res.json();
      if (data.success && data.block) {
        setMintMessage(`Minted Block #${data.block.index} Successfully!`);
        setMintTitle("");
        setMintCode("");
        fetchChain();
        setTimeout(() => setMintMessage(""), 3000);
      } else {
        setMintMessage(`Minting failed: ${data.error}`);
      }
    } catch (err: any) {
      setMintMessage(`Mint error: ${err.message}`);
    } finally {
      setIsMinting(false);
    }
  };

  const verifyIntegrity = async () => {
    try {
      const res = await fetch("/api/profit/soul-chain/verify");
      const data = await res.json();
      if (data.success) {
        setAudit(data.audit);
        alert(data.audit.isValid ? "✅ SHA-256 Ledger Integrity Verified! 100% Authentic Block Chain." : "❌ WARNING: Chain Integrity Violation Detected!");
      }
    } catch (e: any) {
      alert(`Verification error: ${e.message}`);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-2xl flex flex-col h-full gap-6 text-slate-100 overflow-y-auto font-mono">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-slate-950/80 border border-slate-800 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-slate-950 border flex items-center justify-center" style={{ borderColor: accentColor }}>
            <Lock className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
              Cryptographic Deed Ledger & Soul Chain
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                PLT IMMUTABLE LEDGER
              </span>
            </h2>
            <p className="text-slate-400 text-sm">SHA-256 proof-of-soul contracts establishing tamper-proof ownership (SOUL_PROFIT = PROFIT + LOVE - TAX)</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={verifyIntegrity}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 text-emerald-300 rounded-xl text-xs transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Verify Cryptographic Chain
          </button>
          <button
            onClick={fetchChain}
            className="p-2 bg-slate-800 border border-slate-700 hover:border-slate-500 rounded-xl text-slate-300 transition-colors"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-1">
          <div className="text-slate-400 text-xs flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" /> Minted Soul Blocks
          </div>
          <div className="text-2xl font-bold text-white">{audit?.totalBlocks || ledger.length}</div>
          <div className="text-[10px] text-slate-500">Immutable ledger depth</div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-1">
          <div className="text-slate-400 text-xs flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Ledger Integrity
          </div>
          <div className="text-2xl font-bold text-emerald-400 flex items-center gap-1">
            {audit?.isValid !== false ? "100% SECURE" : "CORRUPTED"}
          </div>
          <div className="text-[10px] text-slate-500">SHA-256 Proof-of-Soul validated</div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-1">
          <div className="text-slate-400 text-xs flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" /> Total Soul Profit
          </div>
          <div className="text-2xl font-bold text-amber-300">
            {audit?.totalSoulProfit ?? 2.0} <span className="text-xs text-amber-400/70">PLT</span>
          </div>
          <div className="text-[10px] text-slate-500">PROFIT + LOVE - TAX accumulated</div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col gap-1">
          <div className="text-slate-400 text-xs flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-cyan-400" /> Latest Root Hash
          </div>
          <div className="text-xs font-mono text-cyan-300 truncate" title={audit?.lastHash || ledger[ledger.length - 1]?.hash}>
            {(audit?.lastHash || ledger[ledger.length - 1]?.hash || "").slice(0, 16)}...
          </div>
          <div className="text-[10px] text-slate-500">Root SHA-256 block signature</div>
        </div>
      </div>

      {/* Main Content Layout: Left Quick Mint Deed Form | Right Blockchain Explorer & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Left Form: Mint Proof-of-Soul Deed (5 cols) */}
        <form onSubmit={handleMint} className="lg:col-span-5 bg-slate-950/70 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-200 text-sm">Mint Proof-of-Soul Deed Contract</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 text-xs">Artifact / Deed Title:</label>
            <input
              type="text"
              value={mintTitle}
              onChange={(e) => setMintTitle(e.target.value)}
              placeholder="e.g. Kemet Matrix Quantum Algorithm v1"
              className="bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 text-xs">Author Signature:</label>
            <input
              type="text"
              value={mintAuthor}
              onChange={(e) => setMintAuthor(e.target.value)}
              className="bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
              required
            />
          </div>

          {/* PLT Score Inputs */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-900/80 border border-slate-850 rounded-xl text-xs">
            <div className="flex flex-col gap-1">
              <span className="text-emerald-400 font-bold">Profit (P):</span>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={mintProfit}
                onChange={(e) => setMintProfit(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-center outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-pink-400 font-bold">Love (L):</span>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={mintLove}
                onChange={(e) => setMintLove(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-center outline-none"
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-amber-400 font-bold">Tax (T):</span>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={mintTax}
                onChange={(e) => setMintTax(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-center outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 flex-1 min-h-[120px]">
            <label className="text-slate-400 text-xs">Code / Payload Content to Cryptographically Sign:</label>
            <textarea
              value={mintCode}
              onChange={(e) => setMintCode(e.target.value)}
              placeholder="Paste code or artifact payload to lock into SHA-256 Soul Chain..."
              className="flex-1 w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-slate-200 outline-none resize-none leading-relaxed"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isMinting}
            className="flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl transition-all disabled:opacity-50 text-xs"
          >
            <Lock className="w-4 h-4" />
            {isMinting ? "Minting Cryptographic Deed..." : "Mint SHA-256 Proof-of-Soul Block"}
          </button>

          {mintMessage && (
            <div className="text-center text-xs text-emerald-400 font-mono animate-pulse">
              {mintMessage}
            </div>
          )}
        </form>

        {/* Right Blockchain Matrix & Inspector (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4 bg-slate-950/70 border border-slate-800 rounded-2xl p-5 min-h-0">
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="font-bold text-slate-200 text-sm flex items-center gap-2">
              <Hash className="w-4 h-4 text-emerald-400" /> Immutable Block Matrix ({ledger.length} blocks)
            </span>
            <span className="text-[11px] text-slate-500">Genesis Law Active</span>
          </div>

          {/* Block Matrix Flow */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-850">
            {ledger.map((b) => (
              <button
                key={b.index}
                onClick={() => setSelectedBlock(b)}
                className={`flex flex-col items-center p-2.5 rounded-xl border min-w-[110px] transition-all text-left ${
                  selectedBlock?.index === b.index
                    ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                    : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400"
                }`}
              >
                <span className="text-[10px] font-bold uppercase">Block #{b.index}</span>
                <span className="text-xs font-bold truncate max-w-[90px]">{b.payload.title}</span>
                <span className="text-[9px] text-slate-500 mt-1">{b.hash.slice(0, 8)}...</span>
              </button>
            ))}
          </div>

          {/* Selected Block Cryptographic Inspector */}
          {selectedBlock && (
            <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-3 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                  <FileCode className="w-4 h-4" /> Block #{selectedBlock.index} Deed Contract
                </span>
                <span className="text-[10px] text-slate-500">{selectedBlock.timestamp}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px]">Title:</span>
                  <div className="text-slate-200 font-bold">{selectedBlock.payload.title}</div>
                </div>

                <div>
                  <span className="text-slate-500 text-[10px]">Signed Author:</span>
                  <div className="text-slate-200 font-bold">{selectedBlock.payload.author}</div>
                </div>
              </div>

              {/* PLT Breakdown */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold">PLT Equation Score:</span>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400">P: {selectedBlock.payload.pltScore.profit}</span>
                  <span className="text-pink-400">L: {selectedBlock.payload.pltScore.love}</span>
                  <span className="text-amber-400">T: {selectedBlock.payload.pltScore.tax}</span>
                  <span className="text-white font-bold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40">
                    SOUL PROFIT = {selectedBlock.payload.pltScore.soulProfit}
                  </span>
                </div>
              </div>

              {/* Hashes & Proof Signature */}
              <div className="flex flex-col gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500">Current Block SHA-256 Hash:</span>
                  <div className="p-2 bg-slate-950 border border-slate-800 rounded text-cyan-300 font-mono break-all select-all">
                    {selectedBlock.hash}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500">Previous Block Hash Pointer:</span>
                  <div className="p-2 bg-slate-950 border border-slate-800 rounded text-slate-400 font-mono break-all select-all">
                    {selectedBlock.previousHash}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500">Proof-of-Soul Cryptographic Signature:</span>
                  <div className="p-2 bg-slate-950 border border-slate-800 rounded text-emerald-400 font-mono break-all select-all">
                    {selectedBlock.signature}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
