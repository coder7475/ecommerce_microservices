import amqlib from 'amqplib';
import { QUEUE_URL } from './config';

const receiveFromQueue = async (queueName: string, callback: (message: string) => void) => {
    const connection = await amqlib.connect(QUEUE_URL);
    const channel = await connection.createChannel();

    
    const exchange = 'order_exchange';
    await channel.assertExchange(exchange, 'direct', { durable: true });

    const q = await channel.assertQueue(queueName, { durable: true });

    await channel.bindQueue(q.queue, exchange, queueName);

    channel.consume(q.queue, msg => {
        if (msg) {
            callback(msg.content.toString());
        }
    }, { noAck: true })

}

receiveFromQueue('clear-cart', msg => {
    console.log(`Received message: ${msg}`);
})