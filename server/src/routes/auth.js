import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import auth from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { wrapRouter } from "../lib/asyncRoute.js";
import { normalizeEmail, validateEmail, validateName, validatePassword } from "../lib/validation.js";

const router = wrapRouter(Router());

// Cost 12 is about a quarter of a second per hash: slow enough to hurt guessing attacks.
const BCRYPT_COST = 12;
const MAX_LOGIN_PASSWORD_LENGTH = 200;

// Compared against when the email is unknown, so the response time does not reveal
// which emails have an account.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_COST);

const loginByIp = rateLimit({ max: 60, keyFor: (req) => `login-ip|${req.ip}` });
const loginByAccount = rateLimit({
  max: 10,
  keyFor: (req) => `login|${req.ip}|${normalizeEmail(req.body?.email)}`,
});
const signupByIp = rateLimit({ max: 10, keyFor: (req) => `signup|${req.ip}` });

const publicUser = (user) => ({ id: user._id.toString(), email: user.email, name: user.name || "" });

const signToken = (user) =>
  jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "7d" });

router.post("/signup", signupByIp, async (req, res) => {
  const { name, email: rawEmail, password } = req.body || {};
  const email = normalizeEmail(rawEmail);

  const problem = validateEmail(email) || validatePassword(password) || validateName(name);
  if (problem) {
    return res.status(400).json({ error: problem });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  let user;
  try {
    user = await User.create({ email, name: typeof name === "string" ? name.trim() : "", passwordHash });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }
    throw err;
  }

  return res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

router.post("/login", loginByIp, loginByAccount, async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;

  if (!email || typeof password !== "string" || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = await User.findOne({ email });
  const tooLong = password.length > MAX_LOGIN_PASSWORD_LENGTH;
  const match = await bcrypt.compare(tooLong ? "x" : password, user ? user.passwordHash : DUMMY_HASH);

  // One message for every failure, so it never says which part was wrong.
  if (!user || !match || tooLong) {
    return res.status(401).json({ error: "Incorrect email or password" });
  }

  // Accounts made with a cheaper bcrypt cost are upgraded the next time the password is known.
  if (bcrypt.getRounds(user.passwordHash) < BCRYPT_COST) {
    user.passwordHash = await bcrypt.hash(password, BCRYPT_COST);
    await user.save();
  }

  loginByAccount.reset(req.rateLimitKey);
  return res.json({ token: signToken(user), user: publicUser(user) });
});

// The app calls this on load to check that a saved session is still valid.
router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(401).json({ error: "This account no longer exists" });
  }
  return res.json({ user: publicUser(user) });
});

export default router;
