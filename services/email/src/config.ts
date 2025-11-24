import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

export const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://localhost:3004/api";
export const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
export const NODE_ENV = process.env.NODE_ENV || "development";
export const PORT = process.env.PORT || 3003;
export const DATABASE_URL = process.env.DATABASE_URL || "";
export const DEFAULT_SENDER_MAIL =
  process.env.DEFAULT_SENDER_MAIL || "admin@example.com";
export const SMTP_HOST = process.env.SMTP_HOST || "smpt.mailtrap.io";
export const SMTP_PORT = process.env.SMTP_PORT
  ? Number.parseInt(process.env.SMTP_PORT, 10)
  : 587;

// Nodemailer transporter
export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
});

export const QUEUE_URL = process.env.QUEUE_URL || "amqp://localhost";
