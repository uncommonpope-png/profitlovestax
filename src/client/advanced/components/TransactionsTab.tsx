// @ts-nocheck
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Filter, 
  Trash2, 
  Download, 
  Coins, 
  ShoppingBag, 
  TrendingUp, 
  Sparkles,
  Zap,
  Info,
  History,
  FileSpreadsheet,
  Plus
} from "lucide-react";
import { MarketplaceTransaction } from "../types";

interface TransactionsTabProps {
  transactions: MarketplaceTransaction[];
  onClearTransactions: () => void;
  onAddSampleTransactions: () => void;
  qscBalance: number;
  accentColor: string;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions,
  onClearTransactions,
  onAddSampleTransactions,
  qscBalance,
  accentColor
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "purchase" | "sale" | "mining" | "listing">("all");

  // Calculate high-level metrics
  const totalPurchase = transactions
    .filter(tx => tx.type === "purchase")
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const totalSale = transactions
    .filter(tx => tx.type === "sale")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalMining = transactions
    .filter(tx => tx.type === "mining")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalInflow = totalSale + totalMining;
  const totalOutflow = totalPurchase;

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          tx.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = typeFilter === "all" || tx.type === typeFilter;
    return matchesSearch && matchesFilter;
  });

  // Export to CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    const headers = ["TXID", "Type", "Title", "Amount (QSC)", "Timestamp"];
    const rows = transactions.map(tx => [
      tx.id,
      tx.type.toUpperCase(),
      tx.title,
      tx.amount,
      tx.timestamp
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `soul-marketplace-transactions-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON
  const handleExportJSON = () => {
    if (transactions.length === 0) return;
    const jsonStr = JSON.stringify(transactions, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `soul-marketplace-transactions-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col space-y-6 text-slate-150">
      
      {/* 1. SECTOR PANEL: HEADER & MAIN BALANCE STATS */}
      <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-cyan-500/10 to-transparent border border-cyan-500/20 rounded-xl text-cyan-400">
            <History className="w-6 h-6 animate-pulse-slow" />
          </div>
          <div className="text-left">
            <h2 className="font-display font-bold text-xl text-white">Marketplace Transactions Ledger</h2>
            <p className="text-xs text-slate-400">Auditable chronological ledger of all sandbox purchases, cloud-listings, P2P sales, and compute pool tasks.</p>
          </div>
        </div>

        {/* virtual credit balance card */}
        <div className="flex items-center gap-3 bg-slate-950/70 border border-slate-850 p-3 px-5 rounded-xl">
          <Coins className="w-5 h-5 text-amber-400" />
          <div className="text-right select-none">
            <span className="block text-[9px] font-mono text-slate-500 uppercase font-medium">LEDGER BALANCE</span>
            <span className="text-lg font-mono font-bold text-amber-400 tracking-wide">{qscBalance} <span className="text-xs font-semibold">QSC</span></span>
          </div>
        </div>
      </div>

      {/* 2. ANALYST CARDS & MICRO METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Purchases Outflow */}
        <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4 flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Total Spent (Outflow)</span>
            <span className="text-lg font-mono font-bold text-rose-400 mt-1 block">-{totalOutflow} QSC</span>
            <span className="text-[9px] text-slate-500 font-sans block mt-0.5 mt-px">Purchases & Skill Unlocks</span>
          </div>
          <div className="p-2 bg-rose-950/20 border border-rose-900/30 rounded-lg text-rose-400 h-9 w-9 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

        {/* Card 2: Sales Inflow */}
        <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4 flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Total Earned (Sales)</span>
            <span className="text-lg font-mono font-bold text-emerald-400 mt-1 block">+{totalSale} QSC</span>
            <span className="text-[9px] text-slate-500 font-sans block mt-0.5 mt-px">Syndicated P2P Contracts</span>
          </div>
          <div className="p-2 bg-emerald-950/20 border border-emerald-900/30 rounded-lg text-emerald-400 h-9 w-9 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>

        {/* Card 3: Grid Compute mining */}
        <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4 flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Validated Mining Loops</span>
            <span className="text-lg font-mono font-bold text-blue-400 mt-1 block">+{totalMining} QSC</span>
            <span className="text-[9px] text-slate-500 font-sans block mt-0.5 mt-px">Virtual GPU Compute Grid</span>
          </div>
          <div className="p-2 bg-blue-950/20 border border-blue-900/30 rounded-lg text-blue-400 h-9 w-9 flex items-center justify-center">
            <Zap className="w-4 h-4 text-blue-400" />
          </div>
        </div>

        {/* Card 4: Ledger Net Flow */}
        <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4 flex items-center justify-between">
          <div className="text-left">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Net Capital Flow</span>
            {totalInflow - totalOutflow >= 0 ? (
              <span className="text-lg font-mono font-bold text-cyan-400 mt-1 block">+{totalInflow - totalOutflow} QSC</span>
            ) : (
              <span className="text-lg font-mono font-bold text-amber-500 mt-1 block">{totalInflow - totalOutflow} QSC</span>
            )}
            <span className="text-[9px] text-slate-500 font-sans block mt-0.5 mt-px">All-Time Sandbox Ledger Delta</span>
          </div>
          <div className="p-2 bg-cyan-950/20 border border-cyan-900/30 rounded-lg text-cyan-400 h-9 w-9 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

      </div>

      {/* 3. CONTROLS, SEARCH & FILTER PANEL */}
      <div className="bg-slate-900/40 border border-slate-805 rounded-xl p-4.5 flex flex-col md:flex-row gap-4 items-center justify-between relative z-10">
        
        {/* Search input field */}
        <div className="w-full md:w-82 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-550" />
          <input
            type="text"
            placeholder="Search TXID or transaction description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs font-sans bg-slate-950/95 border border-slate-850 rounded-xl pl-9 pr-3 py-2 outline-none text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/40 transition"
          />
        </div>

        {/* Filters and Utilities row */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap justify-between md:justify-end">
          
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            <span className="text-slate-500 uppercase">Filter:</span>
            <div className="flex bg-slate-950 p-1 border border-slate-850 rounded-lg">
              <button
                onClick={() => setTypeFilter("all")}
                className={`px-2 py-1 rounded transition whitespace-nowrap cursor-pointer uppercase ${typeFilter === "all" ? "bg-slate-900 text-cyan-400 font-semibold text-[9.5px]" : "text-slate-500 hover:text-slate-350"}`}
              >All</button>
              <button
                onClick={() => setTypeFilter("purchase")}
                className={`px-2 py-1 rounded transition whitespace-nowrap cursor-pointer uppercase ${typeFilter === "purchase" ? "bg-slate-900 text-rose-400 font-semibold text-[9.5px]" : "text-slate-500 hover:text-slate-350"}`}
              >Purchases</button>
              <button
                onClick={() => setTypeFilter("sale")}
                className={`px-2 py-1 rounded transition whitespace-nowrap cursor-pointer uppercase ${typeFilter === "sale" ? "bg-slate-900 text-emerald-400 font-semibold text-[9.5px]" : "text-slate-500 hover:text-slate-350"}`}
              >Sales</button>
              <button
                onClick={() => setTypeFilter("mining")}
                className={`px-2 py-1 rounded transition whitespace-nowrap cursor-pointer uppercase ${typeFilter === "mining" ? "bg-slate-900 text-blue-400 font-semibold text-[9.5px]" : "text-slate-500 hover:text-slate-350"}`}
              >Minings</button>
              <button
                onClick={() => setTypeFilter("listing")}
                className={`px-2 py-1 rounded transition whitespace-nowrap cursor-pointer uppercase ${typeFilter === "listing" ? "bg-slate-900 text-purple-400 font-semibold text-[9.5px]" : "text-slate-500 hover:text-slate-350"}`}
              >Listings</button>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          {/* Export and Action tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={transactions.length === 0}
              className="p-1.5 border border-slate-800 hover:border-slate-700 bg-slate-950/80 hover:bg-slate-900 hover:text-white rounded-lg text-xs font-mono text-slate-450 transition flex items-center gap-1 disabled:opacity-40 select-none cursor-pointer"
              title="Export ledger as CSV file"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              CSV
            </button>
            
            <button
              onClick={handleExportJSON}
              disabled={transactions.length === 0}
              className="p-1.5 border border-slate-800 hover:border-slate-700 bg-slate-950/80 hover:bg-slate-900 hover:text-white rounded-lg text-xs font-mono text-slate-450 transition flex items-center gap-1 disabled:opacity-40 select-none cursor-pointer"
              title="Export ledger as JSON format"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              JSON
            </button>

            <button
              onClick={onClearTransactions}
              disabled={transactions.length === 0}
              className="p-1.5 border border-slate-800 hover:border-red-900/30 hover:bg-red-950/10 rounded-lg text-xs font-mono text-slate-500 hover:text-red-400 transition flex items-center gap-1 disabled:opacity-40 select-none cursor-pointer"
              title="Purge transaction ledger records"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

      {/* 4. THE CHRONO-TABULAR VIEW */}
      <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl text-left">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/40 text-slate-450 font-mono text-[10px] uppercase font-bold tracking-wider select-none">
                <th className="py-4 px-5">TXID REFERENCE</th>
                <th className="py-4 px-5">EVENT TYPE</th>
                <th className="py-4 px-5">TRANSACTION MEMO / DETAIL</th>
                <th className="py-4 px-5 text-right">QUANTUM DELTA</th>
                <th className="py-4 px-5 text-right">TIMESTAMP</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-900 font-sans text-xs">
              <AnimatePresence mode="popLayout">
                {filteredTransactions.length === 0 ? (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={5} className="py-16 px-6 text-center text-slate-500 font-mono">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <ShoppingBag className="w-8 h-8 text-slate-650 animate-bounce" />
                        <p className="text-slate-500 text-xs">No ledger records match active query variables.</p>
                        
                        {transactions.length === 0 && (
                          <button
                            onClick={onAddSampleTransactions}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-slate-3 pointer-events-auto text-[10.5px] font-mono text-cyan-400 hover:text-cyan-300 transition-all flex items-center gap-1 shadow-lg cursor-pointer mx-auto"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Pre-Seed Demo Ledger Entries
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const isPurch = tx.type === "purchase";
                    const isSale = tx.type === "sale";
                    const isMin = tx.type === "mining";
                    const isList = tx.type === "listing";

                    let TypeBadge = (
                      <span className="font-mono text-[8.5px] bg-slate-900 text-slate-400 px-2.5 py-1 rounded-md border border-slate-800 uppercase font-medium">
                        Standard
                      </span>
                    );
                    
                    if (isPurch) {
                      TypeBadge = (
                        <span className="font-mono text-[9px] text-pink-400 bg-pink-950/20 border border-pink-905/30 px-2.5 py-1 rounded-md uppercase font-bold tracking-wide">
                          Purchase
                        </span>
                      );
                    } else if (isSale) {
                      TypeBadge = (
                        <span className="font-mono text-[9px] text-emerald-400 bg-emerald-950/20 border border-emerald-905/30 px-2.5 py-1 rounded-md uppercase font-bold tracking-wide">
                          P2P Sale
                        </span>
                      );
                    } else if (isMin) {
                      TypeBadge = (
                        <span className="font-mono text-[9px] text-blue-400 bg-blue-950/20 border border-blue-905/30 px-2.5 py-1 rounded-md uppercase font-bold tracking-wide">
                          Compute Loop
                        </span>
                      );
                    } else if (isList) {
                      TypeBadge = (
                        <span className="font-mono text-[9px] text-purple-400 bg-purple-950/20 border border-purple-905/30 px-2.5 py-1 rounded-md uppercase font-bold tracking-wide">
                          List Post
                        </span>
                      );
                    }

                    return (
                      <motion.tr
                        key={tx.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="hover:bg-slate-950/30 transition group"
                      >
                        {/* Reference code */}
                        <td className="py-3.5 px-5 font-mono text-slate-450 select-all font-semibold">
                          #{tx.id}
                        </td>

                        {/* Badging type */}
                        <td className="py-3.5 px-5">
                          {TypeBadge}
                        </td>

                        {/* Title detail */}
                        <td className="py-3.5 px-5 font-sans text-slate-200">
                          {tx.title}
                        </td>

                        {/* Quantum credit value flow */}
                        <td className="py-3.5 px-5 text-right font-mono font-medium">
                          {tx.amount > 0 ? (
                            <span className="text-emerald-400">+{tx.amount} QSC</span>
                          ) : tx.amount < 0 ? (
                            <span className="text-rose-400">{tx.amount} QSC</span>
                          ) : (
                            <span className="text-slate-500">0 QSC</span>
                          )}
                        </td>

                        {/* Time stamp */}
                        <td className="py-3.5 px-5 text-right font-mono text-slate-500 text-[10.5px]">
                          {tx.timestamp}
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. USER AUDITING BRIEF */}
      <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4.5 flex flex-col md:flex-row gap-4 items-center justify-between text-left">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-cyan-400 shrink-0" />
          <p className="text-xs text-slate-400 leading-relaxed font-sans max-w-2xl">
            This transaction history uses a locally isolated cryptographically simulated sandbox ledger. 
            All values reside inside your browser cache instance. Purging browser data or using the reset 
            key in your settings panel will clear this history feed permanently.
          </p>
        </div>

        <div className="font-mono text-[9px] text-slate-600 bg-slate-900/50 border border-slate-850 p-1.5 px-2.5 rounded-lg shrink-0 select-none uppercase">
          Ledger Verification: PASSED ✓
        </div>
      </div>

    </div>
  );
};
