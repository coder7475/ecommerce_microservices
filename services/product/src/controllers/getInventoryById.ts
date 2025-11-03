import { Request, Response } from "express";
import prisma from "@/prisma_db";

const getInventoryById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    // Fetch inventory
    const inventory = await prisma.inventory.findUnique({
      where: { id },
      select: {
        quantity: true,
      },
    });

    if (!inventory) {
      return res.status(404).json({ message: "Inventory Not Found!" });
    }

    return res.status(200).json(inventory);
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export default getInventoryById;
