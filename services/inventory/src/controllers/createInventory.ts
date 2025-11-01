import prisma from "@/prisma_db";
import { InventoryCreateDTOSchema } from "@/schemas";
import { Context, Next } from "hono";

export const createInventory = async (c: Context<{}>, next: Next) => {
  try {
    const parsedBody = InventoryCreateDTOSchema.safeParse(c.req.parseBody);
    if (!parsedBody.success) {
      return c.json(
        {
          error: parsedBody.error,
        },
        404
      );
    }

    // Create Inventory
    const inventory = await prisma.Inventory.create({
      data: {
        ...parsedBody.data,
        histories: {
          create: {
            actionType: "IN",
            quantityChanged: parsedBody.data.quantity,
            lastQuantity: 0,
            newQuantity: parsedBody.data.quantity,
          },
        },
      },
    });

    return c.json(inventory, 201);
  } catch (error) {
    return c.json(
      {
        error: "Failed to create inventory",
        message: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
};
