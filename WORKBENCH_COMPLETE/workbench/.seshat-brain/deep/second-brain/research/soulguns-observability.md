- type:: [[research]]
- topic:: [[agent observability]] [[test recording]] [[proof videos]] [[tracing]]
- session:: [[2026_06_02]]
- status:: complete
- repos-mined::
    - [[arize-ai/phoenix]] (30k★) — OpenTelemetry agent tracing, 30+ instrumentors, evals, spans/sessions
    - [[langfuse/langfuse]] (10k★) — LLM observability, ClickHouse storage, media files, scores, cost tracking
    - [[langchain-ai/langsmith-sdk]] (—) — @traceable decorator, run trees, datasets, pytest CI, feedback API
    - [[wandb/weave]] (—) — @weave.op decorator, calls, evals, media (images/audio/video/html), compare views
    - [[microsoft/playwright]] (70k★) — Trace viewer (DOM+network+console), video, screenshots, CI artifacts
    - [[cypress-io/cypress]] (48k★) — Time-travel command log, Dashboard, Test Replay, screenshot on failure

## Key Insights

### Agent Observability (Phoenix, LangFuse, LangSmith, Weave)
- All use same span/trace tree model: Thread → Trace → Span/Call/Run/Observation
- Phoenix: OpenTelemetry-native, 30+ framework instrumentors via OpenInference, session.id grouping
- LangFuse: ClickHouse + Postgres + S3, media file upload (images/audio/video/PDF), prompt management, cost tracking via pricing tiers
- LangSmith: @traceable decorator (3 levels from env vars to RunTree API), pytest plugin, dataset/experiment workflow, attachment bytes
- Weave: @weave.op with kind/color, weave.Model (versioned params), weave.thread() for conversations, Content[bytes] for media

### Test Recording (Playwright, Cypress)
- Playwright trace.zip: NDJSON actions + network + DOM snapshots + screenshots + source maps
- Playwright trace viewer: self-hostable (static files), trace.playwright.dev (online), show-trace CLI
- Playwright video: WebM (VP9), configure size, action annotations overlay
- Cypress: time-travel via Command Log (DOM snapshots per command), Dashboard for cloud recording, Test Replay for interactive CI debugging
- CI artifact strategy: trace on-first-retry, video retain-on-failure, screenshot on failure

### Publishing Proof on Website
- Embed Playwright trace viewer: `<iframe src="/trace-viewer/?trace=<url>">`
- Self-host trace viewer by copying playwright-core's bundled viewer
- Host videos/screenshots on S3/R2, embed with `<video>` and `<img>` tags
- Observability platforms provide shareable URLs (Weave, LangSmith, LangFuse, Phoenix)
- Full proof page template: interactive trace + video + screenshots + metadata

### Key Patterns
- info:: trace + video combo for proof — interactive replay (zip) + passive viewing (webm)
- info:: eval-driven CI gates — fail on quality thresholds, attach traces to PRs
- info:: static hosting for artifacts — no special server needed, just storage bucket
- info:: session IDs for multi-turn agent conversations — all platforms support thread grouping

## Patterns Extracted
See `~/.config/opencode/skills/soulguns-observability/SKILL.md` — 5 major sections covering all 6 repos with cross-tool comparison table and proof page template.
