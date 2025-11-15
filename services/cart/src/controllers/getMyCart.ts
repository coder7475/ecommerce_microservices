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

    const cart = await redisClient.hgetall(`cart:${cartSessionId}`);

    return res.status(200).json({
      message: "Fetched Successfully",
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export default getMyCart;
