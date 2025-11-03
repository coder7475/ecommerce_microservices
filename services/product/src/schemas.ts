import { ActionType } from "@prisma/client";
import z from "zod";

export const InventoryCreateDTOSchema = z.object({
  productId: z.string(),
  sku: z.string(),
  quantity: z.number().int().positive().optional().default(0),
});

export type InventoryCreateDTO = z.infer<typeof InventoryCreateDTOSchema>;

// Update Schema
export const InventoryUpdateDTOSchema = z.object({
  quantity: z.number().int().positive(),
  actionType: z.enum(ActionType),
});
