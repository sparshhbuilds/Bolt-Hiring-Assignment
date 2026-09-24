import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Supabase always requires SSL; local Postgres typically does not
const isRemoteDb =
  process.env.DATABASE_URL?.includes("supabase") ||
  process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isRemoteDb ? { rejectUnauthorized: false } : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Log pool connection events in development
pool.on("error", (err) => {
  console.error("Unexpected error on idle client:", err);
});

/**
 * Test database connectivity. Returns true if healthy.
 */
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    return true;
  } catch (err) {
    console.error("Database connection failed:", err);
    return false;
  }
}

export default pool;
