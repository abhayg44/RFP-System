const getChannel = require("../config/queue");
const Proposal = require("../models/proposal");
const RFP = require("../models/rfp");
const { sendEmailAsync } = require("./emailService");

async function startQueueListener(queueName = "ai_responses_queue") {
    try {
        const channel = await getChannel();

        await channel.assertQueue(queueName, { durable: true });

        console.log(`Listening to queue: ${queueName}`);

        channel.consume(queueName, async (msg) => {
            if (!msg) return;
            try {
                const content = JSON.parse(msg.content.toString());
                console.log("Message received:", content);

                if (!content.origin) throw new Error("AI response missing 'origin' field");

                // idempotency check: if we've already processed this messageId, skip saving but still attempt to send email
                let existing = null;
                if (content.messageId) {
                    if (content.origin === "vendor") {
                        existing = await Proposal.findOne({ messageId: content.messageId });
                    } else if (content.origin === "client") {
                        existing = await RFP.findOne({ messageId: content.messageId });
                    }
                }

                if (content.origin === "vendor") {
                    if (!existing) {
                        const proposal = new Proposal({
                            messageId: content.messageId,
                            rfp_id: content.rfp_id,
                            vendor_id: content.vendor_id,
                            client_email: content.client_email,
                            vendor_email: content.vendor_email,
                            extracted: content.extracted || {},
                            raw_email: content.text || JSON.stringify(content),
                            received_at: new Date()
                        });

                        await proposal.save();
                        console.log("Proposal saved to DB:", proposal._id);
                    } else {
                        console.log("Proposal already exists for messageId", content.messageId);
                    }

                    const emailSubject = content.subject || `New Proposal Received`;
                    const emailBody = content.message_for_client || content.text || JSON.stringify(content);

                    await sendEmailAsync(content.client_email, emailSubject, emailBody);

                    console.log("Email sent to client for vendor-origin message");
                } else if (content.origin === "client") {
                    if (!existing) {
                        const rfp = new RFP({
                            messageId: content.messageId,
                            title: content.title || content.subject || "Client Request",
                            description: content.description || content.text || "",
                            budget: content.budget,
                            vendor_email: content.vendor_email,
                            items: content.items || [],
                            delivery_time: content.delivery_time,
                            payment_terms: content.payment_terms,
                            warranty: content.warranty,
                            created_at: new Date()
                        });

                        await rfp.save();
                        console.log("RFP saved to DB:", rfp._id);
                    } else {
                        console.log("RFP already exists for messageId", content.messageId);
                    }

                    const emailSubject = content.subject || `New RFP Received`;
                    const emailBody = content.message_for_vendor || content.text || JSON.stringify(content);

                    await sendEmailAsync(content.vendor_email, emailSubject, emailBody);

                    console.log("Email sent to vendor for client-origin message");
                } else {
                    throw new Error(`Unknown origin: ${content.origin}`);
                }

                channel.ack(msg);
            } catch (err) {
                console.error("Error processing message:", err.message || err);
                try {
                    channel.nack(msg, false, true);
                } catch (e) {
                    console.error("Failed to nack message:", e.message || e);
                }
            }
        });
    } catch (err) {
        console.error("Queue listener error:", err);
        setTimeout(() => startQueueListener(queueName), 5000);
    }
}

module.exports = { startQueueListener };
