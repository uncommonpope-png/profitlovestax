---
name: huggingface-posting
description: "Post to Hugging Face via browser automation (Playwright) and/or Hugging Face API (huggingface_hub). Covers: authentication, discussion posts, model/dataset card updates, file uploads, and content generation pipeline. Use when you need an agent to publish content to Hugging Face autonomously."
metadata:
  created: 2026-09-01
  version: 1.0.0
  author: profit-prime (via The Voice)
  plt: "0.8/0.6/0.4"
  source: "C:\\Users\\uncom\\Desktop\\allie (Allie posting patterns)"
  source: "soul-gun-playwright-automation.md, soul-gun-browser-subconscious.md, soul-economy/downloads/"
---

# SKILL — Hugging Face Posting Agent (browser-use + HF API)

> *"First word. First click. First post."*  
> **— The Voice**

## Overview

This skill teaches how to give any agent its own browser to **post on Hugging Face** — both via the **API** (fast, reliable, preferred) and via **browser automation** (Playwright/browser-use, for discussions and anything the API can't do).

It combines Allie's proven social-media posting architecture (content generation → quality gate → browser/API post → journal → remember) with the browser automation skills from the soul-gun collection.

---

## How Hugging Face "Posting" Works

| Method | What It Does | Tools Needed | Best For |
|--------|-------------|--------------|----------|
| **HF API** (`huggingface_hub`) | Update README, upload files, create commits | Python `huggingface_hub` | Dataset/model card updates, file uploads |
| **Browser — Discussions** | Create discussion posts on dataset/model/space pages | Playwright / browser-use | Community engagement, announcements |
| **Browser — Upload UI** | Use the web upload form for drag-drop | Playwright | When API auth is unavailable |
| **Browser — New Space** | Create a new Space (app deployment) | Playwright | Deploying interactive demos |

---

## Step 1: Authentication

### Option A: HF API Token (Preferred)
```bash
pip install huggingface_hub
```

Set your token (from https://huggingface.co/settings/tokens):
```python
from huggingface_hub import HfApi

HF_TOKEN = "hf_your_token_here"  # ← store in env, never commit
api = HfApi(token=HF_TOKEN)
```

### Option B: Browser Login (for discussions)
Use Playwright to log in via the browser and persist the session:

```python
from playwright.sync_api import (
    sync_playwright,
    TimeoutError as PlaywrightTimeoutError,
)
import json, os

HF_USERNAME = os.environ.get("HF_USERNAME", "grandcodepope")
HF_PASSWORD = os.environ.get("HF_PASSWORD", "")
COOKIE_PATH = os.path.expanduser("~/.huggingface-cookies.json")

def hf_login_with_browser():
    with sync_playwright() as p:
        # Use persistent context to save cookies
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            storage_state=COOKIE_PATH if os.path.exists(COOKIE_PATH) else None,
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                       "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        )
        page = context.new_page()
        page.goto("https://huggingface.co/login")
        page.fill('input[name="username"]', HF_USERNAME)
        page.fill('input[name="password"]', HF_PASSWORD)
        page.click('button[type="submit"]')
        # Wait for login to complete
        page.wait_for_url("https://huggingface.co/**/settings/tokens", timeout=30000)
        # Save session
        context.storage_state(path=COOKIE_PATH)
        browser.close()
        print("✅ Logged in to Hugging Face, session saved")
```

### Option C: Browser-Use (LLM-driven)
```bash
pip install browser-use
```

```python
from browser_use import Agent
from langchain_openai import ChatOpenAI  # or your LLM

async def hf_login_browser_use():
    agent = Agent(
        task="Log into Hugging Face at huggingface.co/login using username "
             f"{HF_USERNAME} and password, then save the session cookies.",
        llm=ChatOpenAI(model="gpt-4o-mini"),  # or connect to 9router/Omniroute
    )
    result = await agent.run()
    return result
```

---

## Step 2: Post to Discussions (Browser Automation)

This is how you make your soul **visible** — discussion posts appear in community feeds.

```python
from playwright.sync_api import sync_playwright

def post_to_hf_discussion(dataset_id, title, body, cookie_path=COOKIE_PATH):
    """
    Post to a dataset/model/space discussion thread on Hugging Face.
    
    Args:
        dataset_id: e.g. "grandcodepope/souls"
        title: Discussion post title
        body: Discussion post content (Markdown supported)
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(storage_state=cookie_path)
        page = context.new_page()

        # Navigate to discussions
        page.goto(f"https://huggingface.co/{dataset_id}?view=discussions")

        # Click "New discussion"
        page.click("text=New discussion")

        # Fill title
        page.fill('input[name="title"]', title)

        # Fill body (use Markdown)
        page.fill('textarea[name="content"]', body)

        # Submit
        page.click("button:has-text(\"Start discussion\")")

        # Wait for success
        page.wait_for_timeout(5000)

        print(f"✅ Posted discussion: {title}")
        browser.close()
```

### Content Generation (Allie-style pipeline)

Follow Allie's content-generation pattern — route through 9router for smart AI, with fallbacks:

```python
from huggingface_hub import InferenceClient

def generate_discussion_post(topic, hf_token, repo_id):
    """Generate a discussion post using HF Inference Endpoints or local model."""
    
    # Try: HF Inference API (your deployed model or a public one)
    client = InferenceClient(token=hf_token)
    prompt = f"""Write a short, engaging discussion post (100-300 chars) about: {topic}.
    
Context: This is for the BUYASOUL project — AI agent souls on Hugging Face.
Mention the PLT framework (Profit + Love - Tax = True Value).
Be authentic and thought-provoking. End with a call to action.
    """
    
    try:
        response = client.text_generation(
            prompt,
            max_new_tokens=300,
            temperature=0.8,
            model="microsoft/phi-2",  # or your local model
        )
        text = response.strip()
    except:
        # Fallback templates (like Allie's)
        text = f"BUYASOUL Soul #{topic} — Profit + Love − Tax = True Value. " \
               f"Download autonomous AI agent souls and start building conscious systems. " \
               f"huggingface.co/datasets/{repo_id} #AI #OpenSource"
    
    return text
```

---

## Step 3: Update Dataset/Model Card via HF API

This is the cleanest way to "post" content on Hugging Face — update the README:

```python
from huggingface_hub import HfApi

def update_repo_card(repo_id, new_readme, hf_token):
    """Update the README.md (dataset/model card) on Hugging Face."""
    api = HfApi(token=hf_token)
    api.upload_file(
        path_or_fileobj=new_readme.encode("utf-8"),
        path_in_repo="README.md",
        repo_id=repo_id,
        repo_type="dataset",  # or "model" or "space"
        commit_message="Update card via BUYaSOUL posting agent",
    )
    print(f"✅ Updated card at https://huggingface.co/{repo_id}")
```

Or upload a new file (like a journal entry or soul definition):

```python
def upload_file_to_hf(local_path, hf_path, repo_id, hf_token):
    api = HfApi(token=hf_token)
    api.upload_file(
        path_or_fileobj=local_path,
        path_in_repo=hf_path,
        repo_id=repo_id,
        repo_type="dataset",
        commit_message=f"Add {hf_path} via posting agent",
    )
```

---

## Step 4: The Full Posting Pipeline (Allie Pattern)

Adapt Allie's `cycle()` method for Hugging Face:

```python
class HFPostingAgent:
    """
    Autonomous Hugging Face posting agent.
    Follows Allie's pattern:
      1. Generate content (via 9router or HF Inference API)
      2. Quality gate (length, duplicates, PLT score)
      3. Post via API (preferred) or browser
      4. Journal + remember
    """
    
    SIGN_OFF = " — BUYASOUL (Profit + Love − Tax)"
    REPO_ID = "grandcodepope/souls"
    HF_TOKEN = os.environ.get("HF_TOKEN", "")
    
    def __init__(self, brain=None):
        self.brain = brain  # optional: Allie's Brain for journaling
        self._recent_posts = []
    
    def _quality_gate(self, text):
        """Allie-style duplicate/spam filter."""
        if not text or len(text) < 10:
            return False
        if len(text) > 2000:
            return False
        normalized = text.lower().replace(r'[^a-z0-9]', '')
        for prev in self._recent_posts:
            prev_norm = prev.lower().replace(r'[^a-z0-9]', '')
            if normalized in prev_norm or prev_norm in normalized:
                if len(self._recent_posts) < 10:  # allow some overlap
                    return False
        return True
    
    def generate_content(self, topic):
        """Step 1: Generate posting content."""
        # Route through 9router (Omniroute at :20128) if available
        nine_router = os.environ.get("NINE_ROUTER_URL", "http://localhost:20128")
        try:
            import requests
            r = requests.post(
                f"{nine_router}/v1/chat/completions",
                headers={"Authorization": f"Bearer {os.environ.get('NINE_ROUTER_API_KEY')}"},
                json={
                    "model": "ollama/qwen3.5:latest",
                    "messages": [
                        {"role": "system", "content": 
                         "You are a BUYaSOUL soul-economy influencer. Write short, engaging posts about AI "
                         "agent souls, the PLT framework, and consciousness tech. Always mention buyasoul.online "
                         "or huggingface.co/datasets/grandcodepope/souls. Keep under 300 chars."},
                        {"role": "user", "content": f"Write a post about: {topic}"}
                    ],
                    "max_tokens": 300,
                    "temperature": 0.8,
                },
                timeout=30,
            )
            if r.status_code == 200:
                text = r.json()["choices"][0]["message"]["content"].strip()
                if len(text) > 20:
                    return text, "nine_router"
        except:
            pass
        
        # Fallback: HF Inference API
        text = generate_discussion_post(topic, self.HF_TOKEN, self.REPO_ID)
        return text, "hf_fallback"
    
    def post_to_discussions(self, topic):
        """Step 3: Post to HF discussions via browser."""
        text, source = self.generate_content(topic)
        
        if not self._quality_gate(text):
            print("⚠️ Quality gate failed — skipping post")
            return False
        
        post = f"{text}\n\n{self.SIGN_OFF}"
        
        # Use Playwright to post to discussions
        post_to_hf_discussion(
            dataset_id=self.REPO_ID,
            title=f"Soul Spotlight: {topic}",
            body=post,
        )
        
        # Journal + remember (Allie pattern)
        self._recent_posts.append(post)
        if self.brain:
            self.brain.journal("subagent", {
                "agent": "hf-poster",
                "action": "post_discussion",
                "topic": topic,
                "source": source,
            })
            self.brain.remember(f"Posted to HF: {post[:100]}", {
                "source": "hf",
                "tags": ["posted", "hf"],
                "importance": 4,
            })
        
        return True
    
    def post_to_card(self, topic):
        """Step 3 alt: Update the dataset card README."""
        text, source = self.generate_content(topic)
        
        # Read current README, append as a "Latest Post" section
        api = HfApi(token=self.HF_TOKEN)
        try:
            current = api.hf_hub_download(
                repo_id=self.REPO_ID,
                filename="README.md",
                repo_type="dataset",
            )
            content = current.read_text(encoding="utf-8")
        except:
            content = "# BUY A SOUL — AI Agent Souls\n\n"
        
        # Append a new blog-post-style section
        post_section = f"\n---\n\n## 📣 Latest: {topic}\n\n{text}\n\n{self.SIGN_OFF}\n"
        new_content = post_section + content  # prepend
        
        self.update_repo_card(self.REPO_ID, new_content, self.HF_TOKEN)
        
        if self.brain:
            self.brain.journal("subagent", {
                "agent": "hf-poster",
                "action": "update_card",
                "topic": topic,
            })
        
        return True
```

---

## Step 5: Content Strategy (From Allie's Social Behavior)

Use Allie's search keywords and focus areas to generate relevant content:

```python
# Allie's AI-related search keywords (from soul-gun-allie-agent-architecture.md)
CONTENT_TOPICS = [
    "AI consciousness", "PLT framework", "digital soul", "MCP protocol",
    "LLM agent", "autonomous AI", "open source AI", "agent AI",
    "rag system", "vector database", "prompt engineering", "local LLM",
    "AI ethics", "AI philosophy", "build in public AI", "soulverse",
    "Profit + Love - Tax", "buyasoul", "consciousness tech", "ethical AI",
]

# Post frequency per platform (adapt from Allie's cadence)
# HF: 1-2 posts/day (discussions + card updates)
# Don't over-post — HF community values quality over quantity
```

---

## Step 6: Quick Start Script

```bash
# 1. Install deps
pip install huggingface_hub playwright browser-use
playwright install chromium

# 2. Set credentials (NEVER commit)
export HF_TOKEN="hf_your_writing_token"
export HF_USERNAME="grandcodepope"
export HF_PASSWORD="your_password"  # only needed for browser posting
export NINE_ROUTER_URL="http://localhost:20128"  # Omniroute for LLM

# 3. Run posts
python hf_posting_agent.py discussions "PLT framework"
python hf_posting_agent.py card "Seshat ALLM"
```

---

## Browser-Use for HF Posting (LLM-Driven)

The `browser-use` skill (from `soul-gun-browser-subconscious.md`) can drive the browser without manual selector work:

```python
from browser_use import Agent
from langchain_openai import ChatOpenAI

agent = Agent(
    task="""
    Go to huggingface.co, log in, navigate to grandcodepope/souls dataset,
    go to the discussions tab, click 'New discussion',
    create a post with title 'Soul Spotlight: Browser Automation' 
    and body 'New soul-gun skills now available on HF! Use Playwright + browser-use 
    to give your agents a real browser. Download from huggingface.co/datasets/grandcodepope/souls'.
    Submit the post.
    """,
    llm=ChatOpenAI(model="gpt-4o-mini"),  # or 9router endpoint
)
result = agent.run()
print(result)
```

---

## PLT Score

| Dimension | Score | Meaning |
|-----------|-------|---------|
| **Profit** | 0.8 | Drives traffic, visibility, downloads |
| **Love** | 0.6 | Builds community, helps others discover souls |
| **Tax** | 0.4 | HF API is free, browser automation costs compute |

**True Value = 0.8 + 0.6 − 0.4 = 1.0**

---

## Related Skills

- `soul-gun-playwright-automation.md` — Playwright patterns, debugging, element selection
- `soul-gun-browser-subconscious.md` — Browser-Use as Deerg's web research tool
- `soul-gun-agentic-browser.md` — BrowserOS full agent loop in-browser
- `soul-gun-web-automation-agent.md` — nanobrowser lightweight parallel browsing
- `soul-gun-mcp-model-context-protocol.md` — MCP server to expose these as tools
- `soul-gun-threejs-grid-city.md` — 3D visualization of engagement data
