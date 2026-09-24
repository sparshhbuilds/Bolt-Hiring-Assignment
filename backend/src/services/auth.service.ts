import crypto from "crypto";
import pool from "../config/db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface UserRecord {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  auth_code: string;
  created_at: string;
}

export interface RegisterInput {
  email: string;
  firstName: string;
  lastName: string;
}

export interface RecognizeResult {
  recognized: boolean;
  user?: { email: string; firstName: string };
}

export interface VerifyResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  message?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a cryptographically secure random 6-digit numeric code.
 * Uses crypto.randomInt for uniform distribution (no modulo bias).
 */
function generateAuthCode(): string {
  const code = crypto.randomInt(100000, 1000000); // range: 100000–999999
  return code.toString();
}

// ---------------------------------------------------------------------------
// Service Functions
// ---------------------------------------------------------------------------

/**
 * Register a new user. Generates a 6-digit auth code.
 * Returns the created user record and the plaintext code.
 * Throws if email is already registered.
 */
export async function registerUser(
  input: RegisterInput
): Promise<{ user: UserRecord; code: string }> {
  const email = input.email.toLowerCase().trim();
  const code = generateAuthCode();

  // Check if email already exists
  const existing = await pool.query(
    "SELECT id FROM users WHERE LOWER(email) = $1",
    [email]
  );

  if (existing.rows.length > 0) {
    throw new Error("DUPLICATE_EMAIL");
  }

  const result = await pool.query(
    `INSERT INTO users (email, first_name, last_name, auth_code)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, first_name, last_name, auth_code, created_at`,
    [email, input.firstName.trim(), input.lastName.trim(), code]
  );

  return { user: result.rows[0], code };
}

/**
 * Recognize whether an email belongs to a registered user.
 * This is the background check called while the user is typing on checkout.
 */
export async function recognizeEmail(email: string): Promise<RecognizeResult> {
  const normalizedEmail = email.toLowerCase().trim();

  const result = await pool.query(
    "SELECT email, first_name FROM users WHERE LOWER(email) = $1",
    [normalizedEmail]
  );

  if (result.rows.length === 0) {
    return { recognized: false };
  }

  const row = result.rows[0];
  return {
    recognized: true,
    user: {
      email: row.email,
      firstName: row.first_name,
    },
  };
}

/**
 * Verify the 6-digit code submitted by the user against the stored code.
 * Returns user details on success, error message on failure.
 */
export async function verifyCode(
  email: string,
  code: string
): Promise<VerifyResult> {
  const normalizedEmail = email.toLowerCase().trim();

  const result = await pool.query(
    "SELECT id, email, first_name, last_name, auth_code FROM users WHERE LOWER(email) = $1",
    [normalizedEmail]
  );

  if (result.rows.length === 0) {
    return { success: false, message: "No account found with this email." };
  }

  const user = result.rows[0];

  if (user.auth_code !== code) {
    return {
      success: false,
      message: "Invalid 6-digit code. Please verify and try again.",
    };
  }

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
    },
  };
}
