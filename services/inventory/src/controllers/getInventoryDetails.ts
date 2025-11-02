import { Context } from "hono";
import prisma from "@/prisma_db";

const getInventoryDetailsById = async (c: Context) => {
  const id = c.req.param("id");

  // Fetch inventory and its history
  const inventory = await prisma.inventory.findUnique({
    where: { id },
    include: {
      Histories: {
        orderBy: { createdAt: "desc" }, // latest first
      },
    },
  });

  if (!inventory) {
    return c.json({ message: "Inventory Not Found!" }, 404);
  }

  return c.json(inventory, 200);
};

export default getInventoryDetailsById;
