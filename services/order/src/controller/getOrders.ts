import prisma from "@/prisma_db";
import { Request, Response, NextFunction } from "express";

const getOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const orders = await prisma.order.findMany();
        return res.status(200).json({
            message: 'Fetched Successfully',
            data: orders
        })
    } catch (error) {
        next(error);  
    } 
}

export default getOrders;