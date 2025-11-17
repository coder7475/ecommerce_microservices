import { REDIS_HOST, REDIS_PORT } from '@/config';
import { clearCart } from '@/services';
import { Redis } from 'ioredis';
import { ca } from 'zod/v4/locales';

// Create Redis client instance
const redis = new Redis({
    host: REDIS_HOST,
    port: Number(REDIS_PORT)
});

// Redis key expiration event channel
// Reference: Redis Keyspace Notifications https://redis.io/docs/latest/develop/reference/notifications/
const CHANNEL_KEY = '__keyevent@0__:expired';

async function setup() {
    // Enable key expiration events
    await redis.config('SET', 'notify-keyspace-events', 'Ex');

    // Subscribe to expiration channel
    await redis.subscribe(CHANNEL_KEY);

    redis.on('message', async (channel, message) => {
        if (channel === CHANNEL_KEY) {
            console.log("Key expired: ", message);
            
            const cartKey = message.split(':').pop();
            
            if (!cartKey) return;
            
            clearCart(cartKey);

            console.log("Cart deleted: ", cartKey);
        }
    })
}

setup().catch(console.error);
