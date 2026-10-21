import { existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SESSIONS_DIR = join(HERE, '..', 'sessions');

const ensureDir = () => {
  if (!existsSync(SESSIONS_DIR)) mkdirSync(SESSIONS_DIR, { recursive: true });
};

const sessionPath = (id) => join(SESSIONS_DIR, `${id.replace(/[^\w.-]/g, '_')}.json`);

export const newSessionId = () => `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const createSession = (title = 'Untitled', model = '') => {
  ensureDir();
  const session = {
    id: newSessionId(),
    title: String(title).slice(0, 80),
    model,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
  };
  writeFileSync(sessionPath(session.id), JSON.stringify(session, null, 2));
  return session;
};

export const saveSession = (session) => {
  ensureDir();
  const clean = {
    ...session,
    updatedAt: new Date().toISOString(),
    messages: (session.messages || []).slice(-200),
  };
  writeFileSync(sessionPath(clean.id), JSON.stringify(clean, null, 2));
  return clean;
};

export const loadSession = (id) => {
  const p = sessionPath(id);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
};

export const listSessions = () => {
  ensureDir();
  return readdirSync(SESSIONS_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        const s = JSON.parse(readFileSync(join(SESSIONS_DIR, f), 'utf8'));
        return {
          id: s.id,
          title: s.title,
          model: s.model,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          messageCount: (s.messages || []).length,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
};

export const deleteSession = (id) => {
  const p = sessionPath(id);
  if (existsSync(p)) {
    rmSync(p);
    return true;
  }
  return false;
};
