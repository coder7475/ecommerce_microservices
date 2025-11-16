import redisClient from "@/redis_client";
import { Request, Response, NextFunction } from "express";

const getMyCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cartSessionId = (req.headers["x-cart-session-id"] as string) || null;

    if (!cartSessionId) {
      return res
        .status(200)
        .json({ message: "Fetched Successfully", data: [] });
    }

    // check if session id exits in the store
    const session = await redisClient.exists(`sessions:${cartSessionId}`);
    console.log(session);
    if (!session) {
      // change below line logic elsehere
      await redisClient.del(`cart:${cartSessionId}`);
      return res
        .status(200)
        .json({ message: "Session Id has expired", data: [] });
    }

    const items = await redisClient.hgetall(`cart:${cartSessionId}`);

    if (Object.keys(items).length === 0) {
      return res.status(200).json({ data: []})
    }

    // format the items
    const formattedItems = Object.keys(items).map(key => {
      const { quantity, inventoryId } = JSON.parse(items[key]) as {
        inventoryId: string,
        quantity: number
      }

      return {
        inventoryId,
        quantity,
        productId: key
      }
    })
    
    return res.status(200).json({
      message: "Fetched Successfully",
      data: formattedItems,
    });
  } catch (error) {
    next(error);
  }
};

export default getMyCart;
