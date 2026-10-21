import { existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ARTIFACT_SESSIONS_DIR = join(HERE, '..', 'artifacts', 'sessions');

const ensureDir = () => {
  if (!existsSync(ARTIFACT_SESSIONS_DIR)) {
    mkdirSync(ARTIFACT_SESSIONS_DIR, { recursive: true });
  }
};

const sessionPath = (id) => join(ARTIFACT_SESSIONS_DIR, `${id.replace(/[^\w.-]/g, '_')}.json`);

export const newArtifactSessionId = () => `artsess-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const createArtifactSession = (data = {}) => {
  ensureDir();
  const session = {
    id: newArtifactSessionId(),
    title: String(data.title || data.fileName || 'Untitled Artifact').slice(0, 80),
    fileName: String(data.fileName || 'artifact.html'),
    fileType: String(data.fileType || 'html'),
    code: String(data.code || ''),
    proposal: String(data.proposal || ''),
    logs: Array.isArray(data.logs) ? data.logs : [],
    pltScore: data.pltScore || { profit: 0.9, love: 0.7, tax: 0.2 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(sessionPath(session.id), JSON.stringify(session, null, 2), 'utf8');
  return session;
};

export const saveArtifactSession = (data) => {
  ensureDir();
  const id = data.id || newArtifactSessionId();
  const session = {
    id,
    title: String(data.title || data.fileName || 'Untitled Artifact').slice(0, 80),
    fileName: String(data.fileName || 'artifact.html'),
    fileType: String(data.fileType || 'html'),
    code: String(data.code || ''),
    proposal: String(data.proposal || ''),
    logs: Array.isArray(data.logs) ? data.logs.slice(-100) : [],
    pltScore: data.pltScore || { profit: 0.9, love: 0.7, tax: 0.2 },
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(sessionPath(session.id), JSON.stringify(session, null, 2), 'utf8');
  return session;
};

export const loadArtifactSession = (id) => {
  const p = sessionPath(id);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
};

export const listArtifactSessions = () => {
  ensureDir();
  return readdirSync(ARTIFACT_SESSIONS_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        const s = JSON.parse(readFileSync(join(ARTIFACT_SESSIONS_DIR, f), 'utf8'));
        return {
          id: s.id,
          title: s.title,
          fileName: s.fileName,
          fileType: s.fileType,
          codeLength: (s.code || '').length,
          hasProposal: Boolean(s.proposal && s.proposal.length > 0),
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
};

export const deleteArtifactSession = (id) => {
  const p = sessionPath(id);
  if (existsSync(p)) {
    rmSync(p);
    return true;
  }
  return false;
};
