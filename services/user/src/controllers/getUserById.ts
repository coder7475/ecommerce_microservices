import { User } from "@/generated/prisma/client";
import prisma from "@/prisma_db";
import { Request, Response, NextFunction } from "express";

// users/:id?field=id|authUserId
const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const field = req.query.field as string;

    let user: User;

    if (field === "authUserId") {
      user = await prisma.user.findUnique({
        where: { authUserId: id },
      });
    } else {
      user = await prisma.user.findUnique({
        where: { id },
      });
    }

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    next(error);
  }
};

export default getUserById;
