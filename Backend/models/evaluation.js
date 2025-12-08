const mongoose = require("mongoose");

const evaluationSchema = new mongoose.Schema({
    rfp_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RFP",
        required: true,
        index: true
    },
    client_email: {
        type: String,
        required: true
    },
    evaluation: {
        best_price_top3: [{
            proposal: mongoose.Schema.Types.Mixed,
            reasoning: String,
            scores: mongoose.Schema.Types.Mixed
        }],
        best_warranty_top3: [{
            proposal: mongoose.Schema.Types.Mixed,
            reasoning: String,
            scores: mongoose.Schema.Types.Mixed
        }],
        best_delivery_top3: [{
            proposal: mongoose.Schema.Types.Mixed,
            reasoning: String,
            scores: mongoose.Schema.Types.Mixed
        }],
        best_quantity_top3: [{
            proposal: mongoose.Schema.Types.Mixed,
            reasoning: String,
            scores: mongoose.Schema.Types.Mixed
        }],
        overall_best_top3: [{
            proposal: mongoose.Schema.Types.Mixed,
            reasoning: String,
            scores: mongoose.Schema.Types.Mixed
        }],
        total_proposals_evaluated: Number
    },
    timestamp: {
        type: String  // Original timestamp from evaluation request
    },
    evaluated_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true  // Adds createdAt and updatedAt
});

// Index for faster lookups
evaluationSchema.index({ rfp_id: 1, evaluated_at: -1 });

const Evaluation = mongoose.model("Evaluation", evaluationSchema);

module.exports = Evaluation;
