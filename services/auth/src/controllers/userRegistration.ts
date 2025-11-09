import { Request, Response, NextFunction } from "express";
import prisma from "@/prisma_db";
import { UserCreateSchema } from "../schemas";
import bcrypt from "bcryptjs";
import axios from "axios";
import { USER_SERVICE_URL } from "@/config";

export const userRegistration = async (
  res: Response,
  req: Request,
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

    // TODO: Generate verification code
    // TODO: Send verification email

    return res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

export default userRegistration;
