"""
RabbitMQ Proposal Evaluator Consumer: 
- Consumes from proposals_evaluation_queue
- Groups proposals by RFP ID
- Evaluates best proposal using AI
- Publishes result to evaluation_results_queue
"""
import pika
import json
import os
from dotenv import load_dotenv
from collections import defaultdict
from queue_publisher import publish_to_queue
from ai_service import evaluate_proposals

load_dotenv()

RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "localhost")
RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", 5672))
RABBITMQ_USER = os.getenv("RABBITMQ_USER", "guest")
RABBITMQ_PASS = os.getenv("RABBITMQ_PASS", "guest")

INPUT_QUEUE = "proposals_evaluation_queue"
OUTPUT_QUEUE = "evaluation_results_queue"

# Store proposals temporarily (in production, use Redis or DB)
proposals_by_rfp = defaultdict(list)


def process_evaluation_message(channel, method, properties, body):
    """
    Process proposal evaluation request.
    
    Expected message format:
    {
        "rfp_id": "...",
        "proposals": [{...}, {...}],
        "client_email": "...",
        "trigger": "manual" or "auto"
    }
    """
    try:
        message = json.loads(body)
        rfp_id = message.get("rfp_id")
        proposals = message.get("proposals", [])
        client_email = message.get("client_email")
        
        print(f"\n{'='*60}")
        print(f"📊 Evaluating proposals for RFP: {rfp_id}")
        print(f"   Total proposals: {len(proposals)}")
        print(f"   Client: {client_email}")
        print(f"{'='*60}")
        
        if len(proposals) == 0:
            print("⚠️ No proposals to evaluate")
            channel.basic_ack(method.delivery_tag)
            return
        
        # Evaluate using AI service
        print("\n   🤖 Running AI evaluation...")
        try:
            evaluation_result = evaluate_proposals(proposals)
        except Exception as e:
            print(f"✗ Evaluation failed: {e}")
            import traceback
            traceback.print_exc()
            
            # Fallback with top 3 structure - safe price handling
            def get_price(proposal):
                extracted = proposal.get('extracted', {})
                total = extracted.get('total_price')
                if total is not None:
                    try:
                        return float(total)
                    except (ValueError, TypeError):
                        pass
                ppp = extracted.get('price_per_piece')
                if ppp is not None:
                    try:
                        return float(ppp)
                    except (ValueError, TypeError):
                        pass
                return float('inf')
            
            sorted_by_price = sorted(proposals, key=get_price)[:min(3, len(proposals))]
            
            def create_fallback_top3(count=3):
                result = []
                for i in range(min(count, len(proposals))):
                    result.append({
                        "proposal": proposals[i],
                        "reasoning": f"Rank {i+1} (fallback - AI evaluation failed)",
                        "scores": {}
                    })
                return result
            
            evaluation_result = {
                "best_price_top3": [{"proposal": p, "reasoning": f"Rank {i+1} by price (fallback)", "scores": {}} for i, p in enumerate(sorted_by_price)],
                "best_warranty_top3": create_fallback_top3(),
                "best_delivery_top3": create_fallback_top3(),
                "best_quantity_top3": create_fallback_top3(),
                "overall_best_top3": [{"proposal": p, "reasoning": f"Rank {i+1} by price (fallback)", "scores": {}} for i, p in enumerate(sorted_by_price)],
                "total_proposals_evaluated": len(proposals)
            }
        
        print(f"   ✓ Evaluation complete (Top 3 per category):")
        
        # Print top 3 for each category with reasoning
        def print_top3(category_name, top3_list):
            print(f"\n      {category_name}:")
            for i, item in enumerate(top3_list[:3], 1):
                proposal = item.get('proposal', {})
                vendor = proposal.get('vendor_email', 'N/A')
                vendor_id = proposal.get('vendor_id', 'N/A')
                reasoning = item.get('reasoning', 'No reasoning provided')
                scores = item.get('scores', {})
                
                print(f"         {i}. Vendor: {vendor}")
                print(f"            Vendor ID: {vendor_id}")
                print(f"            Reasoning: {reasoning}")
                if scores:
                    print(f"            Scores: {scores}")
        
        print_top3("Best Price", evaluation_result.get('best_price_top3', []))
        print_top3("Best Warranty", evaluation_result.get('best_warranty_top3', []))
        print_top3("Best Delivery", evaluation_result.get('best_delivery_top3', []))
        print_top3("Best Quantity", evaluation_result.get('best_quantity_top3', []))
        print_top3("Overall Best", evaluation_result.get('overall_best_top3', []))
        
        # Prepare output message
        output = {
            "rfp_id": rfp_id,
            "client_email": client_email,
            "evaluation": evaluation_result,
            "timestamp": message.get("timestamp"),
            "evaluated_at": json.dumps({"$date": {"$numberLong": str(int(os.times()[4] * 1000))}})
        }
        
        # Publish to results queue
        print(f"\n   📤 Publishing evaluation result to {OUTPUT_QUEUE}...")
        success = publish_to_queue(OUTPUT_QUEUE, output)
        
        if success:
            print(f"✓ Evaluation completed and published")
            channel.basic_ack(method.delivery_tag)
        else:
            print(f"✗ Failed to publish evaluation result")
            channel.basic_nack(method.delivery_tag, False, True)
            
    except Exception as e:
        print(f"✗ Error processing evaluation: {e}")
        channel.basic_nack(method.delivery_tag, False, False)


def main():
    """Start the proposal evaluator consumer"""
    try:
        # Connect to RabbitMQ
        credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(
                host=RABBITMQ_HOST,
                port=RABBITMQ_PORT,
                credentials=credentials
            )
        )
        channel = connection.channel()
        
        # Declare queues
        channel.queue_declare(queue=INPUT_QUEUE, durable=True)
        channel.queue_declare(queue=OUTPUT_QUEUE, durable=True)
        
        # Set prefetch to process one message at a time
        channel.basic_qos(prefetch_count=1)
        
        # Start consuming
        channel.basic_consume(
            queue=INPUT_QUEUE,
            on_message_callback=process_evaluation_message
        )
        
        print(f"\n{'='*60}")
        print(f"🚀 Proposal Evaluator Consumer Started")
        print(f"   Input Queue: {INPUT_QUEUE}")
        print(f"   Output Queue: {OUTPUT_QUEUE}")
        print(f"   RabbitMQ: {RABBITMQ_HOST}:{RABBITMQ_PORT}")
        print(f"{'='*60}\n")
        print("⏳ Waiting for evaluation requests...")
        
        channel.start_consuming()
        
    except KeyboardInterrupt:
        print("\n\n⏹️ Consumer stopped by user")
        connection.close()
    except Exception as e:
        print(f"\n✗ Consumer error: {e}")
        raise


if __name__ == "__main__":
    main()
