import React, { useEffect, useState } from "react";
import { ScrollText, Search, Filter, Download, Copy, ChevronDown, ChevronUp, Calendar, Tag, Brain, Zap, BookOpen } from "lucide-react";

interface JournalEntry {
  id: string;
  timestamp: string;
  content: string;
  plt?: string;
  source: 'soul' | 'auto' | 'memory';
  tags?: string[];
  weight?: number;
}

interface JournalTabProps {
  accentColor: string;
  providerConfig: any;
}

export const JournalTab: React.FC<JournalTabProps> = ({ accentColor, providerConfig }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState<'all' | 'soul' | 'auto' | 'memory'>('all');
  const [filterMinWeight, setFilterMinWeight] = useState(0);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({ total: 0, soul: 0, auto: 0, memory: 0 });

  useEffect(() => {
    fetchJournal();
  }, []);

  const fetchJournal = async () => {
    try {
      // Fetch from GSK APIs
      const [soulRes, autoRes, memoryRes] = await Promise.allSettled([
        fetch("/api/gsk/journal?source=soul"),
        fetch("/api/gsk/journal?source=auto"),
        fetch("/api/gsk/memories?limit=100"),
      ]);

      const allEntries: JournalEntry[] = [];

      if (soulRes.status === 'fulfilled' && soulRes.value.ok) {
        const data = await soulRes.value.json();
        (data.entries || []).forEach((e: any) => allEntries.push({
          id: `soul-${e.id || Math.random()}`,
          timestamp: e.timestamp || e.date || new Date().toISOString(),
          content: e.content || e.text || JSON.stringify(e),
          plt: e.plt,
          source: 'soul',
          tags: e.tags,
          weight: e.weight,
        }));
      }

      if (autoRes.status === 'fulfilled' && autoRes.value.ok) {
        const data = await autoRes.value.json();
        (data.entries || []).forEach((e: any) => allEntries.push({
          id: `auto-${e.id || Math.random()}`,
          timestamp: e.timestamp || e.date || new Date().toISOString(),
          content: e.content || e.text || JSON.stringify(e),
          plt: e.plt,
          source: 'auto',
          tags: e.tags,
          weight: e.weight,
        }));
      }

      if (memoryRes.status === 'fulfilled' && memoryRes.value.ok) {
        const data = await memoryRes.value.json();
        (data.memories || []).forEach((e: any) => allEntries.push({
          id: `memory-${e.id || Math.random()}`,
          timestamp: e.timestamp || e.createdAt || new Date().toISOString(),
          content: e.content || e.text || e.summary || JSON.stringify(e),
          plt: e.plt,
          source: 'memory',
          tags: e.tags,
          weight: e.weight || e.importance,
        }));
      }

      // Also load from Soul Economy local data
      try {
        const seRes = await fetch("/api/soul-economy/journal");
        if (seRes.ok) {
          const data = await seRes.json();
          (data.entries || []).forEach((e: any) => allEntries.push({
            id: `se-${e.id || Math.random()}`,
            timestamp: e.date || new Date().toISOString(),
            content: e.content || e.text || e.title || JSON.stringify(e),
            plt: e.plt,
            source: 'soul',
            tags: e.tags,
            weight: e.weight,
          }));
        }
      } catch {}

      allEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setEntries(allEntries);
      setStats({
        total: allEntries.length,
        soul: allEntries.filter(e => e.source === 'soul').length,
        auto: allEntries.filter(e => e.source === 'auto').length,
        memory: allEntries.filter(e => e.source === 'memory').length,
      });
    } catch (e) {
      console.error("Failed to fetch journal:", e);
    }
    setLoading(false);
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = !search || 
      entry.content.toLowerCase().includes(search.toLowerCase()) ||
      entry.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesSource = filterSource === 'all' || entry.source === filterSource;
    const matchesWeight = (entry.weight || 0) >= filterMinWeight;
    return matchesSearch && matchesSource && matchesWeight;
  });

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exportJournal = () => {
    const json = JSON.stringify(filteredEntries, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gsk-journal-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyEntry = (entry: JournalEntry) => {
    navigator.clipboard.writeText(`${entry.timestamp}\n${entry.content}\nPLT: ${entry.plt || 'N/A'}\nSource: ${entry.source}`);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 shadow-2xl relative overflow-hidden text-slate-100 flex flex-col h-full gap-6 hover:border-pink-500/20 transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-slate-950/50 border border-slate-800/60 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-slate-950 border flex items-center justify-center" style={{ borderColor: accentColor }}>
            <ScrollText className="w-6 h-6" style={{ color: accentColor }} />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white">Unified Journal</h2>
            <p className="text-slate-400 text-sm">Soul Journal · Auto Journal · Memory Ledger · {stats.total} entries</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportJournal} className="px-3 py-2 border border-slate-700 rounded-xl text-xs font-mono text-slate-300 hover:text-white hover:border-slate-500 transition-colors flex items-center gap-1">
            <Download className="w-3 h-3" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total} color={accentColor} icon={<ScrollText />} />
        <StatCard label="Soul" value={stats.soul} color="#8B5CF6" icon={<BookOpen />} />
        <StatCard label="Auto" value={stats.auto} color="#00D4FF" icon={<Zap />} />
        <StatCard label="Memory" value={stats.memory} color="#10B981" icon={<Brain />} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-slate-950/50 border border-slate-800/60 rounded-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search entries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500"
          />
        </div>
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value as any)}
          className="px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white"
        >
          <option value="all">All Sources</option>
          <option value="soul">Soul Journal</option>
          <option value="auto">Auto Journal</option>
          <option value="memory">Memory Ledger</option>
        </select>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Min Weight:</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={filterMinWeight}
            onChange={(e) => setFilterMinWeight(parseFloat(e.target.value))}
            className="w-32 accent-purple-500"
          />
          <span className="text-xs font-mono text-slate-400 w-10">{filterMinWeight.toFixed(1)}</span>
        </div>
      </div>

      {/* Entries List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-500">Loading journal...</div>
        ) : filteredEntries.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-slate-500">
            <p>No entries match your filters.</p>
          </div>
        ) : (
          <div className="space-y-3 p-1">
            {filteredEntries.map((entry) => (
              <JournalEntryItem
                key={entry.id}
                entry={entry}
                accentColor={accentColor}
                expanded={expandedIds.has(entry.id)}
                onToggle={() => toggleExpand(entry.id)}
                onCopy={() => copyEntry(entry)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; color: string; icon: React.ReactNode }> = ({ label, value, color, icon }) => (
  <div className="p-4 bg-slate-950/50 border border-slate-800/60 rounded-2xl text-center" style={{ borderColor: color }}>
    <div className="flex items-center justify-center gap-1 mb-1" style={{ color }}>
      {icon}
    </div>
    <div className="text-2xl font-bold font-mono" style={{ color }}>{value}</div>
    <div className="text-xs text-slate-400 uppercase tracking-wider">{label}</div>
  </div>
);

const JournalEntryItem: React.FC<{
  entry: JournalEntry;
  accentColor: string;
  expanded: boolean;
  onToggle: () => void;
  onCopy: () => void;
}> = ({ entry, accentColor, expanded, onToggle, onCopy }) => {
  const sourceColors = { soul: '#8B5CF6', auto: '#00D4FF', memory: '#10B981' };
  const sourceIcons = { soul: <BookOpen className="w-3 h-3" />, auto: <Zap className="w-3 h-3" />, memory: <Brain className="w-3 h-3" /> };
  
  return (
    <div className={`group p-4 bg-slate-900/50 border rounded-2xl transition-all ${expanded ? 'border-purple-500/30' : 'border-slate-800 hover:border-purple-500/30'}`} style={{ borderColor: expanded ? accentColor : undefined }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: sourceColors[entry.source] + '20', borderColor: sourceColors[entry.source] }}>
            {sourceIcons[entry.source]}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">{new Date(entry.timestamp).toLocaleString()}</span>
              <span className="px-2 py-0.5 text-xs font-mono rounded" style={{ background: sourceColors[entry.source] + '20', color: sourceColors[entry.source], borderColor: sourceColors[entry.source] }}>
                {entry.source.toUpperCase()}
              </span>
              {entry.plt && (
                <span className="px-2 py-0.5 text-xs font-mono rounded bg-slate-900 border border-slate-700" style={{ color: accentColor }}>
                  PLT: {entry.plt}
                </span>
              )}
              {entry.weight !== undefined && (
                <span className="px-2 py-0.5 text-xs font-mono rounded bg-slate-900 border border-slate-700 text-slate-400">
                  Weight: {entry.weight.toFixed(2)}
                </span>
              )}
            </div>
            <div className={`mt-2 text-slate-300 ${!expanded ? 'line-clamp-2' : ''}`}>
              {entry.content}
            </div>
            {entry.tags && entry.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {entry.tags.map((tag: string) => (
                  <span key={tag} className="px-2 py-0.5 text-xs bg-slate-900 border border-slate-700 rounded text-slate-400">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCopy}
            className="p-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
            title="Copy entry"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={onToggle}
            className="p-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};