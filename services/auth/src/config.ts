import dotenv from "dotenv";

dotenv.config();

export const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://localhost:3004/api";
export const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
export const NODE_ENV = process.env.NODE_ENV || "development";
export const PORT = process.env.PORT || 3003;
export const DATABASE_URL = process.env.DATABASE_URL || "";
