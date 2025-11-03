import { Request, Response, NextFunction } from "express";
import axios from "axios";
import prisma from "@/prisma_db";
import { ProductCreateDTOSchema } from "@/schemas";
import { INVENTORY_URL } from "@/config";
import { de } from "zod/v4/locales";

const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsedBody = ProductCreateDTOSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsedBody.error.issues,
      });
    }

    // check if the product with the same sku already exists
    const existingProduct = await prisma.product.findUnique({
      where: { sku: parsedBody.data.sku },
    });

    if (existingProduct) {
      return res.status(409).json({
        error: "Product with the same SKU already exists",
      });
    }

    // Create product
    const product = await prisma.product.create({
      data: parsedBody.data,
    });
    console.log("Product created Successfully!");

    // create inventory for the product by calling inventory service
    let inventory;
    try {
      const { data } = await axios.post(`${INVENTORY_URL}/inventory`, {
        productId: product.id,
        sku: parsedBody.data.sku,
      });
      inventory = data;
      console.log("Inventory created Successfully!");
    } catch (error) {
      console.error("Error creating inventory:", error);
    }

    // update the product and store inventoryId
    await prisma.product.update({
      where: { id: product.id },
      data: {
        inventoryId: inventory.id,
      },
    });

    console.log(
      "Product updated Successfully with inventory_id: ",
      inventory.id
    );

    res.status(201).json({
      message: "Product created successfully",
      product: {
        ...product,
        inventoryId: inventory.id,
      },
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export default createProduct;
