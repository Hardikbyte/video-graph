import mongoose from "mongoose";

// An account is identified by its email. The password is only ever stored as a bcrypt hash.
const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, default: "", trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
