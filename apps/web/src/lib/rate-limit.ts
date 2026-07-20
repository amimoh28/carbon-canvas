/** Minimal in-memory rate limiter (per-key sliding window).
 *  Prototype-grade: single-process only; a shared store (e.g. Redis or
 *  Postgres) replaces this when the API outgrows one instance. */

const hits = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    hits.set(key, arr);
    return false;
  }
  arr.push(now);
  hits.set(key, arr);
  return true;
}
