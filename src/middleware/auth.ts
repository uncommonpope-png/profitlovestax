import { Request, Response, NextFunction } from "express";
import { getKey } from "../lib/keyStore";

const VALID_API_KEYS = new Set<string>();
let keysLoaded = false;

function loadValidKeys(): void {
  if (keysLoaded) return;
  keysLoaded = true;

  const keys = [
    process.env.MASTER_API_KEY,
    process.env.CUSTOMER_API_KEY_1,
    process.env.CUSTOMER_API_KEY_2,
    process.env.CUSTOMER_API_KEY_3,
  ].filter(Boolean);

  keys.forEach((key) => VALID_API_KEYS.add(key!));
}

export interface AuthenticatedRequest extends Request {
  apiKey?: string;
  userId?: string;
}

export function requireApiKey(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  loadValidKeys();
  const apiKey = req.headers["x-api-key"] as string | undefined;

  if (!apiKey) {
    res.status(401).json({
      error: "API key required. Provide X-API-Key header.",
    });
    return;
  }

  if (VALID_API_KEYS.has(apiKey)) {
    req.userId = `user-${apiKey.substring(apiKey.length - 6)}`;
    next();
    return;
  }

  res.status(403).json({
    error: "Invalid API key.",
  });
}

export function optionalApiKey(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const apiKey = req.headers["x-api-key"] as string | undefined;
  if (apiKey && VALID_API_KEYS.has(apiKey)) {
    req.userId = `user-${apiKey.substring(apiKey.length - 6)}`;
  }
  next();
}

export function addApiKey(key: string): void {
  VALID_API_KEYS.add(key);
}

export function removeApiKey(key: string): boolean {
  return VALID_API_KEYS.delete(key);
}
