import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeEmail, validateEmail, validateName, validatePassword } from "./validation.js";

test("emails are trimmed and lowercased", () => {
  assert.equal(normalizeEmail("  Hardik@Example.COM "), "hardik@example.com");
  assert.equal(normalizeEmail(undefined), "");
  assert.equal(normalizeEmail({ a: 1 }), "");
});

test("valid emails pass", () => {
  for (const email of ["a@b.co", "first.last+tag@sub.example.com", "x_y@example.io"]) {
    assert.equal(validateEmail(email), null, email);
  }
});

test("invalid emails are rejected", () => {
  for (const email of ["", "plain", "a@b", "a b@c.com", "@c.com", "a@@c.com", "a@c."]) {
    assert.notEqual(validateEmail(email), null, email);
  }
  assert.match(validateEmail(`${"a".repeat(250)}@b.com`), /too long/);
});

test("password length rules", () => {
  assert.match(validatePassword("1234567"), /at least 8/);
  assert.equal(validatePassword("12345678"), null);
  assert.equal(validatePassword("a".repeat(72)), null);
  assert.match(validatePassword("a".repeat(73)), /too long/);
  assert.match(validatePassword(""), /required/);
  assert.match(validatePassword(undefined), /required/);
  assert.match(validatePassword(12345678), /required/);
});

test("passwords are limited by bytes, not characters", () => {
  // 24 characters x 3 bytes = 72 bytes, still fine; one more character goes over.
  assert.equal(validatePassword("€".repeat(24)), null);
  assert.match(validatePassword("€".repeat(25)), /too long/);
});

test("name is optional and limited", () => {
  assert.equal(validateName(undefined), null);
  assert.equal(validateName(""), null);
  assert.equal(validateName("Hardik"), null);
  assert.match(validateName("x".repeat(61)), /at most 60/);
  assert.match(validateName(42), /text/);
});
