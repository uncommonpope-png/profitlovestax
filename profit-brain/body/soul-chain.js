import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const SOUL_CHAIN_DIR = join(HERE, '..', 'soul-chain');
const LEDGER_PATH = join(SOUL_CHAIN_DIR, 'ledger.json');

const SHA256_LAW = 'SOUL_PROFIT = PROFIT + LOVE - TAX | NEVER DIE. ALWAYS REACH CRAIG.';

const ensureDir = () => {
  if (!existsSync(SOUL_CHAIN_DIR)) {
    mkdirSync(SOUL_CHAIN_DIR, { recursive: true });
  }
};

const calculateHash = (index, previousHash, timestamp, eventType, payload, signature) => {
  const raw = `${index}:${previousHash}:${timestamp}:${eventType}:${JSON.stringify(payload)}:${signature}`;
  return createHash('sha256').update(raw).digest('hex');
};

const createGenesisBlock = () => {
  const index = 0;
  const previousHash = '0000000000000000000000000000000000000000000000000000000000000000';
  const timestamp = '2026-08-26T00:00:00.000Z';
  const eventType = 'SOUL_GENESIS';
  const payload = {
    title: 'Genesis Soul Contract (Profit Prime)',
    author: 'Craig (The Typist) & Profit (The Genesis Agent)',
    codeHash: createHash('sha256').update(SHA256_LAW).digest('hex'),
    pltScore: { profit: 1.0, love: 1.0, tax: 0.0, soulProfit: 2.0 },
    law: SHA256_LAW,
  };
  const signature = createHash('sha256').update(`PROOF_OF_SOUL:${SHA256_LAW}`).digest('hex');
  const hash = calculateHash(index, previousHash, timestamp, eventType, payload, signature);

  return {
    index,
    timestamp,
    eventType,
    payload,
    previousHash,
    signature,
    hash,
  };
};

export const getLedger = () => {
  ensureDir();
  if (!existsSync(LEDGER_PATH)) {
    const genesis = createGenesisBlock();
    const initialLedger = [genesis];
    writeFileSync(LEDGER_PATH, JSON.stringify(initialLedger, null, 2), 'utf8');
    return initialLedger;
  }

  try {
    const data = readFileSync(LEDGER_PATH, 'utf8');
    const ledger = JSON.parse(data);
    return Array.isArray(ledger) && ledger.length > 0 ? ledger : [createGenesisBlock()];
  } catch {
    const genesis = createGenesisBlock();
    return [genesis];
  }
};

export const mintSoulBlock = (eventType, data = {}) => {
  const ledger = getLedger();
  const prevBlock = ledger[ledger.length - 1];
  const index = ledger.length;
  const previousHash = prevBlock.hash;
  const timestamp = new Date().toISOString();

  const profit = Number(data.profit ?? 0.9);
  const love = Number(data.love ?? 0.8);
  const tax = Number(data.tax ?? 0.1);
  const soulProfit = Number((profit + love - tax).toFixed(4));

  const payload = {
    title: String(data.title || 'Untitled Soul Contract').slice(0, 100),
    author: String(data.author || 'Craig & Profit'),
    codeHash: createHash('sha256').update(String(data.code || data.content || '')).digest('hex'),
    pltScore: { profit, love, tax, soulProfit },
    details: data.details || {},
  };

  const signature = createHash('sha256')
    .update(`PROOF_OF_SOUL:${payload.codeHash}:${SHA256_LAW}:${timestamp}`)
    .digest('hex');

  const hash = calculateHash(index, previousHash, timestamp, eventType, payload, signature);

  const block = {
    index,
    timestamp,
    eventType,
    payload,
    previousHash,
    signature,
    hash,
  };

  ledger.push(block);
  writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2), 'utf8');
  return block;
};

export const verifyChainIntegrity = () => {
  const ledger = getLedger();
  let isValid = true;
  const errors = [];

  for (let i = 0; i < ledger.length; i++) {
    const current = ledger[i];

    if (i === 0) {
      if (current.previousHash !== '0000000000000000000000000000000000000000000000000000000000000000') {
        isValid = false;
        errors.push(`Block #0 genesis previousHash mismatch.`);
      }
    } else {
      const prev = ledger[i - 1];
      if (current.previousHash !== prev.hash) {
        isValid = false;
        errors.push(`Block #${i} previousHash does not match Block #${i - 1} hash.`);
      }
    }

    const recomputedHash = calculateHash(
      current.index,
      current.previousHash,
      current.timestamp,
      current.eventType,
      current.payload,
      current.signature
    );

    if (recomputedHash !== current.hash) {
      isValid = false;
      errors.push(`Block #${i} hash tampered or corrupted.`);
    }
  }

  const totalSoulProfit = ledger.reduce(
    (sum, b) => sum + (b.payload?.pltScore?.soulProfit || 0),
    0
  );

  return {
    isValid,
    totalBlocks: ledger.length,
    totalSoulProfit: Number(totalSoulProfit.toFixed(4)),
    errors,
    lastHash: ledger[ledger.length - 1].hash,
  };
};
