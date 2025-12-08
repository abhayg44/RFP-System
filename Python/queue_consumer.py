import pika
import json
import os
import uuid
from dotenv import load_dotenv
from ai_service import (
    process_client_request,
    process_vendor_proposal,
    generate_vendor_message,
    generate_client_message
)
from queue_publisher import publish_to_queue
from models import Item, ExtractedData

load_dotenv()

RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "localhost")
RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", 5672))
RABBITMQ_USER = os.getenv("RABBITMQ_USER", "guest")
RABBITMQ_PASS = os.getenv("RABBITMQ_PASS", "guest")

INPUT_QUEUE = "ai_request_queue"
OUTPUT_QUEUE = "ai_responses_queue"


def process_message(channel, method, properties, body):
    """
    format:
    {
        "origin": "client" or "vendor",
        "text": "unstructured text",
        "client_email": "...",
        "vendor_email": "...",
        "messageId": "...",
        "rfp_id": "...",  (optional for vendor)
        "vendor_id": "..."  (optional for vendor)
    }
    """
    try:
        message = json.loads(body)
        origin = message.get("origin")
        
        print(f"Processing message from {INPUT_QUEUE}")
        print(f"Origin: {origin}")
        print(f"MessageID: {message.get('messageId')}")
        
        if origin == "client":
            process_client_message(channel, message)
        elif origin == "vendor":
            process_vendor_message(channel, message)
        else:
            print(f"Unknown origin: {origin}")
            channel.basic_nack(method.delivery_tag, False, False)
            return
        
        channel.basic_ack(method.delivery_tag)
        print(f"Message acknowledged")
        
    except Exception as e:
        print(f"Error processing message: {e}")
        try:
            print("Message body causing error:", body[:1000])
        except Exception:
            pass
        channel.basic_nack(method.delivery_tag, False, False)


def process_client_message(channel, message: dict):
    try:
        message_id = message.get("messageId") or str(uuid.uuid4())
        client_email = message.get("client_email")
        vendor_email = message.get("vendor_email")
        text = message.get("text")
        
        print(f"Client Email: {client_email}")
        print(f"Vendor Email: {vendor_email}")
        print(f"Text preview: {text[:100]}...")
        
        print("\nCalling Ollama AI for data extraction...")
        try:
            structured_data = process_client_request(text)
            print(f"AI extraction successful")
            print(f"Extracted type: {type(structured_data)}")
            print(f"Extracted: {json.dumps(structured_data, indent=2)[:300]}...")
        except Exception as e:
            print(f"AI extraction failed: {e}")
            raise
        
        if isinstance(structured_data, list):
            print(f"AI returned list instead of dict; wrapping items...")
            structured_data = {"items": structured_data}
        
        items = []
        for item in structured_data.get("items", []):
            if isinstance(item, dict):
                items.append(Item(
                    name=item.get("name"),
                    quantity=item.get("quantity"),
                    specs=item.get("specs")
                ))
            else:
                print(f"Skipping non-dict item: {item}")
        
        message_for_vendor = generate_vendor_message(structured_data)
        
        response = {
            "origin": "client",
            "messageId": message_id,
            "client_email": client_email,
            "vendor_email": vendor_email,
            "subject": f"RFP: {structured_data.get('title', 'New Request')}",
            "message_for_vendor": message_for_vendor,
            "title": structured_data.get("title", "Untitled RFP"),
            "description": structured_data.get("description", ""),
            "budget": structured_data.get("budget"),
            "items": [item.model_dump() for item in items],
            "delivery_time": structured_data.get("delivery_time"),
            "payment_terms": structured_data.get("payment_terms"),
            "warranty": structured_data.get("warranty")
        }
        
        print(f"\nPublishing to {OUTPUT_QUEUE}...")
        success = publish_to_queue(OUTPUT_QUEUE, response)
        
        if success:
            print(f"Client message processed and published successfully")
        else:
            raise Exception("Failed to publish to output queue")
            
    except Exception as e:
        print(f"Error processing client message: {e}")
        raise


def process_vendor_message(channel, message: dict):
    try:
        message_id = message.get("messageId") or str(uuid.uuid4())
        client_email = message.get("client_email")
        vendor_email = message.get("vendor_email")
        text = message.get("text")
        rfp_id = message.get("rfp_id")
        vendor_id = message.get("vendor_id")
        
        print(f"   Client Email: {client_email}")
        print(f"   Vendor Email: {vendor_email}")
        print(f"   Text preview: {text[:100]}...")
        
        print("\nCalling Ollama AI for data extraction...")
        try:
            structured_data = process_vendor_proposal(text)
            print(f"AI extraction successful")
            print(f"Extracted: {json.dumps(structured_data, indent=2)[:300]}...")
        except Exception as e:
            print(f"AI extraction failed: {e}")
            raise
        
        message_for_client = generate_client_message(structured_data)
        
        response = {
            "origin": "vendor",
            "messageId": message_id,
            "client_email": client_email,
            "vendor_email": vendor_email,
            "subject": "Proposal Received",
            "message_for_client": message_for_client,
            "extracted": {
                "price_per_piece": structured_data.get("price_per_piece"),
                "total_price": structured_data.get("total_price"),
                "price": structured_data.get("price"),
                "quantity": structured_data.get("quantity"),
                "terms": structured_data.get("terms"),
                "warranty": structured_data.get("warranty"),
                "delivery_time": structured_data.get("delivery_time")
            },
            "rfp_id": rfp_id,
            "vendor_id": vendor_id
        }
        
        print(f"\nPublishing to {OUTPUT_QUEUE}...")
        success = publish_to_queue(OUTPUT_QUEUE, response)
        
        if success:
            print(f"Vendor message processed and published successfully")
        else:
            raise Exception("Failed to publish to output queue")
            
    except Exception as e:
        print(f"Error processing vendor message: {e}")
        raise

def start_consumer():
    try:
        print(f"Starting RabbitMQ Queue Consumer")
        print(f"Input Queue: {INPUT_QUEUE}")
        print(f"Output Queue: {OUTPUT_QUEUE}")
        print(f"RabbitMQ: {RABBITMQ_HOST}:{RABBITMQ_PORT}")
        
        credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(
                host=RABBITMQ_HOST,
                port=RABBITMQ_PORT,
                credentials=credentials,
                heartbeat=600,
                blocked_connection_timeout=300
            )
        )
        channel = connection.channel()        
        channel.queue_declare(queue=INPUT_QUEUE, durable=True)        
        channel.basic_qos(prefetch_count=1)        
        channel.basic_consume(
            queue=INPUT_QUEUE,
            on_message_callback=process_message,
            auto_ack=False
        )
        
        print(f"Connected to RabbitMQ")
        print(f"Listening to '{INPUT_QUEUE}' queue...")
        print(f"Processing messages...\n")
       
        channel.start_consuming()
        
    except Exception as e:
        print(f"Consumer error: {e}")
        raise
    finally:
        if connection:
            connection.close()


if __name__ == "__main__":
    try:
        start_consumer()
    except KeyboardInterrupt:
        print("\nConsumer stopped")
    except Exception as e:
        print(f"\nFatal error: {e}")
