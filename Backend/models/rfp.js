const mongoose = require("mongoose");

const RfpSchema = new mongoose.Schema({
    rfp_id: { type: mongoose.Schema.Types.ObjectId, ref: "RFP" },
    origin: { type: String, enum: ["client", "vendor"], required: true },
    messageId: { type: String, index: { unique: true, sparse: true } },
    client_email: { type: String, required: true },
    vendor_email: { type: String, required: true },
    subject: { type: String, default: "New RFP Received" },
    message_for_vendor: { type: String },
    title: String,
    description: String,
    budget: Number,
    items: [
        {   
            name: String,
            quantity: Number,
            specs: String
        }
    ],
    delivery_time: String,
    payment_terms: String,
    warranty: String,
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("RFP", RfpSchema);
