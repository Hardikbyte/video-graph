import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export default function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  if (!mongoose.isValidObjectId(payload.sub)) {
    return res.status(401).json({ error: "Invalid token" });
  }

  req.userId = payload.sub;
  return next();
}
