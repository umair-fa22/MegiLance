# @AI-HINT: Pydantic schemas for Stripe payment API requests and responses

from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, Dict


# ===== Customer Schemas =====

class StripeCustomerCreate(BaseModel):
    """Request to create a Stripe customer"""
    email: str = Field(..., description="Customer email")
    name: Optional[str] = Field(None, description="Customer name")
    metadata: Optional[Dict[str, str]] = Field(None, description="Additional metadata")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "email": "client@example.com",
            "name": "John Doe",
            "metadata": {"user_id": "123"}
        }
    })


class StripeCustomerResponse(BaseModel):
    """Response with Stripe customer details"""
    id: str = Field(..., description="Stripe customer ID")
    email: str
    name: Optional[str] = None
    created: int
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "id": "cus_abc123",
            "email": "client@example.com",
            "name": "John Doe",
            "created": 1699920000
        }
    })


# ===== Payment Intent Schemas =====

class PaymentIntentCreate(BaseModel):
    """Request to create a payment intent"""
    amount: float = Field(..., gt=0, description="Amount in dollars")
    currency: str = Field(default="usd", description="Currency code")
    description: Optional[str] = Field(None, description="Payment description")
    metadata: Optional[Dict[str, str]] = Field(None, description="Additional metadata")
    customer_id: Optional[str] = Field(None, description="Stripe customer ID")
    payment_method: Optional[str] = Field(None, description="Payment method ID")
    capture_method: str = Field(default="automatic", description="'automatic' or 'manual' for escrow")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "amount": 100.00,
            "currency": "usd",
            "description": "Payment for Project Milestone",
            "metadata": {"project_id": "456", "milestone_id": "789"},
            "capture_method": "manual"
        }
    })


class PaymentIntentResponse(BaseModel):
    """Response with payment intent details"""
    id: str = Field(..., description="Payment intent ID")
    amount: int = Field(..., description="Amount in cents")
    currency: str
    status: str = Field(..., description="Payment status")
    client_secret: str = Field(..., description="Client secret for frontend")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "id": "pi_abc123",
            "amount": 10000,
            "currency": "usd",
            "status": "requires_payment_method",
            "client_secret": "pi_abc123_secret_xyz"
        }
    })


class PaymentIntentConfirm(BaseModel):
    """Request to confirm a payment intent"""
    payment_method: Optional[str] = Field(None, description="Payment method ID")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "payment_method": "pm_card_visa"
        }
    })


class PaymentIntentCapture(BaseModel):
    """Request to capture a payment intent"""
    amount_to_capture: Optional[float] = Field(None, description="Amount to capture in dollars (None = full amount)")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "amount_to_capture": 95.00
        }
    })


# ===== Refund Schemas =====

class RefundCreate(BaseModel):
    """Request to create a refund"""
    payment_intent_id: str = Field(..., description="Payment intent to refund")
    amount: Optional[float] = Field(None, description="Amount to refund in dollars (None = full refund)")
    reason: Optional[str] = Field(None, description="Refund reason")
    metadata: Optional[Dict[str, str]] = Field(None, description="Additional metadata")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "payment_intent_id": "pi_abc123",
            "amount": 50.00,
            "reason": "requested_by_customer",
            "metadata": {"dispute_id": "123"}
        }
    })


class RefundResponse(BaseModel):
    """Response with refund details"""
    id: str = Field(..., description="Refund ID")
    amount: int = Field(..., description="Refund amount in cents")
    status: str = Field(..., description="Refund status")
    reason: Optional[str] = None
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "id": "re_abc123",
            "amount": 5000,
            "status": "succeeded",
            "reason": "requested_by_customer"
        }
    })


# ===== Payment Method Schemas =====

class PaymentMethodAttach(BaseModel):
    """Request to attach payment method to customer"""
    payment_method_id: str = Field(..., description="Payment method ID")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "payment_method_id": "pm_card_visa"
        }
    })


class PaymentMethodResponse(BaseModel):
    """Response with payment method details"""
    id: str
    type: str
    card: Optional[Dict[str, str]] = None
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "id": "pm_abc123",
            "type": "card",
            "card": {
                "brand": "visa",
                "last4": "4242",
                "exp_month": "12",
                "exp_year": "2025"
            }
        }
    })


# ===== Subscription Schemas =====

class SubscriptionCreate(BaseModel):
    """Request to create a subscription"""
    price_id: str = Field(..., description="Stripe price ID")
    customer_id: str = Field(..., description="Stripe customer ID")
    trial_period_days: Optional[int] = Field(None, description="Trial period in days")
    metadata: Optional[Dict[str, str]] = Field(None, description="Additional metadata")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "price_id": "price_abc123",
            "customer_id": "cus_xyz789",
            "trial_period_days": 14,
            "metadata": {"user_id": "123"}
        }
    })


class SubscriptionResponse(BaseModel):
    """Response with subscription details"""
    id: str
    status: str
    current_period_end: int
    cancel_at_period_end: bool
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "id": "sub_abc123",
            "status": "active",
            "current_period_end": 1702512000,
            "cancel_at_period_end": False
        }
    })


# ===== Webhook Schemas =====

class WebhookEvent(BaseModel):
    """Stripe webhook event payload"""
    # This is handled as raw request body in the endpoint
    pass


class WebhookResponse(BaseModel):
    """Response after processing webhook"""
    status: str = Field(..., description="Processing status")
    event_type: Optional[str] = Field(None, description="Event type processed")
    message: Optional[str] = Field(None, description="Processing message")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "status": "success",
            "event_type": "payment_intent.succeeded",
            "message": "Payment processed successfully"
        }
    })


# ===== General Response Schemas =====

class StripeErrorResponse(BaseModel):
    """Stripe error response"""
    error: str = Field(..., description="Error message")
    type: Optional[str] = Field(None, description="Error type")
    code: Optional[str] = Field(None, description="Error code")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "error": "Invalid payment method",
            "type": "card_error",
            "code": "card_declined"
        }
    })
