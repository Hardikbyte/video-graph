import "dotenv/config";
import mongoose from "mongoose";
import Board from "../models/Board.js";
import User from "../models/User.js";
import { normalizeEmail, validateEmail } from "../lib/validation.js";

// One-off, safe to run again. Moves the account from username login to email login.
// The existing user keeps its id and password, so all of its boards stay with it.
// Run: npm run migrate:users -- --email=you@example.com [--dry-run]

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const flag = argv.find((a) => a.startsWith("--email="));
  const email = normalizeEmail(flag ? flag.slice("--email=".length) : "");
  const problem = validateEmail(email);
  if (problem) throw new Error(`Pass the account email: --email=you@example.com (${problem})`);

  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const users = User.collection;

    const taken = await users.findOne({ email });
    if (taken) {
      console.log(`${email} already has an account (${taken._id}), nothing to link.`);
    } else {
      const legacy = await users.find({ email: { $exists: false }, username: { $exists: true } }).toArray();
      console.log(`Accounts still using a username: ${legacy.length}`);
      if (legacy.length === 0) throw new Error("No username account to link, and no account for that email.");
      if (legacy.length > 1) throw new Error("More than one username account found, link them by hand.");

      const [user] = legacy;
      const boardCount = await Board.countDocuments({ owner: user._id });
      console.log(`Linking "${user.username}" (${user._id}, ${boardCount} boards) to ${email}`);
      if (!dryRun) {
        await users.updateOne({ _id: user._id }, { $set: { email, name: user.username }, $unset: { username: "" } });
        console.log("  done");
      }
    }

    if (!dryRun) {
      // Drops the old unique index on username, which would stop a second email account
      // from being created, and builds the unique index on email.
      await User.syncIndexes();
      console.log("Indexes are in sync");
    }

    const orphaned = await Board.aggregate([
      { $lookup: { from: "users", localField: "owner", foreignField: "_id", as: "o" } },
      { $match: { o: { $size: 0 } } },
      { $project: { name: 1 } },
    ]);
    console.log(`Boards without an owner account: ${orphaned.length}`);
    orphaned.forEach((b) => console.log(`   - ${b.name}`));
    if (dryRun) console.log("Dry run, nothing written.");
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
