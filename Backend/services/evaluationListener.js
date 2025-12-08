const getChannel = require("../config/queue");
const Evaluation = require("../models/evaluation");

const EVALUATION_QUEUE = "evaluation_results_queue";

async function startEvaluationListener() {
    try {
        const channel = await getChannel();
        await channel.assertQueue(EVALUATION_QUEUE, { durable: true });        
        channel.prefetch(1);
        console.log("Evaluation Results Listener Started------------------------------------");
        
        channel.consume(EVALUATION_QUEUE, async (msg) => {
            if (msg) {
                try {
                    const content = msg.content.toString();
                    console.log("Received Result-----------------------------------");
                    
                    const data = JSON.parse(content);
                    
                    console.log("RFP ID:", data.rfp_id);
                    console.log("Client Email:", data.client_email);
                    console.log("Timestamp:", data.timestamp);
                    
                    await saveEvaluationResult(data);
                    
                    channel.ack(msg);                    
                } catch (error) {
                    console.error("Error processing evaluation result:", error);
                    channel.nack(msg, false, false);
                }
            }
        });
        
    } catch (error) {
        console.error("Failed to start evaluation listener:", error);
        throw error;
    }
}

async function saveEvaluationResult(data) {
    try {
        const { rfp_id, client_email, evaluation, timestamp, evaluated_at } = data;
        
        console.log("Saving to db-----------------------------------------------------");
        console.log("Total proposals evaluated:", evaluation.total_proposals_evaluated);
        
        const categories = [
            'best_price_top3',
            'best_warranty_top3', 
            'best_delivery_top3',
            'best_quantity_top3',
            'overall_best_top3'
        ];
        
        console.log("Rankings Summary:");
        categories.forEach(category => {
            const top3 = evaluation[category] || [];
            const categoryName = category.replace('_top3', '').replace(/_/g, ' ').toUpperCase();
            console.log(`${categoryName}:`);
            top3.slice(0, 3).forEach((item, index) => {
                const vendor = item.proposal?.vendor_email || 'N/A';
                const reasoning = item.reasoning || 'N/A';
                console.log(`${index + 1}. ${vendor}`);
                console.log(`Reasoning: ${reasoning}`);
            });
        });
        
        const existingEvaluation = await Evaluation.findOne({ rfp_id });
        
        if (existingEvaluation) {
            console.log("Evaluation already exists for RFP:", rfp_id);
            console.log("Updating existing evaluation-----------------------------------");
            existingEvaluation.evaluation = evaluation;
            existingEvaluation.evaluated_at = new Date();
            existingEvaluation.timestamp = timestamp;
            await existingEvaluation.save();
            console.log("\nEvaluation updated successfully");
        } else {
            console.log("\nCreating new evaluation record...");
            
            const newEvaluation = new Evaluation({
                rfp_id,
                client_email,
                evaluation,
                timestamp,
                evaluated_at: new Date()
            });
            
            await newEvaluation.save();
            console.log("\nNew evaluation saved successfully");
        }
        
        console.log("\nEvaluation ID:", existingEvaluation?._id || newEvaluation._id);
        
    } catch (error) {
        console.error("\nFailed to save evaluation:", error);
        throw error;
    }
}

module.exports = { startEvaluationListener };
