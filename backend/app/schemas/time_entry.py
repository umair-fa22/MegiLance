# @AI-HINT: Pydantic schemas for Time Entry API validation and responses
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Optional

class TimeEntryBase(BaseModel):
    """Base time entry schema with common fields"""
    contract_id: int = Field(..., description="Contract ID this time entry belongs to")
    description: Optional[str] = Field(None, max_length=500, description="Description of work performed")
    billable: bool = Field(True, description="Whether this time entry is billable")
    hourly_rate: Optional[float] = Field(None, gt=0, description="Hourly rate for this work")
    status: str = Field("draft", description="Time entry status (draft, submitted, approved, rejected, invoiced)")

class TimeEntryCreate(TimeEntryBase):
    """Schema for creating a new time entry (starts timer)"""
    start_time: Optional[datetime] = Field(None, description="Start time (auto-set if not provided)")

class TimeEntryStop(BaseModel):
    """Schema for stopping a time entry (calculates duration)"""
    end_time: Optional[datetime] = Field(None, description="End time (auto-set if not provided)")

class TimeEntryUpdate(BaseModel):
    """Schema for updating a time entry"""
    description: Optional[str] = Field(None, max_length=500)
    billable: Optional[bool] = None
    hourly_rate: Optional[float] = Field(None, gt=0)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = None

class TimeEntrySubmit(BaseModel):
    """Schema for submitting time entries"""
    time_entry_ids: list[int] = Field(..., description="List of time entry IDs to submit")

class TimeEntryReview(BaseModel):
    """Schema for approving/rejecting time entries"""
    time_entry_ids: list[int] = Field(..., description="List of time entry IDs to review")
    rejection_reason: Optional[str] = Field(None, description="Reason for rejection (required if rejecting)")

class TimeEntryRead(TimeEntryBase):
    """Schema for reading a time entry (response)"""
    id: int
    user_id: int
    start_time: datetime
    end_time: Optional[datetime]
    duration_minutes: Optional[int]
    amount: Optional[float]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TimeEntrySummary(BaseModel):
    """Schema for time entry summary by contract"""
    contract_id: int
    total_hours: float
    total_amount: float
    billable_hours: float
    billable_amount: float
    entry_count: int
