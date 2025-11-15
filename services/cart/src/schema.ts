import { z } from "zod";

export const CartItemSchema = z.object({
  productId: z.string().min(1),
  inventoryId: z.string().min(1),
  quantity: z.number().min(1),
});
