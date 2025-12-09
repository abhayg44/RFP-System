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


## start the queue_consumer python server to strucutre the unstrucutred data(user and vendor input)
python queue_consumer.py

## start the proposal_evaluator python server to evaluate the proposals
python proposal_evaluator.py