import prisma from "@/prisma_db";
import { Request, Response, NextFunction } from "express";
import axios from "axios";
import { INVENTORY_URL } from "@/config";

const getProductDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (product.inventoryId === null) {
      try {
        // create inventory for the product by calling inventory service
        const { data: inventory } = await axios.post(
          `${INVENTORY_URL}/inventory`,
          {
            productId: product.id,
            sku: product.sku,
          }
        );
        console.log("Inventory created Successfully!", inventory.id);
        // update the product and store inventoryId
        await prisma.product.update({
          where: { id: product.id },
          data: {
            inventoryId: inventory.id,
          },
        });
        product.inventoryId = inventory.id;
        console.log(
          "Product updated Successfully with inventory id: ",
          product.inventoryId
        );

        res.json({
          message: "Product details fetched successfully",
          data: {
            product,
            inventoryId: product.inventoryId,
            stock: inventory.quantity,
            stockStatus: inventory.quantity > 0 ? "In Stock" : "Out of Stock",
          },
        });
        return;
      } catch (error) {
        console.error("Error Creating  inventory:", error);
      }
    }

    // fetch inventory
    const { data: inventory } = await axios.get(
      `${INVENTORY_URL}/inventory/${product.inventoryId}`
    );

    res.json({
      message: "Product details fetched successfully",
      data: {
        product,
        inventoryId: product.inventoryId,
        stock: inventory.quantity,
        stockStatus: inventory.quantity > 0 ? "In Stock" : "Out of Stock",
      },
    });
  } catch (error) {
    next(error);
  }
};

export default getProductDetails;
