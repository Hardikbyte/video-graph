import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiError, buildApiError } from "./apiError.js";

const base = { method: "PATCH", url: "http://localhost:5000/api/boards/abc/layout", path: "/boards/abc/layout" };

test("an HTML 404 page means the server is out of date", () => {
  const error = buildApiError({
    ...base,
    status: 404,
    bodyText: "<!DOCTYPE html><html><body><pre>Cannot PATCH /api/boards/abc/layout</pre></body></html>",
  });
  assert.ok(error instanceof ApiError);
  assert.equal(error.status, 404);
  assert.match(error.message, /PATCH \/boards\/abc\/layout was not found/);
  assert.match(error.hint, /older version/);
  assert.match(error.toDetails(), /Status: 404/);
});

test("a JSON 404 keeps the server message and gives no restart hint", () => {
  const error = buildApiError({ ...base, status: 404, bodyText: JSON.stringify({ error: "Board not found" }) });
  assert.equal(error.message, "Board not found");
  assert.equal(error.hint, undefined);
});

test("a validation error shows the server text", () => {
  const error = buildApiError({
    ...base,
    status: 400,
    bodyText: JSON.stringify({ error: "Each position needs an id and finite x and y" }),
  });
  assert.equal(error.message, "Each position needs an id and finite x and y");
  assert.equal(error.status, 400);
});

test("401 tells the user to log in again", () => {
  const error = buildApiError({ ...base, status: 401, bodyText: JSON.stringify({ error: "Invalid or expired token" }) });
  assert.equal(error.message, "Invalid or expired token");
  assert.match(error.hint, /log in again/i);
});

test("a 500 includes the server detail when it is provided", () => {
  const error = buildApiError({
    ...base,
    status: 500,
    bodyText: JSON.stringify({ error: "Server error", detail: "MongooseServerSelectionError: connection timed out" }),
  });
  assert.equal(error.message, "Server error");
  assert.equal(error.detail, "MongooseServerSelectionError: connection timed out");
  assert.match(error.toDetails(), /Server detail: MongooseServerSelectionError/);
});

test("a network failure names the server address", () => {
  const error = buildApiError({ ...base, networkError: new TypeError("Failed to fetch") });
  assert.equal(error.status, 0);
  assert.equal(error.message, "Could not reach the server at http://localhost:5000");
  assert.match(error.hint, /npm start/);
  assert.match(error.toDetails(), /Browser error: Failed to fetch/);
});

test("405 is also treated as an old server", () => {
  const error = buildApiError({ ...base, status: 405, bodyText: "" });
  assert.match(error.hint, /older version/);
});

test("an unknown status falls back to a generic message", () => {
  const error = buildApiError({ ...base, status: 418, bodyText: "" });
  assert.equal(error.message, "Request failed with status 418");
});
