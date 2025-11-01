import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

// Load environment variables from .env
import dotenv from "dotenv";
dotenv.config();

// App
const app = new Hono();
const serviceLogger = logger();

// Middlewares
app.use("*", cors());
app.use("*", serviceLogger);

// Routes
app.get("/", (c) => {
  return c.json({
    message: "Running Inventory Microservice!",
    envLoaded: !!process.env.DATABASE_URL, // Example of env utilization
  });
});

app.get("/health", (c) => {
  return c.json({
    status: "Healthy",
    message: "Running Inventory Microservice is healthy!",
  });
});

app.notFound((c) => {
  return c.json(
    {
      error: "Route not found",
      path: c.req.path,
      timestamp: new Date().toISOString(),
    },
    404
  );
});

// Server
export default app;
