import { Request, Response, NextFunction } from "express";
import prisma from "@/prisma_db";
import { EmailCodeVerificationSchema } from "../schemas";
import { AccountStatus, VerificationStatus } from "@prisma/client";
import axios from "axios";
import { EMAIL_SERVICE_URL } from "@/config";

const verifyCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedBody = EmailCodeVerificationSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({ errors: parsedBody.error.issues });
    }

    const { email, code } = parsedBody.data;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // find verification code
    const verificationRecord = await prisma.verificationCode.findFirst({
      where: {
        userId: user.id,
        code,
      },
    });

    if (!verificationRecord) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    if (verificationRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: "Code has expired" });
    }

    // update user status
    await prisma.user.update({
      where: { id: user.id },
      data: { verified: true, status: AccountStatus.ACTIVE },
    });

    // update verification code status
    await prisma.verificationCode.update({
      where: { id: verificationRecord.id },
      data: { status: VerificationStatus.USED, verifiedAt: new Date() },
    });

    // send success email
    await axios.post(`${EMAIL_SERVICE_URL}/emails/send`, {
      recipient: user.email,
      subject: "Email Verified Successfully",
      body: `Hello ${user.name}, your email has been successfully verified.`,
      source: "Verify Code",
    });

    return res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    next(error);
  }
};

export default verifyCode;
