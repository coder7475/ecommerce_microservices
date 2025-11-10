import { z } from "zod";

export const EmailCreateSchema = z.object({
  recipient: z.email(),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  source: z.string(),
  sender: z.email().optional(),
});
