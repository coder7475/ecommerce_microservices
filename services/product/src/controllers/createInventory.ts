import { InventoryCreateDTOSchema } from "@/schemas";
import { Request, Response } from "express";
import { ActionType } from "@prisma/client";
import prisma from "@/prisma_db";

const createInventory = async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // Parse and validate request body
    const parsedBody = InventoryCreateDTOSchema.safeParse(body);

    if (!parsedBody.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsedBody.error.issues,
      });
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

    return res.status(201).json(inventory);
  } catch (error) {
    console.error("Error creating inventory:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export default createInventory;
