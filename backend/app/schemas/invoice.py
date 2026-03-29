# @AI-HINT: Pydantic schemas for Invoice API validation and responses
from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import datetime, date
from typing import Optional, List, Dict, Any

class InvoiceBase(BaseModel):
    """Base invoice schema with common fields"""
    contract_id: int = Field(..., description="Contract ID this invoice belongs to")
    to_user_id: int = Field(..., description="User receiving the invoice (client)")
    due_date: date = Field(..., description="Invoice due date")
    notes: Optional[str] = Field(None, max_length=1000, description="Invoice notes")

class InvoiceCreate(InvoiceBase):
    """Schema for creating a new invoice"""
    items: List[Dict[str, Any]] = Field(..., description="Invoice line items (JSON)")
    tax_rate: Optional[float] = Field(0.0, ge=0, le=100, description="Tax rate percentage")
    
    @field_validator('items')
    @classmethod
    def validate_items(cls, v):
        """Validate invoice items structure"""
        if not v:
            raise ValueError("Invoice must have at least one item")
        for item in v:
            if 'description' not in item or 'amount' not in item:
                raise ValueError("Each item must have description and amount")
        return v

class InvoiceUpdate(BaseModel):
    """Schema for updating an invoice"""
    due_date: Optional[date] = None
    notes: Optional[str] = Field(None, max_length=1000)
    status: Optional[str] = None

class InvoicePayment(BaseModel):
    """Schema for marking invoice as paid"""
    payment_id: Optional[int] = Field(None, description="Payment ID for this invoice. If omitted, a manual payment record is created.")

class InvoiceRead(InvoiceBase):
    """Schema for reading an invoice (response)"""
    id: int
    invoice_number: str
    from_user_id: int
    subtotal: float
    tax: float
    total: float
    status: str
    items: List[Dict[str, Any]]
    payment_id: Optional[int]
    paid_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    @field_validator('items', mode='before')
    @classmethod
    def parse_items(cls, v):
        """Parse items from JSON string if needed"""
        if isinstance(v, str):
            import json
            return json.loads(v)
        return v

    model_config = ConfigDict(from_attributes=True)

class InvoiceList(BaseModel):
    """Schema for paginated invoice list"""
    invoices: List[InvoiceRead]
    total: int
    page: int
    page_size: int
