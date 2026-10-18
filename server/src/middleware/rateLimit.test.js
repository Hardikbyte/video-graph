import assert from "node:assert/strict";
import { test } from "node:test";
import { createLimiter } from "./rateLimit.js";

test("allows up to max attempts, then blocks with a wait time", () => {
  let time = 0;
  const limiter = createLimiter({ windowMs: 60_000, max: 3, now: () => time });
  for (let i = 0; i < 3; i += 1) assert.equal(limiter.hit("a").allowed, true);
  const blocked = limiter.hit("a");
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSeconds, 60);
});

test("keys are counted separately", () => {
  const limiter = createLimiter({ windowMs: 60_000, max: 1 });
  assert.equal(limiter.hit("a").allowed, true);
  assert.equal(limiter.hit("b").allowed, true);
  assert.equal(limiter.hit("a").allowed, false);
});

test("the window expires", () => {
  let time = 0;
  const limiter = createLimiter({ windowMs: 1000, max: 1, now: () => time });
  assert.equal(limiter.hit("a").allowed, true);
  assert.equal(limiter.hit("a").allowed, false);
  time = 1001;
  assert.equal(limiter.hit("a").allowed, true);
});

test("reset clears a key and sweep drops expired entries", () => {
  let time = 0;
  const limiter = createLimiter({ windowMs: 1000, max: 1, now: () => time });
  limiter.hit("a");
  limiter.reset("a");
  assert.equal(limiter.hit("a").allowed, true);
  limiter.hit("b");
  time = 5000;
  limiter.sweep();
  assert.equal(limiter.size(), 0);
});
