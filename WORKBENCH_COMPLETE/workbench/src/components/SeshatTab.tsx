import React, { useState, useEffect } from "react";
import { 
  Search, Brain, Zap, BookOpen, Loader2, 
  ChevronDown, ChevronUp, Copy, Check, 
  FileText, Sparkles, Database, Terminal
} from "lucide-react";

interface SeshatResult {
  text: string;
  score: number;
  source: string;
  chunkIndex: number;
}

interface SeshatTabProps {
  accentColor: string;
}

export const SeshatTab: React.FC<SeshatTabProps> = ({ accentColor }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SeshatResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'search' | 'reason' | 'synthesize'>('search');
  const [reasonResult, setReasonResult] = useState("");
  const [history, setHistory] = useState<{q:string, a:string, t:number}[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await window.electronAPI.invoke('seshat-search', { 
        query, 
        topK: 10 
      });
      setResults(res.results || []);
    } catch (err) {
      console.error('Search error:', err);
    }
    setLoading(false);
  };

  const handleReason = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      // Search first, then reason with context
      const searchRes = await window.electronAPI.invoke('seshat-search', { 
        query, 
        topK: 5 
      });
      const context = searchRes.results?.map((r: any) => r.text).join('\n---\n') || '';
      
      const res = await window.electronAPI.invoke('seshat-reason', { 
        prompt: query, 
        context 
      });
      setReasonResult(res.response || res.text || JSON.stringify(res));
      
      setHistory(prev => [{ q: query, a: reasonResult, t: Date.now() }, ...prev].slice(0, 20));
    } catch (err) {
      console.error('Reason error:', err);
    }
    setLoading(false);
  };

  const handleSynthesize = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const searchRes = await window.electronAPI.invoke('seshat-search', { 
        query, 
        topK: 10 
      });
      const sources = searchRes.results?.map((r: any) => r.text) || [];
      
      const res = await window.electronAPI.invoke('seshat-synthesize', { 
        topic: query, 
        sources 
      });
      setReasonResult(res.synthesized || res.result || JSON.stringify(res));
    } catch (err) {
      console.error('Synthesize error:', err);
    }
    setLoading(false);
  };

  const handleAction = () => {
    if (mode === 'search') handleSearch();
    else if (mode === 'reason') handleReason();
    else handleSynthesize();
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      background: '#0a0a0f',
      fontFamily: 'JetBrains Mono, monospace'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: `1px solid ${accentColor}33`,
        background: 'rgba(10,10,15,0.9)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: 40, height: 40,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}88)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Brain size={20} style={{ color: '#000' }} />
          </div>
          <div>
            <h2 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: 600 }}>
              SESHAT — Memory & Reasoning
            </h2>
            <p style={{ margin: '4px 0 0', color: '#888', fontSize: '12px' }}>
              Local Qwen 0.8B • 339 Profit Bible vectors • Zero token burn
            </p>
          </div>
        </div>
      </div>

      {/* Mode Tabs */}
      <div style={{
        display: 'flex',
        padding: '0 24px',
        borderBottom: `1px solid ${accentColor}22`,
        background: '#0a0a0f'
      }}>
        {['search', 'reason', 'synthesize'].map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setResults([]); setReasonResult(''); }}
            style={{
              padding: '10px 20px',
              background: mode === m ? `${accentColor}22` : 'transparent',
              border: 'none',
              color: mode === m ? accentColor : '#666',
              fontSize: '13px',
              fontWeight: mode === m ? 600 : 400,
              cursor: 'pointer',
              borderBottom: mode === m ? `2px solid ${accentColor}` : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            {m === 'search' && <Search size={14} style={{display:'inline-block',marginRight:6}} />}
            {m === 'reason' && <Sparkles size={14} style={{display:'inline-block',marginRight:6}} />}
            {m === 'synthesize' && <Zap size={14} style={{display:'inline-block',marginRight:6}} />}
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {/* Query Input */}
      <div style={{ padding: '16px 24px', borderBottom: `1px solid ${accentColor}11` }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAction()}
            placeholder={mode === 'search' ? 'Search Profit Bible... (semantic + keyword)' : 
                         mode === 'reason' ? 'Ask Seshat to reason with Profit Bible context...' : 
                         'Synthesize insights from Profit Bible...'}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: '#111',
              border: `1px solid ${accentColor}33`,
              borderRadius: 8,
              color: '#fff',
              fontSize: '14px',
              fontFamily: 'inherit',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
          />
          <button
            onClick={handleAction}
            disabled={loading || !query.trim()}
            style={{
              padding: '12px 24px',
              background: loading ? '#333' : accentColor,
              border: 'none',
              borderRadius: 8,
              color: '#000',
              fontSize: '14px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s'
            }}
          >
            {loading ? <Loader2 size={18} style={{animation:'spin 1s linear infinite'}} /> : 
              mode === 'search' ? <Search size={18} /> : 
              mode === 'reason' ? <Sparkles size={18} /> : <Zap size={18} />}
          </button>
        </div>
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
        {mode === 'search' && results.length > 0 && (
          <div>
            <h4 style={{ color: accentColor, marginBottom: '12px', fontSize: '13px' }}>
              <Search size={14} style={{display:'inline-block',marginRight:6}} />
              Found {results.length} matches
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {results.map((r, i) => (
                <div key={i} style={{
                  background: '#111',
                  border: `1px solid ${accentColor}22`,
                  borderRadius: 8,
                  padding: '12px 16px',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <span style={{ 
                      color: accentColor, 
                      fontSize: '12px', 
                      fontWeight: 600,
                      minWidth: '30px'
                    }}>
                      #{i + 1}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        color: '#ddd', 
                        fontSize: '13px', 
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap'
                      }}>
                        {r.text}
                      </div>
                      <div style={{ 
                        marginTop: '8px', 
                        display: 'flex', 
                        gap: '12px', 
                        fontSize: '11px', 
                        color: '#666'
                      }}>
                        <span>Score: {r.score.toFixed(3)}</span>
                        <span>Source: {r.source}</span>
                        <span>Chunk: {r.chunkIndex}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(r.text)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#666',
                        cursor: 'pointer',
                        padding: '4px',
                        opacity: 0.6,
                        transition: 'opacity 0.2s'
                      }}
                      onMouseOver={e => e.currentTarget.style.opacity = '1'}
                      onMouseOut={e => e.currentTarget.style.opacity = '0.6'}
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(mode === 'reason' || mode === 'synthesize') && reasonResult && (
          <div>
            <h4 style={{ color: accentColor, marginBottom: '12px', fontSize: '13px' }}>
              {mode === 'reason' ? <Sparkles size={14} style={{display:'inline-block',marginRight:6}} /> : <Zap size={14} style={{display:'inline-block',marginRight:6}} />}
              Seshat's Response
            </h4>
            <div style={{
              background: '#0d0d14',
              border: `1px solid ${accentColor}33`,
              borderRadius: 8,
              padding: '20px',
              minHeight: '200px'
            }}>
              <div style={{ 
                color: '#e0e0e0', 
                fontSize: '14px', 
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
                fontFamily: 'JetBrains Mono, monospace'
              }}>
                {reasonResult}
              </div>
              <div style={{ 
                marginTop: '16px', 
                paddingTop: '16px', 
                borderTop: `1px solid ${accentColor}22`,
                display: 'flex', 
                gap: '12px' 
              }}>
                <button
                  onClick={() => navigator.clipboard.writeText(reasonResult)}
                  style={{
                    padding: '8px 16px',
                    background: 'transparent',
                    border: `1px solid ${accentColor}55`,
                    borderRadius: 6,
                    color: accentColor,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Copy size={14} /> Copy
                </button>
                <button
                  onClick={() => {
                    setHistory(prev => [{q: query, a: reasonResult, t: Date.now()}, ...prev].slice(0, 20));
                  }}
                  style={{
                    padding: '8px 16px',
                    background: accentColor,
                    border: 'none',
                    borderRadius: 6,
                    color: '#000',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Check size={14} style={{display:'inline-block',marginRight:4}} /> Save to History
                </button>
              </div>
            </div>
          </div>
        )}

        {results.length === 0 && !reasonResult && !loading && (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px', 
            color: '#444' 
          }}>
            <Database size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>
              {mode === 'search' ? 'Search the Profit Bible with semantic + keyword search' : 
               mode === 'reason' ? 'Ask Seshat to reason using Profit Bible context' : 
               'Synthesize insights from multiple Bible passages'}
            </p>
            <p style={{ fontSize: '13px', color: '#666' }}>
              339 vectors indexed • Local Qwen 0.8B • No external calls
            </p>
          </div>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div style={{ 
          borderTop: `1px solid ${accentColor}11`, 
          padding: '16px 24px',
          maxHeight: '200px',
          overflow: 'auto'
        }}>
          <h4 style={{ color: accentColor, marginBottom: '12px', fontSize: '13px' }}>
            <Terminal size={14} style={{display:'inline-block',marginRight:6}} />
            Session History
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {history.slice(0, 10).map((h, i) => (
              <div key={i} style={{
                background: '#111',
                border: `1px solid ${accentColor}11`,
                borderRadius: 6,
                padding: '10px 12px',
                fontSize: '12px'
              }}>
                <div style={{ color: accentColor, marginBottom: '4px' }}>
                  Q: {h.q.substring(0, 100)}{h.q.length > 100 ? '...' : ''}
                </div>
                <div style={{ color: '#888', fontSize: '11px' }}>
                  A: {h.a.substring(0, 150)}{h.a.length > 150 ? '...' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};