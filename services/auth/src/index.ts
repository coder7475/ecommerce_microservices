import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import { PORT, NODE_ENV, DATABASE_URL } from "@/config";
import {
  userLogin,
  userRegistration,
  verifyCode,
  verifyToken,
} from "./controllers";

// App
const app = express();

// Middlewares
app.use(helmet());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT"],
  })
);
app.use(morgan("dev")); // or morgan("combined") for production
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/api", (req: Request, res: Response) => {
  const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log(`Root route accessed at ${url}`);
  return res.json({
    message: "Running Auth Microservice!",
    envLoaded: !!DATABASE_URL,
    url,
    environment: NODE_ENV || "development",
  });
});

app.get("/api/health", (req: Request, res: Response) => {
  return res.json({
    status: "Healthy",
    message: "Running Auth Microservice is healthy!",
  });
});

// CORS Handling Middleware
// app.use((req: Request, res: Response, next: NextFunction) => {
//   const allowedOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];
//   const origin = req.headers.origin as string;

//   if (allowedOrigins.includes(origin)) {
//     res.setHeader("Access-Control-Allow-Origin", origin);
//     next();
//   } else {
//     res.status(403).json({
//       error: "CORS Error: Origin not allowed",
//       origin,
//       timestamp: new Date().toISOString(),
//     });
//   }
// });

// auth routes
app.post("/api/auth/registration", userRegistration);
app.post("/api/auth/login", userLogin);
app.post("/api/auth/verify-token", verifyToken);
app.post("/api/auth/verify-code", verifyCode);

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

app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}/api`);
});

export default app;
