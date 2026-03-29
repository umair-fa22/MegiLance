# @AI-HINT: Pydantic schemas for Escrow API validation and responses
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional

class EscrowBase(BaseModel):
    """Base escrow schema with common fields"""
    contract_id: int = Field(..., description="Contract ID for this escrow")
    amount: float = Field(..., gt=0, description="Escrow amount in USDC")

class EscrowCreate(EscrowBase):
    """Schema for creating a new escrow (client funds escrow)"""
    expires_at: Optional[datetime] = Field(None, description="Escrow expiration date")
    notes: Optional[str] = Field(None, max_length=500, description="Escrow notes")

class EscrowRelease(BaseModel):
    """Schema for releasing escrow funds to freelancer"""
    amount: float = Field(..., gt=0, description="Amount to release (can be partial)")
    reason: Optional[str] = Field(None, max_length=500, description="Reason for release")

class EscrowRefund(BaseModel):
    """Schema for refunding escrow to client"""
    amount: float = Field(..., gt=0, description="Amount to refund (can be partial)")
    reason: str = Field(..., min_length=10, max_length=500, description="Reason for refund")

class EscrowUpdate(BaseModel):
    """Schema for updating escrow details"""
    expires_at: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=500)

class EscrowRead(EscrowBase):
    """Schema for reading escrow details (response)"""
    id: int
    client_id: int
    status: str
    released_amount: float
    notes: Optional[str]
    expires_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class EscrowBalance(BaseModel):
    """Schema for escrow balance summary"""
    contract_id: int
    total_funded: float
    total_released: float
    available_balance: float
    status: str
