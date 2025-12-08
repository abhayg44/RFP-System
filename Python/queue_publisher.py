"""
RabbitMQ Publisher: Sends processed AI responses to Node.js backend via RabbitMQ
"""
import pika
import json
import os
from dotenv import load_dotenv
from typing import Dict, Any

load_dotenv()

RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "localhost")
RABBITMQ_PORT = int(os.getenv("RABBITMQ_PORT", 5672))
RABBITMQ_USER = os.getenv("RABBITMQ_USER", "guest")
RABBITMQ_PASS = os.getenv("RABBITMQ_PASS", "guest")


def publish_to_queue(queue_name: str, message: Dict[str, Any]) -> bool:
    """
    Publish a message to RabbitMQ queue.
    
    Args:
        queue_name: Name of the queue (e.g., "ai_responses_queue")
        message: Dictionary to serialize as JSON
    
    Returns:
        True if successful, False otherwise
    """
    try:
        # Create connection
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
        
        # Declare queue
        channel.queue_declare(queue=queue_name, durable=True)
        
        # Publish message
        channel.basic_publish(
            exchange='',
            routing_key=queue_name,
            body=json.dumps(message),
            properties=pika.BasicProperties(
                delivery_mode=pika.DeliveryMode.Persistent
            )
        )
        
        print(f"✓ Message published to {queue_name}")
        connection.close()
        return True
        
    except Exception as e:
        print(f"✗ Failed to publish to queue: {e}")
        return False
