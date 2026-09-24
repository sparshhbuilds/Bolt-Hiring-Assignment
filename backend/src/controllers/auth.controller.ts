import { Request, Response } from "express";
import { z } from "zod";
import {
  registerUser,
  recognizeEmail,
  verifyCode,
} from "../services/auth.service";

// ---------------------------------------------------------------------------
// Validation Schemas (Zod)
// ---------------------------------------------------------------------------
const registerSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
  firstName: z
    .string()
    .min(1, "First name is required.")
    .max(100, "First name is too long."),
  lastName: z
    .string()
    .min(1, "Last name is required.")
    .max(100, "Last name is too long."),
});

const recognizeSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
});

const verifyCodeSchema = z.object({
  email: z.string().email("Please provide a valid email address."),
  code: z
    .string()
    .length(6, "Code must be exactly 6 digits.")
    .regex(/^\d{6}$/, "Code must be a 6-digit number."),
});

// ---------------------------------------------------------------------------
// Controller Handlers
// ---------------------------------------------------------------------------

/**
 * POST /api/auth/register
 * Registers a new user and returns their 6-digit auth code.
 */
export async function handleRegister(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { user, code } = await registerUser(parsed.data);

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      code,
    });
  } catch (err: any) {
    if (err.message === "DUPLICATE_EMAIL") {
      res.status(409).json({
        success: false,
        message:
          "An account with this email already exists. Please use a different email.",
      });
      return;
    }
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

/**
 * POST /api/auth/recognize
 * Background check: does an account exist for the given email?
 */
export async function handleRecognize(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const parsed = recognizeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await recognizeEmail(parsed.data.email);
    res.status(200).json(result);
  } catch (err) {
    console.error("Recognize error:", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

/**
 * POST /api/auth/verify-code
 * Validates the 6-digit code against the registered user's stored code.
 */
export async function handleVerifyCode(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const parsed = verifyCodeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await verifyCode(parsed.data.email, parsed.data.code);

    if (!result.success) {
      res.status(401).json(result);
      return;
    }

    res.status(200).json(result);
  } catch (err) {
    console.error("Verify code error:", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}
