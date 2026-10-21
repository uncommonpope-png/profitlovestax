import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldX } from 'lucide-react';

type DeadlockIncident = {
  id: string;
  signature: string;
  triggeredBy: string;
  timestamps: number[];
  detectedAt: string;
  actionCount: number;
};

type Props = {
  active: boolean;
  incidents: DeadlockIncident[];
  onRelease: () => void;
};

export const DeadlockOverlay: React.FC<Props> = ({ active, incidents, onRelease }) => {
  const [timeSinceDetection, setTimeSinceDetection] = useState<number>(0);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      if (incidents.length > 0) {
        const last = incidents[incidents.length - 1];
        const elapsed = Date.now() - new Date(last.detectedAt).getTime();
        setTimeSinceDetection(elapsed >= 0 ? elapsed : 0);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [active, incidents]);

  if (!active) return null;

  const latest = incidents[incidents.length - 1];

  return (
    <div className="absolute inset-0 z-[9999] flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
      {/* Amber Grid Overlay */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 193, 7, 0.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 193, 7, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />

      {/* Containment Banner */}
      <div className="relative z-10 max-w-xl mx-auto p-8 bg-slate-950 border-2 border-amber-400/80 rounded-xl shadow-2xl text-center">
        <div className="flex justify-center mb-4">
          <ShieldX className="w-12 h-12 text-amber-400 animate-pulse" />
        </div>

        <h2 className="text-2xl font-bold text-amber-300 mb-2 tracking-wider">
          SEMANTIC DEADLOCK DETECTED
        </h2>

        <p className="text-slate-300 text-sm mb-6 leading-relaxed">
          Recursive failure loop isolated.<br />
          <span className="text-amber-200 font-mono break-all">
            {latest?.signature || "Unknown pattern"}
          </span>
        </p>

        <div className="flex flex-col gap-3 mb-6 text-xs font-mono text-slate-400">
          <div>
            <span className="text-slate-500">Loop Count:</span>{' '}
            <span className="text-amber-300">{latest?.actionCount || 0}</span>
          </div>
          <div>
            <span className="text-slate-500">Detected:</span>{' '}
            <span className="text-amber-300">{timeSinceDetection}s ago</span>
          </div>
          <div>
            <span className="text-slate-500">Status:</span>{' '}
            <span className="text-red-400">QUARANTINED</span>
          </div>
        </div>

        <button
          onClick={onRelease}
          className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold rounded-lg hover:from-yellow-400 hover:to-amber-500 transition-all duration-200 focus:ring-2 focus:ring-amber-300 focus:outline-none"
        >
          RELEASE QUARANTINE
        </button>

        <p className="mt-4 text-[10px] text-slate-600 uppercase tracking-widest">
          Autopsy lesson injected into Scribe Vault
        </p>
      </div>
    </div>
  );
};
