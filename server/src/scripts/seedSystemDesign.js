import { runSeed } from "./seedBoards.js";

// Kept so `npm run seed:system-design` still works. Same flags as seedBoards.js.
runSeed(["--only=system-design", ...process.argv.slice(2)]).catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
