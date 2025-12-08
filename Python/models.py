from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class Origin(str, Enum):
    client = "client"
    vendor = "vendor"


class ExtractedData(BaseModel):
    # price: kept for backward-compatibility (prefer using price_per_piece / total_price)
    price: Optional[float] = None
    quantity: Optional[int] = None
    price_per_piece: Optional[float] = None
    total_price: Optional[float] = None
    terms: Optional[str] = None
    warranty: Optional[str] = None
    delivery_time: Optional[str] = None


class Item(BaseModel):
    name: Optional[str] = None
    quantity: Optional[int] = None
    specs: Optional[str] = None


# Request models from Node.js
class ProcessClientRequestPayload(BaseModel):
    """Unstructured client request that needs to be organized into RFP"""
    text: str = Field(..., description="Unstructured paragraph/text from client")
    client_email: str = Field(..., description="Client email address")
    vendor_email: str = Field(..., description="Vendor email to send RFP to")
    messageId: Optional[str] = Field(None, description="Idempotency key")


class ProcessVendorProposalPayload(BaseModel):
    """Unstructured vendor proposal that needs to be organized into Proposal"""
    text: str = Field(..., description="Unstructured paragraph/text from vendor")
    client_email: str = Field(..., description="Client email")
    vendor_email: str = Field(..., description="Vendor email")
    rfp_id: Optional[str] = Field(None, description="Reference RFP ID from MongoDB")
    vendor_id: Optional[str] = Field(None, description="Reference Vendor ID from MongoDB")
    messageId: Optional[str] = Field(None, description="Idempotency key")


# Response models (to be published to RabbitMQ)
class ProcessedRFPResponse(BaseModel):
    """Structured RFP response for vendor"""
    origin: str = "client"
    messageId: str
    client_email: str
    vendor_email: str
    subject: str = "New RFP Received"
    message_for_vendor: str = Field(..., description="AI-generated message summarizing the RFP")
    title: str
    description: str
    budget: Optional[float] = None
    items: List[Item] = []
    delivery_time: Optional[str] = None
    payment_terms: Optional[str] = None
    warranty: Optional[str] = None


class ProcessedProposalResponse(BaseModel):
    """Structured proposal response for client"""
    origin: str = "vendor"
    messageId: str
    client_email: str
    vendor_email: str
    subject: str = "New Proposal Received"
    message_for_client: str = Field(..., description="AI-generated message summarizing the proposal")
    extracted: ExtractedData
    rfp_id: Optional[str] = None
    vendor_id: Optional[str] = None
