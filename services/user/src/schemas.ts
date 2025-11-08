import { z } from "zod";

export const UserCreateSchema = z.object({
  authUserId: z.string(),
  email: z.email(),
  name: z.string().min(2).max(100),
  address: z.string().min(5).max(200).optional(),
  phone: z.string().min(7).max(15).optional(),
});

export const UserUpdateSchema = UserCreateSchema.omit({
  authUserId: true,
}).partial();

// const userDatta = UserCreateSchema.parse({})

// const updateData = UserUpdateSchema.parse({});

// updateData.address
