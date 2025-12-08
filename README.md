## Architecture

```
Node.js Backend
    ↓ (POST /api/process-client-request or /api/process-vendor-proposal)
    ↓
FastAPI Python Server
    ↓ (calls Ollama AI)
    ↓
Ollama Local AI Model (deepseek-r1:1.5b)
    ↓ (extracts structured data from unstructured text)
    ↓
FastAPI → RabbitMQ Publisher
    ↓ (publishes to ai_responses_queue)
    ↓
Node.js Queue Listener (queueListener.js)
    ↓ (saves to DB and sends emails)
    ↓
Database (MongoDB)
```

## Setup

### 1. Install Dependencies

```powershell
cd Python
pip install -r requirements.txt
```

### 2. Ensure Ollama is Running

```powershell
# In one terminal, keep Ollama running
ollama serve
```
## in my current code it is 11436 but it will generally be 11434. please change the .env of python to 11434

### 3. Ensure RabbitMQ is Running

```powershell
# RabbitMQ should be running on localhost:5672
# If using Docker:
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```
# or you can install rabbitmq locally and start the server


```powershell
cd 'C:\Users\Abhay G\Desktop\RPG\Python'
python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
Uvicorn running on http://0.0.0.0:8000
```

## API Endpoints



### 2. Process Client Request (Unstructured → RFP)

**Endpoint:** `POST http://localhost:8000/api/process-client-request`

**Request Body:**
```json
{
  "text": "We need 100 units of blue widgets with custom specifications. Budget is around $5000. We need them by March 2025 with a 1-year warranty.",
  "client_email": "client@example.com",
  "vendor_email": "vendor@example.com",
  "messageId": "optional-unique-id"
}
```

**Response:**
```json
{
  "origin": "client",
  "messageId": "uuid-here",
  "client_email": "client@example.com",
  "vendor_email": "vendor@example.com",
  "subject": "RFP: Blue Widgets",
  "message_for_vendor": "New RFP Received:\nTitle: Blue Widgets\n...",
  "title": "Blue Widgets",
  "description": "Custom specifications...",
  "budget": 5000,
  "items": [
    {
      "name": "Blue Widgets",
      "quantity": 100,
      "specs": "Custom specifications"
    }
  ],
  "delivery_time": "March 2025",
  "payment_terms": null,
  "warranty": "1-year warranty"
}
```

### 3. Process Vendor Proposal (Unstructured → Proposal)

**Endpoint:** `POST http://localhost:8000/api/process-vendor-proposal`

**Request Body:**
```json
{
  "text": "We can supply 100 blue widgets at $45 per unit. We can deliver within 4 weeks. Payment terms are Net 30. We offer a 2-year warranty.",
  "client_email": "client@example.com",
  "vendor_email": "vendor@example.com",
  "rfp_id": "optional-mongodb-id",
  "vendor_id": "optional-mongodb-id",
  "messageId": "optional-unique-id"
}
```

**Response:**
```json
{
  "origin": "vendor",
  "messageId": "uuid-here",
  "client_email": "client@example.com",
  "vendor_email": "vendor@example.com",
  "subject": "Proposal Received",
  "message_for_client": "Vendor Proposal Received:\nPrice: $45\nQuantity: 100 units\n...",
  "extracted": {
    "price": 45,
    "quantity": 100,
    "terms": "Net 30",
    "warranty": "2-year warranty",
    "delivery_time": "4 weeks"
  },
  "rfp_id": "optional-mongodb-id",
  "vendor_id": "optional-mongodb-id"
}
```

## How to Call from Node.js

### Client Request Example

```javascript
// Frontend calls Node.js backend
fetch("http://localhost:5000/api/client/request", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    client_email: "client@example.com",
    vendor_email: "vendor@example.com",
    text: "We need 100 blue widgets..."
  })
});

// Node.js Backend calls Python FastAPI
fetch("http://localhost:8000/api/process-client-request", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    text: "We need 100 blue widgets...",
    client_email: "client@example.com",
    vendor_email: "vendor@example.com"
  })
})
.then(res => res.json())
.then(data => {
  console.log("AI Response:", data);
  // Response is automatically published to RabbitMQ by FastAPI
  // Node.js queueListener will consume it
});
```

## Interactive API Documentation

Once the server is running, visit:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## Troubleshooting

### 1. Connection refused to Ollama

```
Error: Failed to connect to Ollama at http://localhost:11434/api/chat
```

**Solution:**
```powershell
ollama serve
```

### 2. RabbitMQ Connection Error

```
Error: Failed to publish to queue
```

**Solution:**
```powershell
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

### 3. Slow AI Response

First AI call takes ~10-30 seconds. Subsequent calls are faster.

### 4. JSON Parsing Error

If AI response isn't valid JSON, check the prompt in `ai_service.py` and adjust.

## Testing with curl

```powershell
# Test client request processing
curl -X POST http://localhost:8000/api/process-client-request `
  -H "Content-Type: application/json" `
  -d '{
    "text": "We need 100 blue widgets by March with 1-year warranty and budget of 5000",
    "client_email": "client@example.com",
    "vendor_email": "vendor@example.com"
  }'

# Test vendor proposal processing
curl -X POST http://localhost:8000/api/process-vendor-proposal `
  -H "Content-Type: application/json" `
  -d '{
    "text": "We can supply 100 widgets at $45 each, delivery in 4 weeks, Net 30 terms, 2-year warranty",
    "client_email": "client@example.com",
    "vendor_email": "vendor@example.com"
  }'
```

## File Structure

```
Python/
├── app.py                 # FastAPI application
├── models.py              # Pydantic request/response models
├── ai_service.py          # Ollama AI integration
├── queue_publisher.py     # RabbitMQ publisher
├── requirements.txt       # Python dependencies
├── .env                   # Environment variables
└── main.py               # (Old test file, can delete)
```

## Next Steps

1. Update Node.js `clientController.js` to POST unstructured text to Python FastAPI instead of publishing directly to RabbitMQ
2. Update Node.js `vendorController.js` similarly for vendor proposals
3. Node.js `queueListener.js` will automatically consume the AI responses from `ai_responses_queue`
4. Database save and email sending happens in Node.js as before
