import { userInfo } from "os";
import { z } from "zod";

export const OrderSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  userEmail: z.email(),
  cartSessionId: z.string(),
});

export const CartItemSchema = z.object({
  productId: z.string().min(1),
  inventoryId: z.string().min(1),
  quantity: z.number().min(1),
})