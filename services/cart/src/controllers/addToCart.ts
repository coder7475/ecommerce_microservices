import { CART_TTL } from "@/config";
import redisClient from "@/redis_client";
import { CartItemSchema } from "@/schema";
import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

const addToCartController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsedBody = CartItemSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({
        error: "Invalid request body",
        details: parsedBody.error.issues,
      });
    }

    // check if cartSession Id is present in the request header and exits in the store
    let cartSessionId = req.headers["x-cart-session-id"] as string | null;

    if (cartSessionId) {
      const existsInStore = await redisClient.exists(
        `sessions:${cartSessionId}`
      );

      if (!existsInStore) {
        cartSessionId = null;
      }
    }

    // if cartSession is not present, create a new one
    if (!cartSessionId) {
      cartSessionId = uuidv4();
      console.log("Created New SessionID: ", cartSessionId);

      // set cart session id in redis
      await redisClient.setex(
        `sessions:${cartSessionId}`,
        CART_TTL,
        JSON.stringify(cartSessionId)
      );

      // set the cart session id in the response header
      res.setHeader("x-cart-session-id", cartSessionId);
    }

    // add item to the cart
    await redisClient.hset(
      `cart:${cartSessionId}`,
      parsedBody.data.productId,
      JSON.stringify({
        inventoryId: parsedBody.data.inventoryId,
        quantity: parsedBody.data.quantity,
      })
    );

    return res.status(201).json({
      message: "Item Added to cart",
      cartSessionId,
    });

    // TODO: check inventory for availability
    // TODO: update the inventory
  } catch (error) {
    next(error);
  }
};

export default addToCartController;
