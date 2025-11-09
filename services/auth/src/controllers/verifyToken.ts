import { Request, Response, NextFunction } from "express";
import prisma from "@/prisma_db";
import jwt from "jsonwebtoken";
import { AccessTokenSchema } from "../schemas";
import { JWT_SECRET } from "@/config";

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedData = AccessTokenSchema.safeParse(req.body);

    if (!parsedData.success) {
      return res.status(400).json({ errors: parsedData.error.issues });
    }
    const accessToken = parsedData.data.accessToken;

    const decoded = jwt.verify(
      accessToken,
      JWT_SECRET || "your_jwt_secret_key"
    );

    const existingUser = await prisma.user.findUnique({
      where: { id: (decoded as any).userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!existingUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    return res.status(200).json({
      message: "Authorized",
      user: existingUser,
    });
  } catch (error) {
    next(error);
  }
};

export default verifyToken;
