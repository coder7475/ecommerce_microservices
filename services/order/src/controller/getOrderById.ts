import prisma from "@/prisma_db";
import { Request, Response, NextFunction } from "express";

const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const order = await prisma.order.findUnique({
            where: {
                id: req.params.id
            },
            include: {
                OrderItems: true
            }
        });

        if (!order) return res.status(404).json({ message: 'Order not found'});

        return res.status(200).json({
            message: 'Fetched Successfully',
            data: order
        })
    } catch (error) {
        next(error);  
    } 
}

export default getOrderById;