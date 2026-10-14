import "dotenv/config";
import mongoose from "mongoose";
import Board from "../models/Board.js";
import User from "../models/User.js";

// One-off, safe to run again. Uses targeted updates, so positions you moved are kept.
//  1. nodes saved before node types existed get type "video"
//  2. untitled link nodes on the System Design board get a title
// Run: npm run migrate:boards [-- --dry-run]

const LINK_TITLES = {
  "https://lnkd.in/p/dc3v49yq": "Caching (LinkedIn)",
  "https://lnkd.in/p/dNKFRQR5": "System design (LinkedIn)",
};

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const owner = await User.findOne({ username: process.env.SEED_USERNAME });
    if (!owner) throw new Error("Seed user not found (check SEED_USERNAME)");
    const filter = { owner: owner._id };

    const untypedFilter = { ...filter, nodes: { $elemMatch: { type: { $exists: false } } } };
    const untyped = await Board.countDocuments(untypedFilter);
    console.log(`Boards with nodes that have no type: ${untyped}`);
    if (!dryRun && untyped) {
      const res = await Board.updateMany(
        untypedFilter,
        { $set: { "nodes.$[n].type": "video" } },
        { arrayFilters: [{ "n.type": { $exists: false } }] }
      );
      console.log(`  updated ${res.modifiedCount} board(s)`);
    }

    for (const [url, title] of Object.entries(LINK_TITLES)) {
      const filterLink = { ...filter, name: "System Design", nodes: { $elemMatch: { url, title: "" } } };
      const count = await Board.countDocuments(filterLink);
      console.log(`Untitled link ${url}: ${count ? "needs a title" : "already fine"}`);
      if (!dryRun && count) {
        await Board.updateOne(
          filterLink,
          { $set: { "nodes.$[n].title": title } },
          { arrayFilters: [{ "n.url": url, "n.title": "" }] }
        );
        console.log(`  titled "${title}"`);
      }
    }
    if (dryRun) console.log("Dry run, nothing written.");
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
