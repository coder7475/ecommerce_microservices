import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || "3000";
export const NODE_ENV = process.env.NODE_ENV || "development";
export const REDIS_HOST = process.env.REDIS_HOST || "localhost";
export const REDIS_PORT = process.env.REDIS_PORT || "6379";
export const CART_TTL = process.env.CART_TTL || "60"; // in seconds
export const INVENTORY_SERVICE =
  process.env.INVENTORY_SERVICE || "http://localhost:3002/api";
