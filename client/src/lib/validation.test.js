import assert from "node:assert/strict";
import { test } from "node:test";
import { validateEmail, validateNewPassword } from "./validation.js";

test("emails", () => {
  assert.equal(validateEmail("a@b.co"), "");
  assert.equal(validateEmail("  a@b.co  "), "");
  assert.notEqual(validateEmail(""), "");
  assert.notEqual(validateEmail("plain"), "");
  assert.notEqual(validateEmail("a@b"), "");
});

test("new passwords", () => {
  assert.notEqual(validateNewPassword(""), "");
  assert.match(validateNewPassword("1234567"), /at least 8/);
  assert.equal(validateNewPassword("12345678"), "");
  assert.match(validateNewPassword("a".repeat(73)), /too long/);
  assert.equal(validateNewPassword("€".repeat(24)), "");
  assert.match(validateNewPassword("€".repeat(25)), /too long/);
});
