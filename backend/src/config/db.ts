import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// checking if database is hosted on cloud like supabase so we can enable ssl
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

// catching unexpected pool errors on idle database connections
pool.on("error", (err) => {
  console.error("Unexpected error on idle client:", err);
});

// helper function to ping postgres and confirm db is connected and healthy
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
