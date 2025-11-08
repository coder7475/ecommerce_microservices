import prisma from "@/prisma_db";
import { Request, Response, NextFunction } from "express";
import { UserCreateSchema } from "../schemas";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseBody = UserCreateSchema.safeParse(req.body);

    if (!parseBody.success) {
      return res.status(400).json({
        error: "Invalid request data",
        details: parseBody.error.issues,
      });
    }

    const existedUser = await prisma.user.findUnique({
      where: { authUserId: parseBody.data.authUserId },
    });

    if (existedUser) {
      return res.status(409).json({
        error: "User already exists",
      });
    }

    // create new user
    const user = await prisma.user.create({
      data: parseBody.data,
    });

    return res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

export default createUser;
