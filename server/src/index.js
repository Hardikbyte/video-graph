import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import boardsRoutes from "./routes/boards.js";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

// A weak signing secret lets anyone forge a login, so production refuses to start with one.
const secret = process.env.JWT_SECRET || "";
if (secret.length < 32 || /change-?me/i.test(secret)) {
  const message = "JWT_SECRET is missing, short or a placeholder. Use a random value of at least 32 characters.";
  if (isProduction) {
    console.error(message);
    process.exit(1);
  }
  console.warn(`Warning: ${message}`);
}

const app = express();
app.set("trust proxy", process.env.TRUST_PROXY === "true");

// Only the app itself may call the API from a browser. List more origins separated by commas.
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)),
  })
);
app.use(express.json({ limit: "2mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/boards", boardsRoutes);

// Bump API_VERSION together with REQUIRED_API_VERSION in client/src/api/client.js
// whenever the routes the client depends on change.
const API_VERSION = 3;
app.get("/api/health", (req, res) => res.json({ ok: true, api: API_VERSION }));

const port = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(port, () => console.log(`Server listening on port ${port}`));
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
