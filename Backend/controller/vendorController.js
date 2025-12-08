const Proposal = require("../models/proposal");
const Vendor = require("../models/vendor");
const Evaluation = require("../models/evaluation");
const { publishMessage } = require("../services/queuePublisher");
const rfp = require("../models/rfp");

function generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

exports.getVendorProposals = async (req, res) => {
    try {
        const { rfpId } = req.params;
        console.log("Getting vendor prosposals for RFP ID:---------------------------------", rfpId);        
        const proposals = await Proposal.find({ rfp_id: rfpId }).sort({ received_at: -1 });
        console.log("Found proposals:", proposals.length);
        return res.status(200).json(proposals);
    } catch (err) {
        console.error("Error fetching vendor proposals:", err);
        return res.status(500).json({ error: "Failed to fetch proposals" });
    }
};

exports.triggerEvaluation = async (req, res) => {
    try {
        const { rfpId } = req.params;
        console.log("AI evaluation triggered for RFP ID:----------------------------------",rfpId);
        const proposals = await Proposal.find({ rfp_id: rfpId });
        if (!proposals || proposals.length === 0) {
            return res.status(404).json({ error: "No proposals found for this RFP" });
        }   
        console.log("Found", proposals.length, "proposals to evaluate");
        await aiEvaluationHandler(proposals);
        return res.status(202).json({ 
            message: "Evaluation triggered successfully",
            proposals_count: proposals.length 
        });
    } catch (err) {
        console.error("Error triggering evaluation:", err);
        return res.status(500).json({ error: err.message });
    }
};

exports.getEvaluationResults = async (req, res) => {
    try {
        const { rfpId } = req.params;
        console.log("Getting evaluation results for RFP ID:----------------------------", rfpId);
        
        const evaluation = await Evaluation.findOne({ rfp_id: rfpId })
            .sort({ evaluated_at: -1 });
        
        if (!evaluation) {
            console.log("No evaluation found");
            return res.status(404).json({ 
                evaluated: false,
                message: "Evaluation not available yet" 
            });
        }
        console.log("Evaluation found ",evaluation._id);
        
        return res.status(200).json({
            evaluated: true,
            evaluation: evaluation.evaluation,
            evaluated_at: evaluation.evaluated_at
        });
    } catch (err) {
        console.error("Error fetching evaluation:", err);
        return res.status(500).json({ error: err.message });
    }
};

const aiEvaluationHandler = async (proposals) => {
    console.log("Publishing to evaluation queue------------------------------------------");
    console.log("Proposals count:", proposals.length);
    
    const rfp_id = proposals[0].rfp_id;
    const client_email = proposals[0].client_email;
    
    const cleanedProposals = proposals.map(p => ({
        _id: p._id,
        vendor_id: p.vendor_id,
        vendor_email: p.vendor_email,
        extracted: p.extracted,
        received_at: p.received_at
    }));
    
    const message = {
        rfp_id: rfp_id,
        proposals: cleanedProposals,
        client_email: client_email,
        trigger: "manual",
        timestamp: new Date().toISOString()
    };
    
    await publishMessage("proposals_evaluation_queue", message);
    console.log("Evaluation request published");
};

exports.createVendorRequest = async (req, res) => {
    try {
        const requests = req.body;
        const payload = Array.isArray(requests) ? requests : [requests];

        for (const item of payload) {
            const message = {
                origin: "vendor",  
                messageId: generateMessageId(),
                text: item.text,  
                client_email: item.client_email,
                vendor_email: item.vendor_email,
                rfp_id: item.rfp_id,
                vendor_id: item.vendor_id
            };
            await publishMessage("ai_request_queue", message);
        }

        return res.status(201).json({ message: "Request queued for AI processing" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
