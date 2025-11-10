import { Request, Response, NextFunction } from "express";
import prisma from "@/prisma_db";
import { UserCreateSchema } from "../schemas";
import bcrypt from "bcryptjs";
import axios from "axios";
import { EMAIL_SERVICE_URL, USER_SERVICE_URL } from "@/config";
import generateVerificationCode from "@/utils/generateVerificationCode";

const userRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsedData = UserCreateSchema.safeParse(req.body);

    if (!parsedData.success) {
      return res.status(400).json({ errors: parsedData.error.issues });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: parsedData.data.email },
    });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(parsedData.data.password, salt);

    // Create the auth user
    const user = await prisma.user.create({
      data: {
        ...parsedData.data,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        verified: true,
      },
    });

    console.log("User Created: ", user);

    // create the user profile using user service
    await axios.post(`${USER_SERVICE_URL}/users`, {
      authUserId: user.id,
      email: user.email,
      name: user.name,
    });

    // Generate verification code
    const code = generateVerificationCode();

    await prisma.verificationCode.create({
      data: {
        userId: user.id,
        code,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
      },
    });
    // Send verification email
    await axios.post(`${EMAIL_SERVICE_URL}/emails/send`, {
      recipient: user.email,
      subject: "Verify your email",
      body: `Your verification code is: ${code}`,
      source: "User Registration",
    });

    return res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

export default userRegistration;
