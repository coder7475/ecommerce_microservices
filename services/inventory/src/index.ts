import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import dotenv from "dotenv";

dotenv.config();

const app = new Hono();

app.use("*", cors());
app.use("*", logger());

app.get("/", (c) => {
  return c.json({
    message: "Running Inventory Microservice!",
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
const port = Number(process.env.PORT) || 3001;
serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
