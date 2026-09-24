import { Request, Response } from "express";
import { z } from "zod";
import { createOrder, getRecentOrders } from "../services/order.service";

// zod schema validating checkout form fields like email, address, and total
const createOrderSchema = z.object({
  userId: z.string().uuid().optional().nullable(),
  email: z.string().email("Please provide a valid email address."),
  phone: z.string().min(1, "Phone number is required."),
  shippingName: z.string().min(1, "Shipping name is required."),
  addressLine1: z.string().min(1, "Address is required."),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required."),
  state: z.string().min(1, "State is required."),
  postalCode: z.string().min(1, "Postal code is required."),
  country: z.string().optional(),
  orderTotal: z.number().positive().optional(),
  isGuest: z.boolean(),
});

// handling order placement when user completes checkout
export async function handleCreateOrder(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const order = await createOrder(parsed.data);

    res.status(201).json({
      success: true,
      order: {
        id: order.id,
        email: order.email,
        shippingName: order.shipping_name,
        orderTotal: order.order_total,
        isGuest: order.is_guest,
        createdAt: order.created_at,
      },
    });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}

// fetching recent orders list for verification
export async function handleGetOrders(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const orders = await getRecentOrders();
    res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error("Get orders error:", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
}
