import React, { useState, useEffect } from 'react';

export const IdeTab: React.FC = () => {
  const [commandOpen, setCommandOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [code, setCode] = useState('// Forge Pro IDE Sovereign Stack');
  const [shadowDiff, setShadowDiff] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 font-mono">
      <header className="p-2 border-b border-slate-700 flex justify-between items-center">
        <span className="font-bold text-emerald-400">Forge Pro IDE</span>
        <button onClick={() => setCommandOpen(true)} className="px-3 py-1 bg-slate-800 rounded hover:bg-slate-700">
          Ctrl+Shift+P (Palette)
        </button>
      </header>
      <div className="flex-1 flex">
        <div className="w-1/4 border-r border-slate-700 p-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase">Explorer</h3>
        </div>
        <div className="flex-1 p-4 relative">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-full bg-slate-950 p-4 rounded text-slate-200 focus:outline-none font-mono"
          />
          {shadowDiff && (
            <div className="absolute inset-4 bg-emerald-950/80 p-4 rounded border border-emerald-500 overflow-auto">
              <h4 className="text-xs text-emerald-400 font-bold mb-2">Shadow Diff Preview</h4>
              <pre className="text-emerald-300">{shadowDiff}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default IdeTab;
