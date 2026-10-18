import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";
import { normalizeEmail, validatePassword } from "../lib/validation.js";

// Sets a new password for an account, for example after it was forgotten.
// The password comes from the environment so it does not end up in shell history:
//   PowerShell:  $env:NEW_PASSWORD = "a long new password"; npm run reset-password -- --email=you@example.com
//   Bash:        NEW_PASSWORD="a long new password" npm run reset-password -- --email=you@example.com

async function main() {
  const flag = process.argv.slice(2).find((a) => a.startsWith("--email="));
  const email = normalizeEmail(flag ? flag.slice("--email=".length) : "");
  const password = process.env.NEW_PASSWORD;

  if (!email) throw new Error("Pass the account email: --email=you@example.com");
  const problem = validatePassword(password);
  if (problem) throw new Error(`NEW_PASSWORD is not usable: ${problem}`);

  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const user = await User.findOne({ email });
    if (!user) throw new Error(`No account found for ${email}`);
    user.passwordHash = await bcrypt.hash(password, 12);
    await user.save();
    console.log(`Password updated for ${email}. Existing logins keep working until they expire.`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error("Reset failed:", err.message);
  process.exit(1);
});
