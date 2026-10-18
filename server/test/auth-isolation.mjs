// Integration test for accounts and board privacy. Needs a running server and the database.
//   npm run test:integration            (BASE_URL defaults to http://localhost:5000/api)
// It creates two temporary accounts and removes them, and their boards, when it finishes.

import "dotenv/config";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Board from "../src/models/Board.js";
import User from "../src/models/User.js";

const BASE = process.env.BASE_URL || "http://localhost:5000/api";
const run = Math.random().toString(36).slice(2, 8);
const emailA = `test-a-${run}@example.test`;
const emailB = `test-b-${run}@example.test`;
const password = "correct horse battery";

let passed = 0;
let failed = 0;
function check(name, ok, extra = "") {
  if (ok) passed += 1;
  else failed += 1;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${extra ? ` (${extra})` : ""}`);
}

async function call(method, path, { body, token } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    /* no body */
  }
  return { status: res.status, data, text };
}

await mongoose.connect(process.env.MONGODB_URI);
const createdBoardIds = [];

try {
  // ---- sign up
  const a = await call("POST", "/auth/signup", { body: { name: "Test A", email: emailA, password } });
  const b = await call("POST", "/auth/signup", { body: { email: emailB.toUpperCase(), password } });
  check("sign up returns 201 with a token and the user", a.status === 201 && !!a.data.token && a.data.user.email === emailA);
  check("email is stored lowercase", b.status === 201 && b.data.user.email === emailB);
  check("responses never contain a hash", !/\$2[aby]\$/.test(a.text) && !/passwordHash/.test(a.text));

  const stored = await User.findOne({ email: emailA });
  check("the stored password is a bcrypt hash, not the password", /^\$2[aby]\$12\$/.test(stored.passwordHash) && stored.passwordHash !== password);
  check("the hash verifies against the password", await bcrypt.compare(password, stored.passwordHash));
  check("two accounts with the same password get different hashes", (await User.findOne({ email: emailB })).passwordHash !== stored.passwordHash);

  // ---- validation
  check("duplicate email (different case) is 409", (await call("POST", "/auth/signup", { body: { email: emailA.toUpperCase(), password } })).status === 409);
  check("password shorter than 8 is 400", (await call("POST", "/auth/signup", { body: { email: `x-${run}@example.test`, password: "short" } })).status === 400);
  check("password over 72 bytes is 400", (await call("POST", "/auth/signup", { body: { email: `x-${run}@example.test`, password: "a".repeat(73) } })).status === 400);
  check("a bad email is 400", (await call("POST", "/auth/signup", { body: { email: "not-an-email", password } })).status === 400);
  check("no account was created by the rejected sign ups", !(await User.exists({ email: `x-${run}@example.test` })));

  // ---- login
  const wrongPassword = await call("POST", "/auth/login", { body: { email: emailA, password: "wrong password!" } });
  const unknownEmail = await call("POST", "/auth/login", { body: { email: `nobody-${run}@example.test`, password } });
  check("wrong password is 401", wrongPassword.status === 401);
  check("unknown email gives the same 401 message", unknownEmail.status === 401 && unknownEmail.data.error === wrongPassword.data.error);
  const login = await call("POST", "/auth/login", { body: { email: ` ${emailA.toUpperCase()} `, password } });
  check("login works with a different case and spaces", login.status === 200 && !!login.data.token);
  const tokenA = login.data.token;
  const tokenB = b.data.token;

  check("GET /auth/me returns the user", (await call("GET", "/auth/me", { token: tokenA })).data?.user?.email === emailA);
  check("no token is 401", (await call("GET", "/boards")).status === 401);
  const forged = jwt.sign({ sub: stored._id.toString() }, "some other secret");
  check("a token signed with another secret is 401", (await call("GET", "/boards", { token: forged })).status === 401);
  const badSub = jwt.sign({ sub: "abc" }, process.env.JWT_SECRET);
  check("a token with a malformed user id is 401, not a crash", (await call("GET", "/boards", { token: badSub })).status === 401);

  // ---- brute force protection
  const spamEmail = `spam-${run}@example.test`;
  const statuses = [];
  for (let i = 0; i < 12; i += 1) {
    statuses.push((await call("POST", "/auth/login", { body: { email: spamEmail, password: "wrong password!" } })).status);
  }
  check("the first 10 wrong attempts are 401", statuses.slice(0, 10).every((s) => s === 401));
  check("the 11th attempt is rate limited with 429", statuses[10] === 429 && statuses[11] === 429);

  // ---- board privacy
  const board = (await call("POST", "/boards", { token: tokenA, body: { name: `Private ${run}` } })).data;
  createdBoardIds.push(board._id);
  const nodes = [
    { id: "n1", type: "text", text: "secret one", title: "One", position: { x: 0, y: 0 } },
    { id: "n2", type: "text", text: "secret two", title: "Two", position: { x: 300, y: 0 } },
  ];
  const edges = [{ id: "e1", source: "n1", target: "n2", sourceHandle: "right", targetHandle: "left", color: null, label: "", lineStyle: "solid", arrow: false }];
  const saved = await call("PUT", `/boards/${board._id}`, { token: tokenA, body: { nodes, edges } });
  check("the owner can save their board", saved.status === 200 && saved.data.nodes.length === 2);

  const snapshot = async () => JSON.stringify((await call("GET", `/boards/${board._id}`, { token: tokenA })).data);
  const before = await snapshot();

  const list = (await call("GET", "/boards", { token: tokenB })).data;
  check("the other user's board list does not contain it", Array.isArray(list) && !list.some((x) => x._id === board._id));

  const id = board._id;
  const attempts = [
    ["read the board", "GET", `/boards/${id}`],
    ["page through its nodes", "GET", `/boards/${id}/nodes`],
    ["overwrite it", "PUT", `/boards/${id}`, { nodes: [], edges: [], name: "stolen" }],
    ["delete it", "DELETE", `/boards/${id}`],
    ["add a node", "POST", `/boards/${id}/nodes`, { type: "text", text: "injected" }],
    ["move a node", "PATCH", `/boards/${id}/layout`, { positions: [{ id: "n1", x: 999, y: 999 }] }],
    ["edit a node", "PATCH", `/boards/${id}/nodes/n1`, { title: "hacked" }],
    ["delete a node", "DELETE", `/boards/${id}/nodes/n1`],
    ["add an edge", "POST", `/boards/${id}/edges`, { id: "e2", source: "n1", target: "n2" }],
    ["edit an edge", "PATCH", `/boards/${id}/edges/e1`, { label: "hacked" }],
    ["delete an edge", "DELETE", `/boards/${id}/edges/e1`],
  ];
  for (const [name, method, path, body] of attempts) {
    const result = await call(method, path, { token: tokenB, body });
    check(`another user cannot ${name}`, result.status === 404, `status ${result.status}`);
  }
  check("the owner's board is exactly as it was", (await snapshot()) === before);
  check("the owner still sees it in their list", (await call("GET", "/boards", { token: tokenA })).data.some((x) => x._id === id));
} finally {
  await Board.deleteMany({ _id: { $in: createdBoardIds } });
  const removed = await User.deleteMany({ email: { $regex: `-${run}@example\\.test$` } });
  console.log(`\ncleanup: removed ${removed.deletedCount} test accounts and ${createdBoardIds.length} board(s)`);
  await mongoose.disconnect();
  console.log(`passed ${passed}, failed ${failed}`);
  process.exitCode = failed ? 1 : 0;
}
