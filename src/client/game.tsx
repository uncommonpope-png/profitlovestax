import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Workbench from './advanced/Workbench';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Workbench />
  </StrictMode>
);
