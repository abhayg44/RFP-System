const getChannel = require("../config/queue");

const publishMessage = async (queueName, data) => {
    try {
        const channel = await getChannel();
        await channel.assertQueue(queueName, { durable: true });
        channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), { persistent: true });
        console.log(`Message sent to queue: ${queueName}`);
        console.log(`Data sent: ${JSON.stringify(data)}`);
    } catch (err) {
        console.error("Queue publish error:", err);
    }
};

module.exports = { publishMessage };