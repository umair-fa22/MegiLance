# @AI-HINT: Invoice Generator public API - generate professional invoices without auth
"""
Invoice Generator API - Standalone public invoice builder.
No authentication required. Generates professional invoices with
multi-currency support, tax calculations, and multiple templates.
"""

import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.services import invoice_generator_engine

logger = logging.getLogger("megilance")

router = APIRouter(tags=["Invoice Generator"])


# ============================================================================
# Request / Response Schemas
# ============================================================================

class InvoiceItemRequest(BaseModel):
    description: str = Field(..., min_length=1, max_length=500)
    quantity: float = Field(default=1, ge=0.01, le=99999)
    unit_price: float = Field(..., ge=0, le=9999999)
    unit: str = Field(default="unit")


class InvoiceGenerateRequest(BaseModel):
    # Sender
    sender_name: str = Field(default="", max_length=200)
    sender_email: str = Field(default="", max_length=200)
    sender_address: str = Field(default="", max_length=500)
    sender_phone: str = Field(default="", max_length=50)
    sender_company: str = Field(default="", max_length=200)
    sender_tax_id: str = Field(default="", max_length=100)
    # Recipient
    recipient_name: str = Field(default="", max_length=200)
    recipient_email: str = Field(default="", max_length=200)
    recipient_address: str = Field(default="", max_length=500)
    recipient_company: str = Field(default="", max_length=200)
    # Items
    items: List[InvoiceItemRequest] = Field(..., min_length=1, max_length=50)
    # Settings
    currency: str = Field(default="USD", max_length=10)
    tax_region: str = Field(default="none")
    custom_tax_rate: Optional[float] = Field(default=None, ge=0, le=100)
    discount_type: str = Field(default="none")
    discount_value: float = Field(default=0, ge=0)
    payment_terms: str = Field(default="net_30")
    template: str = Field(default="professional")
    notes: str = Field(default="", max_length=2000)
    issue_date: str = Field(default="")
    custom_invoice_number: str = Field(default="", max_length=50)


# ============================================================================
# Endpoints
# ============================================================================

@router.get("/options")
async def get_invoice_options():
    """
    Get all available invoice generator options.

    **No authentication required** - public endpoint.
    Returns currencies, tax regions, templates, payment terms.
    """
    return invoice_generator_engine.get_options()


@router.post("/generate")
async def generate_invoice(request: InvoiceGenerateRequest):
    """
    Generate a professional invoice with full calculations.

    **No authentication required** - standalone public tool.
    Supports multi-currency, regional tax, discounts, and multiple templates.
    """
    try:
        items = [
            {
                "description": item.description,
                "quantity": item.quantity,
                "rate": item.unit_price,
                "unit": item.unit,
            }
            for item in request.items
        ]

        result = invoice_generator_engine.generate_invoice(
            sender_name=request.sender_name,
            sender_email=request.sender_email,
            sender_address=request.sender_address,
            sender_phone=request.sender_phone,
            sender_tax_id=request.sender_tax_id,
            recipient_name=request.recipient_name,
            recipient_email=request.recipient_email,
            recipient_address=request.recipient_address,
            items=items,
            currency=request.currency,
            tax_preset=request.tax_region,
            custom_tax_rate=request.custom_tax_rate or 0.0,
            discount_type=request.discount_type,
            discount_value=request.discount_value,
            payment_terms=request.payment_terms,
            template=request.template,
            notes=request.notes,
            issue_date=request.issue_date,
            invoice_number=request.custom_invoice_number,
        )

        return result

    except Exception:
        logger.error("Invoice generation failed", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred generating your invoice. Please try again."
        )
