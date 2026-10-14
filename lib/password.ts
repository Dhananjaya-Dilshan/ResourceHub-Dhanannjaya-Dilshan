import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password using bcryptjs.
 */
export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

/**
 * Compare plain text password against a bcrypt hash.
 */
export async function comparePassword(
  plainText: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

/**
 * Pre-computed dummy hash used when an email is not found to prevent
 * timing attack user enumeration.
 */
export const DUMMY_HASH =
  "$2a$10$w8T9J8hM0vK6q1Jd0m7Ute4U3Y0T4q4F5o1l6B7z8A9C0D1E2F3G4";
