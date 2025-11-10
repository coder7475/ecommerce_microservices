import { Request, Response, NextFunction } from "express";
import prisma from "@/prisma_db";

const getEmails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const emails = await prisma.email.findMany({
      orderBy: {
        sentAt: "desc",
      },
    });

    return res.status(200).json({
      message: "Emails retrieved successfully",
      data: emails,
    });
  } catch (error) {
    next(error);
  }
};

export default getEmails;
