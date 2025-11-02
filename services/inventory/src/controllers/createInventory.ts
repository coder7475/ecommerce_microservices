import { InventoryCreateDTOSchema } from "@/schemas";
import { Context } from "hono";
import { ActionType } from "../../generated/prisma";

// Context type matching the Hono app configuration
type CreateInventoryContext = Context<{
  Variables: {
    prisma: import("../../generated/prisma/client").PrismaClient;
  };
}>;

const createInventory = async (c: CreateInventoryContext) => {
  // Get Prisma client from context (set by middleware)
  const prisma = c.get("prisma");
  console.log("Inside the create, the body get", c.body);

  const body = await c.req.json();

  // Parse and validate request body
  const parsedBody = InventoryCreateDTOSchema.safeParse(body);

  if (!parsedBody.success) {
    return c.json(
      {
        error: "Validation failed",
        details: parsedBody.error.issues,
      },
      400
    );
  }

  // Create inventory
  const inventory = await prisma.inventory.create({
    data: {
      ...parsedBody.data,
      Histories: {
        create: {
          actionType: ActionType.INIT,
          quantityChanged: parsedBody.data.quantity,
          lastQuantity: 0,
          newQuantity: parsedBody.data.quantity,
        },
      },
    },
    select: {
      id: true,
      quantity: true,
    },
  });

  return c.json(inventory, 201);
};

export default createInventory;
