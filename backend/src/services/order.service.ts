import pool from "../config/db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface CreateOrderInput {
  userId?: string | null;
  email: string;
  phone: string;
  shippingName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  orderTotal?: number;
  isGuest: boolean;
}

export interface OrderRecord {
  id: string;
  user_id: string | null;
  email: string;
  phone: string;
  shipping_name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  order_total: string;
  is_guest: boolean;
  created_at: string;
}

// saving a new order into the database for logged in user or guest checkout
export async function createOrder(
  input: CreateOrderInput
): Promise<OrderRecord> {
  const result = await pool.query(
    `INSERT INTO orders (
      user_id, email, phone, shipping_name,
      address_line1, address_line2, city, state,
      postal_code, country, order_total, is_guest
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      input.userId || null,
      input.email.toLowerCase().trim(),
      input.phone.trim(),
      input.shippingName.trim(),
      input.addressLine1.trim(),
      input.addressLine2?.trim() || null,
      input.city.trim(),
      input.state.trim(),
      input.postalCode.trim(),
      input.country || "United States",
      input.orderTotal ?? 9500.0,
      input.isGuest,
    ]
  );

  return result.rows[0];
}

// pulling the latest orders from database sorted by newest first
export async function getRecentOrders(
  limit: number = 20
): Promise<OrderRecord[]> {
  const result = await pool.query(
    "SELECT * FROM orders ORDER BY created_at DESC LIMIT $1",
    [limit]
  );
  return result.rows;
}
