import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";

export async function seedUser() {
  const username = process.env.SEED_USERNAME;
  const password = process.env.SEED_PASSWORD;

  if (!username || !password) {
    console.warn("SEED_USERNAME/SEED_PASSWORD not set, skipping seed");
    return;
  }

  const existing = await User.findOne({ username });
  if (existing) {
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ username, passwordHash });
  console.log(`Seeded user "${username}"`);
}

const isMain = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(seedUser)
    .then(() => mongoose.disconnect())
    .catch((err) => {
      console.error("Seed failed:", err.message);
      process.exit(1);
    });
}
