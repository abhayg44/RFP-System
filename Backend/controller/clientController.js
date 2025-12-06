const RFP = require("../models/rfp");
const { publishMessage } = require("../services/queuePublisher");

const createRfp = async (req, res) => {
    try {
        const { natural_text } = req.body;

        await publishMessage("rfp_creation_queue", { text: natural_text });

        res.json({ message: "RFP request sent to AI queue" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const createClientRequest = async (req, res) => {
    try {
        console.log("inside client request controller");
        const requests = req.body;
        if (!requests || (Array.isArray(requests) === false && typeof requests !== 'object')) {
            return res.status(400).json({ error: "Invalid request format" });
        }
        const payload = Array.isArray(requests) ? requests : [requests];
        for (const item of payload) {
            const messageId = item.messageId || `${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
            const message = {
                ...item,
                origin: "client",
                messageId,
                client_email: item.client_email || item.email || null,
                vendor_email: item.vendor_email || item.vendorEmail || null
            };
            await publishMessage("ai_request_queue", message);
        }
        return res.status(201).json({ message: "Client Request(s) queued for AI processing", requests: payload });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

const getAllRfps = async (req, res) => {
    const rfps = await RFP.find();
    res.json(rfps);
};

module.exports = {
    createRfp,
    getAllRfps,
    createClientRequest,
};