'use strict';

/**
 * SKILL: github_api
 *
 * Read GitHub repos, files, ledgers, and listings via the GitHub REST API.
 * Uses GH_TOKEN environment variable if available.
 *
 * Operations:
 *   'list_files'   — list files in a repo directory
 *   'read_file'    — read a specific file's content (decoded from base64)
 *   'read_raw'     — fetch a raw file URL directly
 *   'repo_info'    — get repo metadata (description, languages, last updated)
 *   'list_repos'   — list repos for a user
 *
 * Returns: { ok, op, data, ts }
 */

const https = require('https');

const MANIFEST = {
  name: 'github_api',
  description: 'Read GitHub repos and files via the GitHub REST API.',
  version: '1.0.0',
  inputs: {
    op:     { type: 'string', required: true,  description: '"list_files"|"read_file"|"read_raw"|"repo_info"|"list_repos"' },
    owner:  { type: 'string', required: false, description: 'Repo owner (username or org)' },
    repo:   { type: 'string', required: false, description: 'Repository name' },
    path:   { type: 'string', required: false, description: 'File or directory path within repo' },
    branch: { type: 'string', required: false, description: 'Branch name (default: main)' },
    url:    { type: 'string', required: false, description: 'Raw file URL (read_raw only)' },
    user:   { type: 'string', required: false, description: 'GitHub username (list_repos only)' },
  },
  output: {
    ok:    'boolean',
    op:    'string',
    data:  'any — operation-specific result',
    error: 'string — present if ok is false',
    ts:    'string',
  },
};

async function run({ op, owner, repo, path: filePath, branch = 'main', url, user }) {
  if (!op) return err('op is required');

  try {
    switch (op) {
      case 'list_files': {
        if (!owner || !repo) return err('owner and repo are required for list_files');
        const p = filePath ? `${filePath}` : '';
        const res = await ghGet(`/repos/${owner}/${repo}/contents/${p}?ref=${branch}`);
        if (!Array.isArray(res)) return err(`Unexpected response: ${JSON.stringify(res).slice(0, 200)}`);
        const data = res.map(f => ({ name: f.name, type: f.type, size: f.size, path: f.path, download_url: f.download_url }));
        return ok(op, data);
      }

      case 'read_file': {
        if (!owner || !repo || !filePath) return err('owner, repo, and path are required for read_file');
        const res = await ghGet(`/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`);
        if (!res || !res.content) return err('No content in response (file may not exist or access denied)');
        const content = Buffer.from(res.content, 'base64').toString('utf-8');
        return ok(op, { path: filePath, content, size: res.size, sha: res.sha });
      }

      case 'read_raw': {
        if (!url) return err('url is required for read_raw');
        const content = await fetchRaw(url);
        return ok(op, { url, content });
      }

      case 'repo_info': {
        if (!owner || !repo) return err('owner and repo are required for repo_info');
        const res = await ghGet(`/repos/${owner}/${repo}`);
        return ok(op, {
          name: res.name,
          description: res.description,
          default_branch: res.default_branch,
          updated_at: res.updated_at,
          language: res.language,
          size: res.size,
          open_issues: res.open_issues_count,
          stars: res.stargazers_count,
        });
      }

      case 'list_repos': {
        const u = user || owner;
        if (!u) return err('user or owner is required for list_repos');
        const res = await ghGet(`/users/${u}/repos?per_page=50&sort=updated`);
        if (!Array.isArray(res)) return err(`Unexpected response`);
        const data = res.map(r => ({ name: r.name, description: r.description, updated_at: r.updated_at, language: r.language }));
        return ok(op, data);
      }

      default:
        return err(`Unknown op "${op}".`);
    }
  } catch (e) {
    return err(e.message);
  }
}

function ghGet(apiPath) {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
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
          reject(new Error(`GitHub API error ${res.statusCode}: ${raw.slice(0, 200)}`));
          return;
        }
        try { resolve(JSON.parse(raw)); }
        catch { reject(new Error(`Failed to parse GitHub response`)); }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('GitHub API request timed out')); });
    req.on('error', reject);
    req.end();
  });
}

function fetchRaw(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : require('http');
    lib.get(url, { headers: { 'User-Agent': 'SCRIBE/1.0' } }, res => {
      if ([301, 302, 303].includes(res.statusCode) && res.headers.location) {
        return resolve(fetchRaw(res.headers.location));
      }
      let raw = '';
      res.on('data', c => { raw += c; });
      res.on('end', () => resolve(raw));
    }).on('error', reject);
  });
}

function ok(op, data) {
  return { ok: true, op, data, ts: new Date().toISOString() };
}

function err(message) {
  return { ok: false, op: null, data: null, error: message, ts: new Date().toISOString() };
}

module.exports = { MANIFEST, run };
