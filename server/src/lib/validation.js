// Input rules for accounts. Pure functions, so they are easy to unit test.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_BYTES = 72; // bcrypt ignores everything after 72 bytes
export const NAME_MAX_LENGTH = 60;

export function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

// Each validator returns an error message, or null when the value is fine.
export function validateEmail(email) {
  if (!email) return "Email is required";
  if (email.length > 254) return "Email is too long";
  if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address";
  return null;
}

export function validatePassword(password) {
  if (typeof password !== "string" || !password) return "Password is required";
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (Buffer.byteLength(password, "utf8") > PASSWORD_MAX_BYTES) {
    return `Password is too long (at most ${PASSWORD_MAX_BYTES} bytes)`;
  }
  return null;
}

export function validateName(name) {
  if (name === undefined || name === null || name === "") return null;
  if (typeof name !== "string") return "Name must be text";
  if (name.trim().length > NAME_MAX_LENGTH) return `Name must be at most ${NAME_MAX_LENGTH} characters`;
  return null;
}
