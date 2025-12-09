from pydantic import BaseModel, Field
from typing import Optional, List, Union
from enum import Enum


class Origin(str, Enum):
    client = "client"
    vendor = "vendor"


class ExtractedData(BaseModel):
    price: Optional[float] = None
    quantity: Optional[Union[int, str]] = None
    price_per_piece: Optional[float] = None
    total_price: Optional[float] = None
    terms: Optional[str] = None
    warranty: Optional[str] = None
    delivery_time: Optional[str] = None


class Item(BaseModel):
    name: Optional[str] = None
    quantity: Optional[Union[int, str]] = None  
    specs: Optional[str] = None


class ProcessClientRequestPayload(BaseModel):
    text: str = Field(..., description="Unstructured paragraph/text from client")
    client_email: str = Field(..., description="Client email address")
    vendor_email: str = Field(..., description="Vendor email to send RFP to")
    messageId: Optional[str] = Field(None, description="Idempotency key")


class ProcessVendorProposalPayload(BaseModel):
    text: str = Field(..., description="Unstructured paragraph/text from vendor")
    client_email: str = Field(..., description="Client email")
    vendor_email: str = Field(..., description="Vendor email")
    rfp_id: Optional[str] = Field(None, description="Reference RFP ID from MongoDB")
    vendor_id: Optional[str] = Field(None, description="Reference Vendor ID from MongoDB")
    messageId: Optional[str] = Field(None, description="Idempotency key")


class ProcessedRFPResponse(BaseModel):
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
    origin: str = "vendor"
    messageId: str
    client_email: str
    vendor_email: str
    subject: str = "New Proposal Received"
    message_for_client: str = Field(..., description="AI-generated message summarizing the proposal")
    extracted: ExtractedData
    rfp_id: Optional[str] = None
    vendor_id: Optional[str] = None
