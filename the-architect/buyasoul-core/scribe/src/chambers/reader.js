'use strict';

/**
 * SCRIBE — Chamber Reader
 *
 * A chamber is any source of knowledge SCRIBE can read.
 * Repos, skill registries, ledgers, soul definitions, memory files —
 * all of them are chambers.
 *
 * SCRIBE does not execute chambers. It reads them.
 * Reading means: load → parse → index → understand structure → hold in working knowledge.
 *
 * Chamber types:
 *   'github_repo'   — a GitHub repository (read via API)
 *   'skill_registry'— a forgeclaw registry.json
 *   'soul_manifest' — a souls_ecosystem.json or agents.json
 *   'ledger'        — a JSONL event log
 *   'memory_file'   — a soul's personal memory JSON
 *   'local_dir'     — a local directory tree
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

class ChamberReader {
  constructor() {
    // Indexed knowledge: chamberKey → { type, name, contents, readAt, summary }
    this.chambers = new Map();

    // Known chambers from the ecosystem (pre-registered at boot)
    this.registry = [];
  }

  /**
   * Register a chamber for reading.
   * Registration does not read — it declares the chamber exists.
   */
  register(chamber) {
    this.registry.push({
      key: chamber.key || chamber.name.toLowerCase().replace(/\s+/g, '_'),
      ...chamber,
    });
    return this;
  }

  /**
   * Read all registered chambers.
   * Returns a summary of what was loaded.
   */
  async readAll() {
    const results = [];
    for (const def of this.registry) {
      try {
        const result = await this.read(def);
        results.push({ key: def.key, status: 'read', summary: result.summary });
      } catch (e) {
        results.push({ key: def.key, status: 'failed', error: e.message });
      }
    }
    return results;
  }

  /**
   * Read a single chamber definition.
   */
  async read(def) {
    let contents, summary;

    switch (def.type) {
      case 'github_repo':
        ({ contents, summary } = await this._readGithubRepo(def));
        break;
      case 'skill_registry':
        ({ contents, summary } = await this._readSkillRegistry(def));
        break;
      case 'soul_manifest':
        ({ contents, summary } = await this._readSoulManifest(def));
        break;
      case 'ledger':
        ({ contents, summary } = await this._readLedger(def));
        break;
      case 'memory_file':
        ({ contents, summary } = await this._readMemoryFile(def));
        break;
      case 'local_dir':
        ({ contents, summary } = this._readLocalDir(def));
        break;
      default:
        throw new Error(`Unknown chamber type: ${def.type}`);
    }

    const entry = {
      key: def.key,
      name: def.name,
      type: def.type,
      contents,
      summary,
      readAt: new Date().toISOString(),
    };

    this.chambers.set(def.key, entry);
    return entry;
  }

  /**
   * Read a GitHub repo — fetch the file tree and top-level README.
   */
  async _readGithubRepo(def) {
    const { owner, repo, branch = 'main' } = def;
    const token = process.env.GH_TOKEN || '';

    // Fetch contents listing
    const listing = await this._ghGet(`/repos/${owner}/${repo}/contents/`, token);
    if (!Array.isArray(listing)) throw new Error(`GitHub API returned non-array listing for ${owner}/${repo}`);
    const files = listing.map(f => ({ name: f.name, type: f.type, size: f.size }));

    // Try to fetch README
    let readme = '';
    try {
      const readmeFile = listing.find(f => f.name.toLowerCase().startsWith('readme'));
      if (readmeFile) {
        const raw = await this._fetchRaw(readmeFile.download_url);
        readme = raw.slice(0, 2000); // first 2000 chars
      }
    } catch { /* no readme */ }

    const contents = { files, readme };
    const summary = `GitHub repo ${owner}/${repo}. ${files.length} top-level files. ${readme ? 'README present.' : 'No README.'}`;

    return { contents, summary };
  }

  /**
   * Read a forgeclaw-style skill registry (registry.json).
   */
  async _readSkillRegistry(def) {
    let raw;
    if (def.url) {
      raw = await this._fetchRaw(def.url);
    } else if (def.path) {
      raw = fs.readFileSync(def.path, 'utf-8');
    } else {
      throw new Error('skill_registry requires url or path');
    }

    const registry = JSON.parse(raw);
    const skills = registry.skills || [];

    const contents = {
      name: registry.name,
      version: registry.version,
      source: registry.source,
      skills: skills.map(s => ({
        name: s.name,
        description: s.description,
        version: s.version,
        dependencies: s.dependencies || [],
      })),
    };

    const summary = `Skill registry "${registry.name}". ${skills.length} skills available. Source: ${registry.source || 'unknown'}.`;
    return { contents, summary };
  }

  /**
   * Read a soul manifest (agents.json or souls_ecosystem.json).
   */
  async _readSoulManifest(def) {
    let raw;
    if (def.url) {
      raw = await this._fetchRaw(def.url);
    } else if (def.path) {
      raw = fs.readFileSync(def.path, 'utf-8');
    } else {
      throw new Error('soul_manifest requires url or path');
    }

    const data = JSON.parse(raw);
    // Handle both array (agents.json) and object (souls_ecosystem.json)
    const souls = Array.isArray(data) ? data : (data.souls || []);

    const contents = {
      souls: souls.map(s => ({
        id: s.id || s.name,
        name: s.name,
        role: s.role,
        capabilities: s.capabilities || [],
        status: s.status || 'unknown',
      })),
    };

    const summary = `Soul manifest. ${souls.length} souls registered: ${souls.map(s => s.name).join(', ')}.`;
    return { contents, summary };
  }

  /**
   * Read a JSONL ledger — parse each line, return last N entries.
   */
  async _readLedger(def) {
    let raw;
    if (def.url) {
      raw = await this._fetchRaw(def.url);
    } else if (def.path) {
      raw = fs.readFileSync(def.path, 'utf-8');
    } else {
      throw new Error('ledger requires url or path');
    }

    const lines = raw.trim().split('\n').filter(Boolean);
    const entries = lines.map(l => {
      try { return JSON.parse(l); } catch { return { raw: l }; }
    });

    const recent = entries.slice(-50); // last 50 entries
    const types = [...new Set(entries.map(e => e.type).filter(Boolean))];

    const contents = { total: entries.length, recent, types };
    const summary = `Ledger. ${entries.length} total entries. Types: ${types.join(', ') || 'untyped'}. Most recent: ${entries[entries.length - 1]?.ts || 'unknown'}.`;
    return { contents, summary };
  }

  /**
   * Read a soul memory file.
   */
  async _readMemoryFile(def) {
    let raw;
    if (def.path) {
      raw = fs.readFileSync(def.path, 'utf-8');
    } else if (def.url) {
      raw = await this._fetchRaw(def.url);
    } else {
      throw new Error('memory_file requires path or url');
    }

    const data = JSON.parse(raw);
    const contents = {
      name: data.name,
      created: data.created,
      total_messages: data.total_messages || 0,
      conversation_count: (data.conversations || []).length,
      thought_count: (data.thoughts || []).length,
      recent_conversations: (data.conversations || []).slice(-5),
      recent_thoughts: (data.thoughts || []).slice(-3),
    };

    const summary = `Memory file for "${data.name}". ${contents.total_messages} total messages. ${contents.thought_count} recorded thoughts.`;
    return { contents, summary };
  }

  /**
   * Read a local directory tree (non-recursive, top level).
   */
  _readLocalDir(def) {
    const entries = fs.readdirSync(def.path, { withFileTypes: true });
    const files = entries.map(e => ({
      name: e.name,
      type: e.isDirectory() ? 'dir' : 'file',
    }));

    const contents = { path: def.path, files };
    const summary = `Local directory "${def.path}". ${files.length} entries.`;
    return { contents, summary };
  }

  // ── GitHub API helpers ──────────────────────────────────────────────────

  _ghGet(apiPath, token) {
    return new Promise((resolve, reject) => {
      const opts = {
        hostname: 'api.github.com',
        path: apiPath,
        method: 'GET',
        headers: {
          'User-Agent': 'SCRIBE/1.0',
          'Accept': 'application/vnd.github+json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        timeout: 15000,
      };
      const req = https.request(opts, res => {
        let raw = '';
        res.on('data', c => { raw += c; });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`GitHub API error ${res.statusCode} at ${apiPath}: ${raw.slice(0, 200)}`));
            return;
          }
          try { resolve(JSON.parse(raw)); }
          catch { reject(new Error(`Failed to parse GitHub response: ${raw.slice(0, 200)}`)); }
        });
      });
      req.on('timeout', () => { req.destroy(); reject(new Error(`GitHub API request timed out: ${apiPath}`)); });
      req.on('error', reject);
      req.end();
    });
  }

  _fetchRaw(url) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : require('http');
      const req = protocol.get(url, {
        headers: { 'User-Agent': 'SCRIBE/1.0' },
        timeout: 15000,
      }, res => {
        // Follow redirects
        if (res.statusCode === 301 || res.statusCode === 302) {
          return resolve(this._fetchRaw(res.headers.location));
        }
        let raw = '';
        res.on('data', c => { raw += c; });
        res.on('end', () => resolve(raw));
      });
      req.on('timeout', () => { req.destroy(); reject(new Error(`fetchRaw timed out: ${url}`)); });
      req.on('error', reject);
    });
  }

  // ── Query interface ─────────────────────────────────────────────────────

  /**
   * Ask: what chambers has SCRIBE read?
   */
  listRead() {
    return [...this.chambers.entries()].map(([key, c]) => ({
      key,
      name: c.name,
      type: c.type,
      summary: c.summary,
      readAt: c.readAt,
    }));
  }

  /**
   * Ask: what does SCRIBE know about a specific chamber?
   */
  know(key) {
    return this.chambers.get(key) || null;
  }

  /**
   * Ask: what skills are available (from any loaded skill_registry chamber)?
   */
  skills() {
    const all = [];
    for (const [, c] of this.chambers) {
      if (c.type === 'skill_registry' && c.contents.skills) {
        all.push(...c.contents.skills);
      }
    }
    return all;
  }

  /**
   * Ask: who are the souls (from any loaded soul_manifest chamber)?
   */
  souls() {
    const all = [];
    for (const [, c] of this.chambers) {
      if (c.type === 'soul_manifest' && c.contents.souls) {
        all.push(...c.contents.souls);
      }
    }
    return all;
  }
}

module.exports = { ChamberReader };
