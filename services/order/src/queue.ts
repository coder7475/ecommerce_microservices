import amqp from 'amqplib';
import { QUEUE_URL } from './config';

const sendToQueue = async (queueName: string, message: string) => {
    const connection = await amqp.connect(QUEUE_URL);
    const channel = await connection.createChannel();

    const exchange = 'order_exchange';
    await channel.assertExchange(exchange, 'direct', { durable: true });

    channel.publish(exchange, queueName, Buffer.from(message));
    console.log('Message Sent');

    setTimeout(() => {
        connection.close();
    }, 500);
}

export default sendToQueue;

