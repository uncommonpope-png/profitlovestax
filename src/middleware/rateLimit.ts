import { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimits = new Map<string, RateLimitEntry>();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 100;

function cleanup(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimits.entries()) {
    if (now > entry.resetTime) {
      rateLimits.delete(key);
    }
  }
}

setInterval(cleanup, 60 * 1000);

export function rateLimit(req: Request, res: Response, next: NextFunction): void {
  const clientId = (req.headers["x-api-key"] as string) || req.ip || "unknown";
  const now = Date.now();

  let entry = rateLimits.get(clientId);

  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + WINDOW_MS };
    rateLimits.set(clientId, entry);
  }

  entry.count++;

  if (entry.count > MAX_REQUESTS) {
    res.status(429).json({
      error: "Rate limit exceeded. Try again later.",
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    });
    return;
  }

  res.setHeader("X-RateLimit-Limit", MAX_REQUESTS);
  res.setHeader("X-RateLimit-Remaining", Math.max(0, MAX_REQUESTS - entry.count));
  res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetTime / 1000));

  next();
}
