import prisma from "@/prisma_db";
import { Request, Response, NextFunction } from "express";

const getProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        inventoryId: true,
      },
    });

    // TODO: Implement Pagination
    // TODO: Implement Filtering
    res.json({ message: "Products fetched Successfully", data: products });
  } catch (error) {
    next(error);
  }
};

export default getProduct;
