import "dotenv/config";
import { pathToFileURL } from "node:url";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";
import { normalizeEmail, validateEmail, validatePassword } from "../lib/validation.js";

// Creates one account from SEED_EMAIL and SEED_PASSWORD. Run by hand: npm run seed
// The server no longer does this on start, because a default account on a fresh
// database would be a way in for anyone.
export async function seedUser() {
  const email = normalizeEmail(process.env.SEED_EMAIL);
  const password = process.env.SEED_PASSWORD;

  const problem = validateEmail(email) || validatePassword(password);
  if (problem) {
    console.warn(`SEED_EMAIL or SEED_PASSWORD is not usable (${problem}), nothing created`);
    return;
  }

  if (await User.findOne({ email })) {
    console.log(`An account for ${email} already exists`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({ email, name: "", passwordHash });
  console.log(`Created the account ${email}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(seedUser)
    .then(() => mongoose.disconnect())
    .catch((err) => {
      console.error("Seed failed:", err.message);
      process.exit(1);
    });
}
