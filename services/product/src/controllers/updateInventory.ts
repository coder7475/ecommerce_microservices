import { InventoryUpdateDTOSchema } from "@/schemas";
import { Request, Response } from "express";
import { ActionType } from "@prisma/client";
import prisma from "@/prisma_db";

const updateInventory = async (req: Request, res: Response) => {
  try {
    // check if inventory exists
    const id = req.params.id;
    const inventory = await prisma.inventory.findUnique({
      where: { id },
    });

    if (!inventory) {
      return res.status(404).json({ message: "Inventory Not Found!" });
    }

    // Parse and validate request body
    const body = req.body;
    const parsedBody = InventoryUpdateDTOSchema.safeParse(body);

    if (!parsedBody.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsedBody.error.issues,
      });
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
      return res.status(400).json({
        message: "Invalid Action Type",
      });
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

    return res.status(200).json(updatedInventory);
  } catch (error) {
    console.error("Error updating inventory:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export default updateInventory;
