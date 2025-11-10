import { DEFAULT_SENDER_MAIL, transporter } from "@/config";
import prisma from "@/prisma_db";
import { EmailCreateSchema } from "@/schemas";
import { Request, Response, NextFunction } from "express";

const sendEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedBody = EmailCreateSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({
        message: "Invalid request data",
        errors: parsedBody.error.issues,
      });
    }
    // create email option
    const { sender, recipient, subject, body, source } = parsedBody.data;
    const from = sender || DEFAULT_SENDER_MAIL;
    const emailOptions = {
      from,
      to: recipient,
      subject,
      text: body,
    };

    const { rejected, response } = await transporter.sendMail(emailOptions);

    if (rejected.length > 0) {
      console.log(`Email Rejected:`, rejected);
      return res.status(500).json({
        message: "Failed to send email",
        details: rejected,
      });
    }

    await prisma.email.create({
      data: {
        sender: from,
        recipient,
        subject,
        body,
        source,
      },
    });

    return res.status(200).json({
      message: "Email sent successfully",
      info: response,
    });
  } catch (error) {
    next(error);
  }
};

export default sendEmail;
