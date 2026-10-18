// A small in-memory limiter for the login and sign up routes. It is per server process,
// which is fine for one server; a shared store would be needed to run several.

export function createLimiter({ windowMs, max, now = () => Date.now() }) {
  const hits = new Map(); // key -> { count, resetAt }

  return {
    // Records an attempt. Returns { allowed, retryAfterSeconds }.
    hit(key) {
      const time = now();
      let entry = hits.get(key);
      if (!entry || entry.resetAt <= time) {
        entry = { count: 0, resetAt: time + windowMs };
        hits.set(key, entry);
      }
      entry.count += 1;
      if (entry.count > max) {
        return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - time) / 1000) };
      }
      return { allowed: true, retryAfterSeconds: 0 };
    },
    // Clears a key, for example after a successful login.
    reset(key) {
      hits.delete(key);
    },
    // Drops expired entries so the map cannot grow forever.
    sweep() {
      const time = now();
      for (const [key, entry] of hits) if (entry.resetAt <= time) hits.delete(key);
    },
    size: () => hits.size,
  };
}

// Express middleware: `keyFor(req)` decides who is being counted.
export function rateLimit({ windowMs = 15 * 60 * 1000, max = 10, keyFor }) {
  const limiter = createLimiter({ windowMs, max });
  setInterval(() => limiter.sweep(), windowMs).unref();

  const middleware = (req, res, next) => {
    const key = keyFor(req);
    const result = limiter.hit(key);
    if (!result.allowed) {
      const minutes = Math.max(1, Math.ceil(result.retryAfterSeconds / 60));
      res.set("Retry-After", String(result.retryAfterSeconds));
      return res.status(429).json({
        error: `Too many attempts. Try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`,
        retryAfter: result.retryAfterSeconds,
      });
    }
    req.rateLimitKey = key;
    return next();
  };
  middleware.reset = (key) => limiter.reset(key);
  return middleware;
}
