import dotenv from "dotenv";


dotenv.config();


export const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
export const NODE_ENV = process.env.NODE_ENV || "development";
export const PORT = process.env.PORT || 3003;
export const DATABASE_URL = process.env.DATABASE_URL || "";

export const PRODUCT_SERVICE = process.env.PRODUCT_SERVICE || "http://localhost:3001/api";

export const CART_SERVICE = process.env.CART_SERVICE || "http://localhost:3006/api";

export const EMAIL_SERVICE = process.env.EMAIL_SERVICE || "http://localhost:3005/api";
export const QUEUE_URL = process.env.QUEUE_URL || "amqp://localhost";