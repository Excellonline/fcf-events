const buckets = new Map<string, { count: number; resetAt: number }>();
let lastSweepAt = 0;

export function rateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  if (now - lastSweepAt > 60_000) {
    lastSweepAt = now;
    for (const [bucketKey, bucket] of buckets.entries()) {
      if (bucket.resetAt < now) buckets.delete(bucketKey);
    }
  }

  const current = buckets.get(key);

  if (!current || current.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  current.count += 1;
  return { allowed: true, remaining: limit - current.count };
}
