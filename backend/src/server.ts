import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { testConnection } from "./config/db";
import authRoutes from "./routes/auth.routes";
import orderRoutes from "./routes/order.routes";

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "5000", 10);

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// Health check endpoint for deployment platforms
app.get("/api/health", async (_req, res) => {
  const dbHealthy = await testConnection();
  res.status(dbHealthy ? 200 : 503).json({
    status: dbHealthy ? "healthy" : "degraded",
    database: dbHealthy ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// Auth routes: /api/auth/register, /api/auth/recognize, /api/auth/verify-code
app.use("/api/auth", authRoutes);

// Order routes: /api/orders
app.use("/api/orders", orderRoutes);

// ---------------------------------------------------------------------------
// Global Error Handler
// ---------------------------------------------------------------------------
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred.",
    });
  }
);

// ---------------------------------------------------------------------------
// Start Server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`\n🚀 Bolt Checkout API running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Environment:  ${process.env.NODE_ENV || "development"}\n`);
});

export default app;
