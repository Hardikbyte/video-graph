import User from "../../models/User.js";
import { normalizeEmail } from "../../lib/validation.js";

// The account the scripts work for: --email=you@example.com, or SEED_EMAIL in .env.
export function ownerEmailFromArgs(argv = process.argv.slice(2)) {
  const flag = argv.find((a) => a.startsWith("--email="));
  return normalizeEmail(flag ? flag.slice("--email=".length) : process.env.SEED_EMAIL);
}

export async function findOwner(argv) {
  const email = ownerEmailFromArgs(argv);
  if (!email) throw new Error("Say which account to use: pass --email=you@example.com or set SEED_EMAIL in .env");
  const owner = await User.findOne({ email });
  if (!owner) throw new Error(`No account found for ${email}. Sign up first, or run npm run migrate:users`);
  return owner;
}
