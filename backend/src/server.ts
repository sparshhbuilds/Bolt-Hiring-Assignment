import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { testConnection } from "./config/db";
import authRoutes from "./routes/auth.routes";
import orderRoutes from "./routes/order.routes";

// loading environment variables from .env file so we can access database link and port
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "5000", 10);

// setting up middleware for cors and json body parsing
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

// mounting API routes for auth and orders

// health check route so deployment sites like render know our server and db are alive
app.get("/api/health", async (_req, res) => {
  const dbHealthy = await testConnection();
  res.status(dbHealthy ? 200 : 503).json({
    status: dbHealthy ? "healthy" : "degraded",
    database: dbHealthy ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

// auth endpoints handling user register, email recognition, and code verification
app.use("/api/auth", authRoutes);

// order endpoints handling checkout submissions
app.use("/api/orders", orderRoutes);

// catch-all error handler so server doesn't crash silently on unexpected errors
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

// booting up the server on the configured port
app.listen(PORT, () => {
  console.log(`\n🚀 Bolt Checkout API running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Environment:  ${process.env.NODE_ENV || "development"}\n`);
});

export default app;
