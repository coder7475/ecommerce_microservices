import axios from "axios";
import { CartItemSchema, OrderSchema } from "@/schemas";
import { Request, Response, NextFunction } from "express";
import { CART_SERVICE, EMAIL_SERVICE, PRODUCT_SERVICE } from "@/config";
import z from "zod";
import prisma from "@/prisma_db";
import sendToQueue from "@/queue";

const checkout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1) validate request body
    const parsedBody = OrderSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({
        message: "Invalid request body",
        errors: parsedBody.error.issues,
      });
    }

    const { cartSessionId, userId, userName, userEmail } = parsedBody.data;

    // 2) get cart details
    const { data: cartData } = await axios.get(`${CART_SERVICE}/cart/me`, {
      headers: {
        "x-cart-session-id": cartSessionId,
      },
    });

    // depending on your cart service response, adjust here
    // assuming: { message: string, data: [...] }
    const cartItems = z.array(CartItemSchema).safeParse(cartData.data);

    if (!cartItems.success) {
      return res.status(400).json({
        message: "Invalid cart items",
        errors: cartItems.error.issues,
      });
    }

    if (cartItems.data.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // 3) get product details for cart items
    const productDetails = await Promise.all(
      cartItems.data.map(async (item) => {
        const { data: productResp } = await axios.get(
          `${PRODUCT_SERVICE}/products/${item.productId}`
        );

        console.log(productResp);
        // adjust shape; assuming: { message: string, data: {...} }
        const product = productResp.data.product;
        
        const price = Number(product.price);

        if (!Number.isFinite(price)) {
          throw new Error(`Invalid price for product ${product.id}`);
        }

        const total = price * item.quantity;

        if (!Number.isFinite(total)) {
          throw new Error(`Invalid total for product ${product.id}`);
        }

        return {
          productId: String(product.id),
          productName: String(product.name),
          sku: String(product.sku),
          price,
          quantity: item.quantity,
          total,
        };
      })
    );

    // 4) calculate totals
    const subtotal = productDetails.reduce((acc, item) => acc + item.total, 0);
    const tax = subtotal * 0.1;
    const grandTotal = subtotal + tax;

    if (
      !Number.isFinite(subtotal) ||
      !Number.isFinite(tax) ||
      !Number.isFinite(grandTotal)
    ) {
      throw new Error("Invalid monetary calculations (NaN detected)");
    }

    // 5) create order with nested OrderItems
    const order = await prisma.order.create({
      data: {
        userId,
        userName,
        userEmail,
        subtotal,
        tax,
        grandTotal,
        OrderItems: {
          create: productDetails.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            price: item.price,
            quantity: item.quantity,
            total: item.total,
          })),
        },
      },
    });

    // 6) clear cart
    // await axios.get(`${CART_SERVICE}/cart/clear`, {
    //   headers: {
    //     "x-cart-session-id": cartSessionId,
    //   },
    // });

    // 7) send email (no await on purpose, fire-and-forget)
    // axios.post(`${EMAIL_SERVICE}/emails/send`, {
    //   recepient: userEmail,
    //   subject: "Order Confirmation",
    //   body: `Thank you for your order. Your order id is ${order.id}. Your order total is ${order.grandTotal}.`,
    //   source: "Order Microservice - Checkout",
    // });

    // send to queue
    // 6
    sendToQueue('send-email', JSON.stringify(order));
    // 7
    sendToQueue('clear-cart', JSON.stringify({ cartSessionId }));

    return res.status(201).json({
      message: "Order Created",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export default checkout;
