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
  const lastHistory = await prisma.history.findFirst({
    where: { inventoryId: id },
    orderBy: { createdAt: "desc" },
  });

  // calculate the new inventory
  let newQuantity = inventory.quantity;

  if (parsedBody.data.actionType === ActionType.IN) {
    newQuantity += parsedBody.data.quantity;
  } else if (parsedBody.data.actionType === ActionType.OUT) {
    newQuantity -= parsedBody.data.quantity;
  } else {
    return c.json(
      {
        message: "Invalid Action Type",
      },
      400
    );
  }

  // update the inventory
  const updatedInventory = await prisma.inventory.update({
    where: { id },
    data: {
      quantity: newQuantity,
      Histories: {
        create: {
          actionType: parsedBody.data.actionType,
          quantityChanged: parsedBody.data.quantity,
          lastQuantity: lastHistory?.newQuantity || 0,
          newQuantity,
        },
      },
    },
    select: {
      id: true,
      quantity: true,
    },
  });

  return c.json(updatedInventory, 200);
};

export default updateInventory;
