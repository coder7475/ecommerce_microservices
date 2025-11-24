import amqlib from 'amqplib';
import { DEFAULT_SENDER_MAIL, QUEUE_URL, transporter } from './config';
import prisma from './prisma_db';

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

receiveFromQueue('send-email', async (msg) => {
    console.log(`Received message: ${msg}`);

    const parsedBody = JSON.parse(msg);
    const { userEmail, grandTotal, id } = parsedBody;
    const from = DEFAULT_SENDER_MAIL;
    const subject = 'Order Confirmation';
    const body = `Thank you for your order. Your order id is ${id}. Your order total is $${grandTotal}`;

    const emailOptions = {
        from,
        to: userEmail,
        subject,
        text: body
    }

    // send the email
    const { rejected } = await transporter.sendMail(emailOptions);
    if (rejected.length) {
        console.log("Email Rejected: ", rejected);
        return;
    }

    await prisma.email.create({
        data: {
            sender: from,
            recipient: userEmail,
            subject,
            body,
            source: 'Order Confirmation'
        }
    })

    console.log("Email Sent");
})