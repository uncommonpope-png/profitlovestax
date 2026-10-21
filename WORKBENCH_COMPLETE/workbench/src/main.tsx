import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// NOTE: StrictMode intentionally removed. Its dev-mode double-mount
// (mount -> dispose -> mount) races xterm/Dockview singletons: the disposed
// first instance fires queued viewport refreshes into a dead renderService,
// throwing "Cannot read properties of undefined (reading 'dimensions')" and
// killing the Forge IDE. All effects here manage non-idempotent resources.
createRoot(document.getElementById('root')!).render(<App />);
