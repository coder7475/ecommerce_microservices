import { InventoryUpdateDTOSchema } from "@/schemas";
import { Context } from "hono";
import { ActionType } from "../../generated/prisma";
import prisma from "@/prisma_db";

const updateInventory = async (c: Context) => {
  // check if inventory exits
  const id = c.req.param("id");
  const inventory = await prisma.inventory.findUnique({
    where: { id },
  });

  if (!inventory) {
    return c.json({ message: "Inventory Not Found!" }, 404);
  }

  // Parse and validate request body
  const body = await c.req.json();
  const parsedBody = InventoryUpdateDTOSchema.safeParse(body);

  if (!parsedBody.success) {
    return c.json(
      {
        error: "Validation failed",
        details: parsedBody.error.issues,
      },
      400
    );
  }

  // find last history

  return c.json(inventory, 201);
};

export default updateInventory;
