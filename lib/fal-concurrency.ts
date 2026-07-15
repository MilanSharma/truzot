import "server-only";
import { Redis } from "@upstash/redis";
import { createLogger } from "@/lib/logger";

const log = createLogger("fal-concurrency");
const redis = Redis.fromEnv();

// Leave 1-2 slots of headroom below your real fal.ai account limit so a stray
// training call or dashboard test doesn't tip you over from the outside.
const GLOBAL_LIMIT = 8;
const SLOT_KEY = "fal:inflight";
const SLOT_TTL_MS = 90_000; // a single fal call (gen + upscale) should never take
                             // this long; if one does, treat its slot as abandoned
                             // so a crashed invocation can't permanently eat a slot.
const ACQUIRE_POLL_MS = 300;
const ACQUIRE_MAX_WAIT_MS = 120_000; // give up and let the caller's own retry logic
                                      // handle it rather than hanging the batch

function prune(now: number) {
  return redis.zremrangebyscore(SLOT_KEY, 0, now - SLOT_TTL_MS);
}

/** Try once to take a slot. Returns a token to release later, or null if full. */
async function tryAcquire(): Promise<string | null> {
  const now = Date.now();
  await prune(now);
  const current = await redis.zcard(SLOT_KEY);
  if (current >= GLOBAL_LIMIT) return null;

  const token = `${now}-${Math.random().toString(36).slice(2)}`;
  await redis.zadd(SLOT_KEY, { score: now, member: token });

  // Re-check after adding — cheap protection against a race where two callers
  // both saw room and both added. Loser backs off and retries.
  const rank = await redis.zrank(SLOT_KEY, token);
  if (rank !== null && rank < GLOBAL_LIMIT) return token;

  await redis.zrem(SLOT_KEY, token);
  return null;
}

async function release(token: string) {
  await redis.zrem(SLOT_KEY, token).catch((err) =>
    log.error({ err }, "Failed to release fal concurrency slot (will self-expire)"),
  );
}

/** Run fn only once a global fal.ai slot is free. Waits, doesn't fail fast — the
 * caller's existing retry/circuit-breaker logic still applies on top of this. */
export async function withFalSlot<T>(fn: () => Promise<T>): Promise<T> {
  const deadline = Date.now() + ACQUIRE_MAX_WAIT_MS;
  let token: string | null = null;

  while (!token) {
    token = await tryAcquire();
    if (token) break;
    if (Date.now() > deadline) {
      throw new Error("Timed out waiting for a fal.ai concurrency slot");
    }
    await new Promise((r) => setTimeout(r, ACQUIRE_POLL_MS + Math.random() * 200));
  }

  try {
    return await fn();
  } finally {
    await release(token);
  }
}
