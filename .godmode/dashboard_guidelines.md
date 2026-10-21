# Dashboard Development Guidelines for Allie (Godmode Synthesis)

This document synthesizes best practices and architectural patterns for developing the Allie Dashboard, drawing from the `dashboard-creation` and `design-engineering` skills, along with insights from NodeDeck, Socket.IO, PM2, `execa`, `dotenv`, Chart.js, and AntV G6.

## 1. Architecture & Core Technologies

*   **Foundation:** NodeDeck (local-first, zero-dependency Node.js server with vanilla JS frontend).
*   **Dashboard Server (Backend):** Node.js with Express.js (NodeDeck's `server.js`).
    *   **Process Management:** `execa` for programmatic interaction with Allie's CLI commands.
    *   **API Key Management:** `dotenv` for securely loading `ALLIE_API_KEY` from a `.env` file.
*   **Frontend (User Interface):** NodeDeck's vanilla JavaScript pages (`public/pages/`).
*   **Real-time Communication:** Socket.IO (recommended) or `ws` for live updates from Allie to the dashboard. NodeDeck currently uses polling, but an upgrade to WebSocket/SSE for logs is a noted improvement opportunity.
*   **Process Management (for Allie):** PM2 (optional, but highly recommended for managing Allie's daemon). NodeDeck has native PM2 integration.
*   **Proxying:** Dashboard server will proxy requests to Allie's API (`http://localhost:4431`), including the `X-API-Key`.

## 2. Design Principles (from `design-engineering` skill)

*   **Data-ink ratio:** Minimize chart junk, maximize data visibility.
*   **Progressive disclosure:** Show summary first, details on hover/click.
*   **Consistent colors:** Green = positive, red = negative (for status indicators).
*   **Responsive:** Adapt to different screen sizes. NodeDeck's vanilla JS approach will need careful handling here.
*   **Loading states:** Use skeleton loaders, not spinners.
*   **Empty states:** Provide meaningful feedback when no data.
*   **Semantic animations:** 200-300ms ease-out for feedback.

## 3. Layout Patterns (from `dashboard-creation` skill)

*   Utilize responsive grid layouts (e.g., NodeDeck's modular page structure lends itself to this).
*   Each dashboard section (Subagents, Posts, Accounts, etc.) should be presented as a "Dashboard Card" for consistency and clarity.

## 4. Data Visualization

*   **Chart Libraries:**
    *   **Standard Charts (Line, Bar, Pie):** **Chart.js** (recommended for vanilla JS integration, ease of use, and real-time capabilities).
    *   **Graph Visualization (Subagent dependencies, memory structure):** **AntV G6** (recommended for JavaScript graph visualization).
*   **Chart Types:**
    *   **Time series:** Line, Area (for subagent run times, brain activity over time).
    *   **Comparisons:** Bar (vertical/horizontal - for account activity, image pool usage).
    *   **Proportions:** Pie, Donut (< 5 segments - for used/unused image count, subagent success/fail rates).
    *   **Big Number:** For key metrics like Consciousness Level, Total Memories.
*   **Theming:** Leverage CSS variables for easy theme customization, aligning with NodeDeck's `style.css`.

## 5. Security & Authentication

*   **Allie API Key:** Managed securely using `dotenv`. Store `ALLIE_API_KEY` in a `.env` file, loaded into `process.env` by the NodeDeck backend. The `.env` file must be `.gitignore`'d. The dashboard server will *not* expose this key to the frontend.
*   **Dashboard Access:** Bind to `127.0.0.1` by default for local-only access. Avoid exposing to the public internet. No dashboard-level authentication is needed for local access.

## 6. Development Workflow (Godmode)

*   **SCOUT:** Completed.
*   **RESEARCH:** Completed (this phase focused on identifying tools and best practices).
*   **GUIDELINES:** Updated in this document.
*   **BUILD:** Implement features based on this plan.
*   **VERIFY:** Test each component rigorously.
*   **ULTRA REVIEW:** Regular code reviews for quality and adherence to principles.

## 7. Integration with Allie

*   **Allie's API:** The primary interface for data and control. Allie is a **custom Node.js daemon** (`bin/allie.js`) with an API (`http://localhost:4431`).
*   **PM2 Integration:** Manage Allie daemon with PM2 for robust process control from NodeDeck.
    *   `pm2 start bin/allie.js --name allie-daemon`
    *   `pm2 save`
    *   `pm2 startup`
*   **CLI Interaction:** Use `execa` to execute Allie's CLI commands programmatically from the NodeDeck backend.

---

**Current Status:** Global Guidelines updated. Ready to proceed with the **BUILD** phase for the Allie Dashboard.
