import { Router } from "express";
import {
  handleRegister,
  handleRecognize,
  handleVerifyCode,
} from "../controllers/auth.controller";

const router = Router();

// POST /api/auth/register   – Flow A: Register user, return 6-digit code
router.post("/register", handleRegister);

// POST /api/auth/recognize  – Flow B: Background email recognition check
router.post("/recognize", handleRecognize);

// POST /api/auth/verify-code – Flow B: Validate 6-digit code from modal
router.post("/verify-code", handleVerifyCode);

export default router;
