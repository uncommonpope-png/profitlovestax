type:: [[soul-note]]
created:: 2026-07-21
tags:: notebooklm, scribe, knowledge, rag

## SCRIBE NotebookLM Capabilities

**Summary:** SCRIBE now has 5 NotebookLM-style endpoints for grounded knowledge access: citations, briefing, timeline, FAQ, study guide

---

## SCRIBE NotebookLM Capabilities - Built 2026-07-21

### 1. Citations in /think (grounded answers)
Brain sources injected as [Source N: category/name]; response includes 
otebook.sources_consulted with file paths

### 2. GET /notebook (overview)
Source count, categories, last scan, recent sessions, capability catalog

### 3. GET /briefing?days=7 (session summary)
Recent sessions, soul gun/pattern counts, date-filtered

### 4. GET /timeline?limit=30 (chronological view)
Unified timeline of journal entries + memory events

### 5. POST /faq (FAQ generation)
{topic} -> 8 QA pairs with source citations

### 6. POST /study-guide (capability catalog)
{focus} -> 3-section guide: Soul Guns / Patterns / Soul Notes

### Architecture
All proxy through SCRIBE (:4000) to Seshat Brain API (:5000). Graceful degradation.

---

— noted by **GSK** · 2026-07-21
