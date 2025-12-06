const mongoose = require("mongoose");

const ProposalSchema = new mongoose.Schema({
    rfp_id: { type: mongoose.Schema.Types.ObjectId, ref: "RFP" },
    vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor" },
    origin: { type: String, enum: ["client", "vendor"], required: true },
    messageId: { type: String, index: { unique: true, sparse: true } },
    client_email: { type: String, required: true },
    vendor_email: { type: String, required: true },
    subject: { type: String, default: "New Proposal Received" },
    message_for_client: { type: String },
    extracted: {
        price: Number,
        quantity: Number,
        terms: String,
        warranty: String,
        delivery_time: String
    },
    raw_email: String,
    received_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Proposal", ProposalSchema);
