from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="RFP AI Processing API",
    description="Queue-based AI processing for RFP and Proposals",
    version="1.0.0"
)

# Add CORS middleware for Node.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "RFP AI Processing API",
        "mode": "queue-based",
        "message": "AI processing runs via queue_consumer.py listening to ai_request_queue"
    }


@app.post("/api/process-client-request")
async def process_client_request_endpoint():
    raise HTTPException(status_code=501, detail="Use queue_consumer.py instead. Publish to ai_request_queue")


@app.post("/api/process-vendor-proposal")
async def process_vendor_proposal_endpoint():
    raise HTTPException(status_code=501, detail="Use queue_consumer.py instead. Publish to ai_request_queue")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
