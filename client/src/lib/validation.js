// The same account rules as the server, so mistakes are caught before a request is sent.
// The server still checks everything again.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_BYTES = 72;

export function validateEmail(value) {
  const email = value.trim();
  if (!email) return "Enter your email address.";
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) return "Enter a valid email address.";
  return "";
}

export function validateNewPassword(password) {
  if (!password) return "Choose a password.";
  if (password.length < PASSWORD_MIN_LENGTH) return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) return "That password is too long.";
  return "";
}
