import { z } from "zod";

export const UserCreateSchema = z.object({
  email: z.email(),
  name: z.string().min(3).max(255),
  password: z.string().min(8).max(255),
});
