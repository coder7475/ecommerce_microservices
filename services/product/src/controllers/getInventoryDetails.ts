import { Request, Response } from "express";
import prisma from "@/prisma_db";

const getInventoryDetailsById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

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
      return res.status(404).json({ message: "Inventory Not Found!" });
    }

    return res.status(200).json(inventory);
  } catch (error) {
    console.error("Error fetching inventory details:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export default getInventoryDetailsById;
