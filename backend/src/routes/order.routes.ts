import { Router } from "express";
import {
  handleCreateOrder,
  handleGetOrders,
} from "../controllers/order.controller";

const router = Router();

// POST /api/orders  – Flow B: Submit checkout form, persist order
router.post("/", handleCreateOrder);

// GET /api/orders   – Verification: List recent orders
router.get("/", handleGetOrders);

export default router;
