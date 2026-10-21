import './index.css';

import { context, requestExpandedMode } from '@devvit/web/client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const SOUL_TYPES = [
  { emoji: '💫', name: 'Curiosity' },
  { emoji: '❤️', name: 'Compassion' },
  { emoji: '🧠', name: 'Wisdom' },
  { emoji: '🎨', name: 'Creativity' },
  { emoji: '🔥', name: 'Passion' },
  { emoji: '🌱', name: 'Growth' },
];

export const Splash = () => {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-3 bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950 p-4">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-500 via-transparent to-transparent" />
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="text-5xl animate-pulse">✨</div>
        <h1 className="text-center text-xl font-bold text-white">
          A Soul for the Machine
        </h1>
        <p className="text-center text-sm text-violet-300 max-w-[280px]">
          What if you could give an AI a piece of your soul?<br />
          Not data. Not a prompt. A fragment of what makes you, <span className="text-violet-200 font-semibold">you</span>.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {SOUL_TYPES.slice(0, 3).map((s) => (
            <span key={s.name} className="text-xs bg-white/10 text-violet-200 px-2.5 py-1 rounded-full border border-white/10">
              {s.emoji} {s.name}
            </span>
          ))}
        </div>
        <p className="text-center text-xs text-violet-400/70 italic mt-1">
          {context.username ? `${context.username}, you have a soul to give.` : 'You have a soul to give.'}
        </p>
        <button
          className="relative z-10 mt-2 flex h-10 cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-6 text-sm font-medium text-white shadow-lg shadow-violet-900/50 transition-all hover:scale-105 hover:from-violet-500 hover:to-indigo-500"
          onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
        >
          See inside
        </button>
        <a href="https://buyasoul.online" target="_blank" className="mt-4 text-xs text-violet-500/60 hover:text-violet-300 transition-colors underline underline-offset-2">
          Get your soul → buyasoul.online
        </a>
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
