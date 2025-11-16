import { Request, Response, NextFunction } from "express";
import axios from "axios";
import prisma from "@/prisma_db";
import { ProductUpdateDTOSchema } from "@/schemas";
import { INVENTORY_URL } from "@/config";

const updateProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsedBody = ProductUpdateDTOSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsedBody.error.issues
      });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: req.params.id }
    });

    if (!existingProduct) {
      return res.status(404).json({
        error: "Product with the given id does not exist"
      });
    }

    const updatedProduct = await prisma.product.update({
      where: { id: existingProduct.id },
      data: parsedBody.data
    });

    return res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct
    });
  } catch (error) {
    return next(error);
  }
};

export default updateProduct;
