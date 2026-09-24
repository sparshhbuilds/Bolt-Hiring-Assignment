import { Router } from "express";
import {
  handleRegister,
  handleRecognize,
  handleVerifyCode,
} from "../controllers/auth.controller";

const router = Router();

// register route creating new user and returning a 6-digit login passcode
router.post("/register", handleRegister);

// recognize route checking if an email already exists in database as user types
router.post("/recognize", handleRecognize);

// verify-code route checking if the 6-digit passcode typed in modal matches database
router.post("/verify-code", handleVerifyCode);

export default router;
