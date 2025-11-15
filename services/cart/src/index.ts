import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { NODE_ENV, PORT } from "./config";
import { addToCartController } from "./controllers";

// App
const app = express();

// Middlewares
// security
app.use(helmet());

// rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  handler: (_req: Request, res: Response) => {
    return res.status(429).json({
      error: "Too many requests, please try again later.",
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", limiter);

// cors
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT"],
  })
);
// logging
app.use(morgan("dev"));
// body parsing
app.use(express.json());
// urlencoded parsing
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/api", (req: Request, res: Response) => {
  const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(`Root route accessed at ${url}`);
  return res.json({
    message: "Running Cart Microservice!",
    url,
    environment: NODE_ENV || "development",
  });
});

app.get("/api/health", (req: Request, res: Response) => {
  return res.json({
    status: "Healthy",
    message: "Running Cart Microservice is healthy!",
  });
});

// Configure routes
app.post("/api/add-to-cart", addToCartController);

// 404 Not Found
app.use((req: Request, res: Response) => {
  return res.status(404).json({
    error: "Route not found",
    path: req.path,
    timestamp: new Date().toISOString(),
  });
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled Error:", err);
  return res.status(500).json({
    error: "Internal Server Error",
    message: err.message || "Something went wrong",
    timestamp: new Date().toISOString(),
  });
});

if (NODE_ENV) {
  app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}/api`);
  });
}

export default app;
