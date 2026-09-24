import { Router } from "express";
import {
  handleCreateOrder,
  handleGetOrders,
} from "../controllers/order.controller";

const router = Router();

// route to save new order in database for signed in or guest user
router.post("/", handleCreateOrder);

// route to fetch list of recent orders for verification
router.get("/", handleGetOrders);

export default router;
