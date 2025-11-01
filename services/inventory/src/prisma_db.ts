import { PrismaClient } from "../generated/prisma/client";

const prisma = new PrismaClient({
  // Use connection pooling for better performance in serverless environments
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export default prisma;
