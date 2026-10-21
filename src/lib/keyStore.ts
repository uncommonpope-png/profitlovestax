import fs from "fs";
import path from "path";
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_FILE = path.join(process.cwd(), ".vault", "keys.enc");
const SALT_FILE = path.join(process.cwd(), ".vault", "salt");
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getOrCreateSalt(): Buffer {
  const vaultDir = path.join(process.cwd(), ".vault");
  if (!fs.existsSync(vaultDir)) {
    fs.mkdirSync(vaultDir, { recursive: true });
  }

  if (fs.existsSync(SALT_FILE)) {
    return Buffer.from(fs.readFileSync(SALT_FILE, "utf-8"), "hex");
  }

  const salt = crypto.randomBytes(16);
  fs.writeFileSync(SALT_FILE, salt.toString("hex"));
  return salt;
}

function deriveKey(passphrase: string): Buffer {
  const salt = getOrCreateSalt();
  return crypto.scryptSync(passphrase, salt, 32);
}

function getEncryptionKey(): Buffer {
  const passphrase = process.env.VAULT_PASSPHRASE || process.env.SESSION_SECRET || "buyasoul-default-vault-key";
  return deriveKey(passphrase);
}

export interface StoredKeys {
  [service: string]: string;
}

function loadEncryptedFile(): StoredKeys {
  if (!fs.existsSync(KEY_FILE)) {
    return {};
  }

  try {
    const encrypted = fs.readFileSync(KEY_FILE);
    const iv = encrypted.subarray(0, IV_LENGTH);
    const authTag = encrypted.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = encrypted.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return JSON.parse(decrypted.toString("utf-8"));
  } catch {
    return {};
  }
}

function saveEncryptedFile(data: StoredKeys): void {
  const vaultDir = path.join(process.cwd(), ".vault");
  if (!fs.existsSync(vaultDir)) {
    fs.mkdirSync(vaultDir, { recursive: true });
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const plaintext = JSON.stringify(data);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf-8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const combined = Buffer.concat([iv, authTag, encrypted]);
  fs.writeFileSync(KEY_FILE, combined);
}

export function storeKey(service: string, apiKey: string): void {
  const keys = loadEncryptedFile();
  keys[service] = apiKey;
  saveEncryptedFile(keys);
}

export function getKey(service: string): string {
  const keys = loadEncryptedFile();
  return keys[service] || process.env[service] || "";
}

export function getAllKeys(): StoredKeys {
  const keys = loadEncryptedFile();
  const envKeys: StoredKeys = {};

  const services = [
    "GEMINI_API_KEY",
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "PINECONE_API_KEY",
    "SLACK_WEBHOOK_URL",
    "HUBSPOT_API_KEY",
    "SHOPIFY_ADMIN_ACCESS_TOKEN",
    "SOLANA_RPC_URL",
  ];

  for (const service of services) {
    envKeys[service] = keys[service] || process.env[service] || "";
  }

  return envKeys;
}

export function deleteKey(service: string): boolean {
  const keys = loadEncryptedFile();
  if (keys[service]) {
    delete keys[service];
    saveEncryptedFile(keys);
    return true;
  }
  return false;
}

export function maskKey(key: string): string {
  if (!key || key.length < 8) return "****";
  return key.substring(0, 4) + "****" + key.substring(key.length - 4);
}
