import axios from 'axios';
import { CartItemSchema, OrderSchema } from "@/schemas";
import { Request, Response, NextFunction } from "express";
import { CART_SERVICE, EMAIL_SERVICE, PRODUCT_SERVICE } from '@/config';
import z from 'zod';
import prisma from '@/prisma_db';

const checkout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // validate request
        const parsedBody = OrderSchema.safeParse(req.body);

        if (!parsedBody.success) {
            return res.status(400).json({
                message: "Invalid request body",
                errors: parsedBody.error.issues
            })
        }

        // get cart details
        const { data: cartData } = await axios.get(`${CART_SERVICE}/cart/me`, {
            headers: {
              'x-cart-session-id': parsedBody.data.cartSessionId,
            }
        })

        console.log("CartData(checkout): ", cartData);
        const cartItems = z.array(CartItemSchema).safeParse(cartData.data);
        
        if (!cartItems.success) {
            return res.status(400).json({
                errors: cartItems.error.issues
            })
        }

        if (cartItems.data.length === 0) {
            return res.status(400).json({ message: 'Cart is empty'})
        }

        // get product details for cart items
        const productDetails = await Promise.all(
            cartItems.data.map(async (item) => {
                const { data: product } = await axios.get(`${PRODUCT_SERVICE}/products/${item.productId}`);
                return {
                    productId: product.id as string,
                    productName: product.name as string,
                    sku: product.sku as string,
                    price: product.price as number,
                    quantity: item.quantity,
                    total: product.price * item.quantity
                }
            })
        )

        const subtotal = productDetails.reduce((acc, item) => acc + item.total, 0);
        const tax = subtotal * 0.1;
        const grandTotal = subtotal + tax;

        // create order
        const order = await prisma.order.create({
            data: {
                userId: parsedBody.data.userId,
                userName: parsedBody.data.userName,
                userEmail: parsedBody.data.userEmail,
                subtotal,
                tax,
                grandTotal,
                OrderItems: {
                    create: productDetails.map(item => ({
                        ...item
                    }))
                }
            }
        })

        // clear cart
        await axios.get(`${CART_SERVICE}/cart/clear`, {
            headers: {
                'x-cart-session-id': parsedBody.data.cartSessionId
            }
        })

        // send email
        axios.post(`${EMAIL_SERVICE}/emails/send`, {
            recepient: parsedBody.data.userEmail,
            subject: 'Order Confirmation',
            body: `Thank you for your order. Your order is ${order.id}. Your order total is ${order.grandTotal}.`,
            source: `Order Microservice - Checkout`
        })

        return res.status(201).json({
            message: 'Order Created',
            data: order
        })
   
    } catch (error) {
        next(error);
    }
}

export default checkout;