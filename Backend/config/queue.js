const amqp = require("amqplib");

let channel;

async function getChannel() {
    if (channel) return channel;

    const conn = await amqp.connect("amqp://localhost:5672");
    channel = await conn.createChannel();
    return channel;
}

module.exports = getChannel;
