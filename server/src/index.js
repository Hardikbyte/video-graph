import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import boardsRoutes from "./routes/boards.js";
import { seedUser } from "./scripts/seedUser.js";
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/boards", boardsRoutes);

// Bump API_VERSION together with REQUIRED_API_VERSION in client/src/api/client.js
// whenever the routes the client depends on change.
const API_VERSION = 2;
app.get("/api/health", (req, res) => res.json({ ok: true, api: API_VERSION }));

const port = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    await seedUser();
    app.listen(port, () => console.log(`Server listening on port ${port}`));
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
