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
                        const extracted = Object.assign({}, content.extracted || {});
                        function parseNumber(v) {
                            if (v === undefined || v === null) return None;
                            if (typeof v === 'number') return v;
                            if (typeof v === 'string') {
                                const clean = v.replace(/[$,]/g, '').trim();
                                const n = Number(clean);
                                return isNaN(n) ? None : n;
                            }
                            return None;
                        }

                        extracted.price_per_piece = parseNumber(extracted.price_per_piece);
                        extracted.total_price = parseNumber(extracted.total_price);
                        extracted.price = parseNumber(extracted.price);
                        extracted.quantity = extracted.quantity !== undefined && extracted.quantity !== null ? Number(extracted.quantity) : null;

                        function validateObjectId(id, fieldName) {
                            if (!id) return null;
                            const idStr = String(id).trim();
                            if (/^[0-9a-fA-F]{24}$/.test(idStr)) {
                                return idStr;
                            }
                            throw new Error(`Invalid ObjectId format for ${fieldName}: "${idStr}" (length: ${idStr.length}, expected: 24 hex characters)`);
                        }

                        const proposal = new Proposal({
                            origin: "vendor",
                            messageId: content.messageId,
                            rfp_id: validateObjectId(content.rfp_id, 'rfp_id'),
                            vendor_id: validateObjectId(content.vendor_id, 'vendor_id'),
                            client_email: content.client_email || null,
                            vendor_email: content.vendor_email || null,
                            extracted: extracted,
                            raw_email: content.text || JSON.stringify(content),
                            message_for_client: content.message_for_client,
                            subject: content.subject || "New Proposal Received",
                            received_at: new Date()
                        });

                        try {
                            await proposal.save();
                            console.log("Proposal saved to DB:", proposal._id);
                        } catch (saveErr) {
                            console.error("Failed to save proposal. Validation error:", saveErr && saveErr.message ? saveErr.message : saveErr);
                            console.error("Proposal content:", JSON.stringify(content));
                        }
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
                            origin: "client",  
                            messageId: content.messageId,
                            client_email: content.client_email, 
                            vendor_email: content.vendor_email,  
                            title: content.title || content.subject || "Client Request",
                            description: content.description || content.text || "",
                            budget: content.budget,
                            items: content.items || [],
                            delivery_time: content.delivery_time,
                            payment_terms: content.payment_terms,
                            warranty: content.warranty,
                            subject: content.subject || "New RFP Received",
                            message_for_vendor: content.message_for_vendor,
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
                    channel.ack(msg);
                    console.log("Message acknowledged despite error. Check logs.");
                } catch (e) {
                    console.error("Failed to ack message:", e.message || e);
                }
            }
        });
    } catch (err) {
        console.error("Queue listener error:", err);
        setTimeout(() => startQueueListener(queueName), 5000);
    }
}

module.exports = { startQueueListener };
