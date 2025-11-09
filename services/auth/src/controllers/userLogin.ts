import { UserLoginSchema } from "./../schemas";
import { Request, Response, NextFunction } from "express";
import prisma from "@/prisma_db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { AccountStatus, LoginAttempt } from "@prisma/client";
import { JWT_SECRET } from "@/config";

type LoginHistory = {
  userId: string;
  ipAddress: string | undefined;
  userAgent: string | undefined;
  attempt: LoginAttempt;
};

const createLoginHistory = async (info: LoginHistory) => {
  try {
    await prisma.loginHistory.create({
      data: {
        ...info,
      },
    });
  } catch (error) {
    console.error("Error creating login history:", error);
  }
};

const userLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ipAddress = req.header("x-forwarded-for") || req.ip || "";
    const userAgent = req.header("user-agent") || "";
    // console.log(ipAddress, userAgent);

    const parsedData = UserLoginSchema.safeParse(req.body);

    if (!parsedData.success) {
      return res.status(400).json({ errors: parsedData.error.issues });
    }

    const exitingUser = await prisma.user.findUnique({
      where: { email: parsedData.data.email },
    });

    if (!exitingUser) {
      await createLoginHistory({
        userId: "Guest",
        ipAddress,
        userAgent,
        attempt: LoginAttempt.FAILED,
      });
      return res.status(404).json({ message: "User not found" });
    }

    // compare password
    const isMatch = await bcrypt.compare(
      parsedData.data.password,
      exitingUser.password
    );

    if (!isMatch) {
      await createLoginHistory({
        userId: exitingUser.id,
        ipAddress,
        userAgent,
        attempt: LoginAttempt.FAILED,
      });
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // check if user is verified
    if (!exitingUser.verified) {
      await createLoginHistory({
        userId: exitingUser.id,
        ipAddress,
        userAgent,
        attempt: LoginAttempt.FAILED,
      });
      return res.status(403).json({ message: "User not verified" });
    }

    // check if user account is active
    if (exitingUser.status !== AccountStatus.ACTIVE) {
      await createLoginHistory({
        userId: exitingUser.id,
        ipAddress,
        userAgent,
        attempt: LoginAttempt.FAILED,
      });
      return res.status(403).json({
        message: `User account is not active. Currently your account is ${exitingUser.status}!`,
      });
    }

    // generate accesstoken
    const accessToken = jwt.sign(
      {
        userId: exitingUser.id,
        email: exitingUser.email,
        role: exitingUser.role,
      },
      JWT_SECRET ?? "your_jwt_secret_key",
      { expiresIn: "2h" }
    );

    await createLoginHistory({
      userId: exitingUser.id,
      ipAddress,
      userAgent,
      attempt: LoginAttempt.SUCCESS,
    });

    return res.status(200).json({
      message: "Login successful",
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

export default userLogin;
