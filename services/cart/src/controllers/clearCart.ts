import redisClient from "@/redis_client";
import { Request, Response, NextFunction } from "express";

const clearCart = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const cartSessionId = (req.headers["x-cart-session-id"] as string) || null;

        if (!cartSessionId) {
            return res
                .status(200)
                .json({ message: "Fetched Successfully", data: [] });
        }

        // check if session id exits in store
        const session = await redisClient.exists(`sessions:${cartSessionId}`);

        if (!session) {
            delete req.headers["x-cart-session-id"];
            return res
                .status(200)
                .json({ message: "Session Id has expired", data: [] });
        }

        // clear the cart
        await redisClient.del(`cart:${cartSessionId}`);
        await redisClient.del(`sessions:${cartSessionId}`);
        delete req.headers["x-cart-session-id"];

        return res.status(200).json({
            message: "Cart Cleared",
        });

    } catch (error) {
        next(error);
    }
}

export default clearCart;