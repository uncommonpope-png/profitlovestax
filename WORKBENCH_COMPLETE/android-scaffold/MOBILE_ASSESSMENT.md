# BUYaSOUL Mobile Wrapper Feasibility Assessment

## Current Stack
- Frontend: React 19 + Vite 6.2.3 + Tailwind CSS 4
- Backend: Node.js 22 + Express + esbuild
- Runtime: Web browser (localhost:3000 or Devvit Reddit)
- 3D: Three.js 0.184.0

## Recommended Approach: Capacitor

The BUYaSOUL system is a full-stack web app with Three.js, WebSocket, Express backend, and file-based persistence. Capacitor wraps it with zero code changes. The backend runs as a Node.js server (via @capacitor/community/capacitor-node) or can be extracted to a cloud endpoint. The frontend (React + Vite + Three.js) works identically in a WebView.

## Option Comparison

### Capacitor (Recommended)
Ionic Capacitor wraps existing web app in native WebView

**Pros:**
- Zero code changes to existing React/Vite frontend
- Keeps all existing APIs, Three.js, WebSocket, localStorage
- Native bridge for camera, filesystem, notifications
- Single codebase for web + mobile
- Fastest path to Play Store (weeks, not months)

**Cons:**
- WebView performance for Three.js may be lower than native
- No native UI components (all web-rendered)
- Larger APK size (~15-20MB overhead)

**APK Size:** ~25-30MB
**Time to First Build:** 1-2 hours

### React Native WebView
React Native shell with embedded WebView pointing to localhost

**Pros:**
- Access to native React Native modules
- Can mix native screens with web views
- Better performance than pure Capacitor for some use cases

**Cons:**
- Requires React Native project setup (separate from Vite)
- Must maintain two build systems (Vite + Metro)
- WebView communication adds complexity
- WebSocket connections may need special handling

**APK Size:** ~20-25MB
**Time to First Build:** 4-8 hours

### PWA (Progressive Web App)
Service worker + manifest for installable web app

**Pros:**
- No native wrapper needed
- Installable from browser
- Smallest footprint

**Cons:**
- Not on Play Store (only via browser install)
- Limited native API access
- No push notifications on all platforms

**APK Size:** N/A (web only)
**Time to First Build:** 30 minutes

## Blockers to Address

- Backend (Express server) needs to run either: (a) on device via Capacitor Node.js plugin, or (b) extracted to a cloud endpoint
- File system paths (Seshat pages, GSK data) need to be adapted for mobile storage
- SCRIBE server (:4000) and OmniRoute (:20128) need to be either bundled or cloud-hosted
