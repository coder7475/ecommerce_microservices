import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || "3000";
export const NODE_ENV = process.env.NODE_ENV || "development";
export const AUTH_SERVICE =
  process.env.AUTH_SERVICE || "http://localhost:3003/api";
