import dbConnect from "@/lib/mongodb";
import RateLimit from "@/models/RateLimit";

export interface RateLimitOptions {
  /** Max failed attempts allowed within the window. */
  limit: number;
  /** Sliding window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  limited: boolean;
  /** Seconds until the oldest hit falls out of the window. */
  retryAfterSeconds: number;
}

/**
 * Mongo-backed sliding-window rate limiter. Stateless across processes, so it
 * works on serverless where an in-memory counter would not.
 *
 * Split into a read (isRateLimited) and a write (recordFailedAttempt) so callers
 * count only *failed* attempts — a successful login/verify never consumes budget
 * and never locks out a legitimate user.
 */
export async function isRateLimited(
  key: string,
  { limit, windowMs }: RateLimitOptions
): Promise<RateLimitResult> {
  await dbConnect();
  const now = Date.now();
  const windowStart = new Date(now - windowMs);

  // Prune hits that have aged out and read the current state in one round-trip.
  const doc = await RateLimit.findOneAndUpdate(
    { key },
    { $pull: { hits: { $lt: windowStart } } },
    { new: true, projection: { hits: 1 } }
  );

  const hits = doc?.hits ?? [];
  if (hits.length < limit) {
    return { limited: false, retryAfterSeconds: 0 };
  }

  const oldest = hits.reduce((a, b) => (a < b ? a : b));
  const retryAfterMs = oldest.getTime() + windowMs - now;
  return {
    limited: true,
    retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
  };
}

/**
 * Record one failed attempt against `key`, extending its TTL to the end of the
 * window. Upserts the key on first failure.
 */
export async function recordFailedAttempt(
  key: string,
  { windowMs }: Pick<RateLimitOptions, "windowMs">
): Promise<void> {
  await dbConnect();
  const now = new Date();
  await RateLimit.updateOne(
    { key },
    {
      $push: { hits: now },
      $set: { expiresAt: new Date(now.getTime() + windowMs) },
    },
    { upsert: true }
  );
}
