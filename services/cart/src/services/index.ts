import { INVENTORY_SERVICE } from "@/config";
import redisClient from "@/redis_client";
import axios from "axios";

export const clearCart = async (id: string) => {
    try {
        const data = await redisClient.hgetall(`cart:${id}`);

        if (Object.keys(data).length === 0) {
            return;
        }

        const items = Object.keys(data).map(key => {
            const { inventoryId, quantity } = JSON.parse(data[key]) as {
                inventoryId: string,
                quantity: number
            }

            return {
                inventoryId,
                quantity,
                productId: key
            };

        })

        const requests = items.map(item => {
            return axios.put(`${INVENTORY_SERVICE}/inventory/${item.inventoryId}`, {
                quantity: item.quantity,
                actionType: 'IN'
            })
        })

        Promise.all(requests)
        console.log("Inventory Updated");

        await redisClient.del(`cart:${id}`);
        console.log("Cart Cleared");

    } catch(error) {
        console.log(error);
    }
}