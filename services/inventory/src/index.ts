import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createInventory } from "./controllers";
import { serve } from "@hono/node-server";

// Environment variables are handled by Cloudflare Workers runtime

// App
const app = new Hono();
const serviceLogger = logger();
const port = process.env.PORT || 3000;
console.log(port);
// Middlewares
app.use("*", cors());
app.use("*", serviceLogger);

// Routes
app.get("/", (c) => {
  const url = `${c.req.url}`;
  console.log(`Root route accessed at ${url} on port ${port}`);
  return c.json({
    message: "Running Inventory Microservice!",
    envLoaded: !!process.env.DATABASE_URL,
    url,
    port: Number(port),
  });
});

app.get("/health", (c) => {
  return c.json({
    status: "Healthy",
    message: "Running Inventory Microservice is healthy!",
  });
});

// Inventory Routes
app.post("/inventory", createInventory);

// 404 Not Found
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

// Global Error Handler
app.onError((err, c) => {
  console.error("Unhandled Error:", err);
  return c.json(
    {
      error: "Internal Server Error",
      message: err.message || "Something went wrong",
      timestamp: new Date().toISOString(),
    },
    500
  );
});

// Server export
serve({
  fetch: app.fetch,
  port: Number(port),
});

export default app;
