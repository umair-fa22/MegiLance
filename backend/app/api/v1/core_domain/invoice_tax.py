# @AI-HINT: Invoice and tax management API endpoints
"""
Invoice & Tax API - Professional invoicing and tax management endpoints.

Features:
- Invoice CRUD operations
- Payment recording
- Tax rate management
- Tax reporting
- Export functionality
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, List, Literal
from pydantic import BaseModel, EmailStr
from datetime import datetime

from app.core.security import get_current_active_user
from app.services.db_utils import sanitize_text
from app.services.invoice_tax import (
    get_invoice_tax_service,
    InvoiceStatus,
    TaxType,
    PaymentTerms
)

router = APIRouter(prefix="/invoice-tax", tags=["invoice-tax"])


# Request/Response Models
class InvoiceItem(BaseModel):
    description: str
    quantity: float
    unit_price: float


class TaxRate(BaseModel):
    name: str
    rate: float


class CreateInvoiceRequest(BaseModel):
    client_id: int
    items: List[InvoiceItem]
    payment_terms: PaymentTerms = PaymentTerms.NET_30
    tax_rates: Optional[List[TaxRate]] = None
    notes: Optional[str] = None
    due_date: Optional[datetime] = None
    currency: str = "USD"


class UpdateInvoiceRequest(BaseModel):
    items: Optional[List[InvoiceItem]] = None
    payment_terms: Optional[PaymentTerms] = None
    tax_rates: Optional[List[TaxRate]] = None
    notes: Optional[str] = None
    due_date: Optional[datetime] = None


class SendInvoiceRequest(BaseModel):
    email_to: EmailStr
    message: Optional[str] = None


class RecordPaymentRequest(BaseModel):
    amount: float
    payment_method: str
    payment_date: Optional[datetime] = None
    reference: Optional[str] = None


class CancelInvoiceRequest(BaseModel):
    reason: str


class CreateTaxRateRequest(BaseModel):
    name: str
    rate: float
    tax_type: TaxType
    country: str
    region: Optional[str] = None
    is_default: bool = False


class UpdateTaxRateRequest(BaseModel):
    name: Optional[str] = None
    rate: Optional[float] = None
    is_default: Optional[bool] = None


class ExportAccountingRequest(BaseModel):
    format: Literal["quickbooks", "xero", "csv"]
    date_from: datetime
    date_to: datetime


class CreateRecurringInvoiceRequest(BaseModel):
    client_id: int
    items: List[InvoiceItem]
    frequency: Literal["weekly", "biweekly", "monthly", "quarterly", "yearly"]
    start_date: datetime
    end_date: Optional[datetime] = None


# Invoice Endpoints
@router.post("/invoices")
async def create_invoice(
    request: CreateInvoiceRequest,
    current_user = Depends(get_current_active_user)
):
    """Create a new invoice."""
    service = get_invoice_tax_service()
    
    items = [item.dict() for item in request.items]
    # Sanitize item descriptions
    for item in items:
        if "description" in item and isinstance(item["description"], str):
            item["description"] = sanitize_text(item["description"], 500)
    tax_rates = [tr.dict() for tr in request.tax_rates] if request.tax_rates else None
    
    invoice = await service.create_invoice(
        user_id=current_user["id"],
        client_id=request.client_id,
        items=items,
        payment_terms=request.payment_terms,
        tax_rates=tax_rates,
        notes=sanitize_text(request.notes, 2000) if request.notes else None,
        due_date=request.due_date,
        currency=request.currency
    )
    
    return {"invoice": invoice}


@router.get("/invoices")
async def list_invoices(
    status: Optional[InvoiceStatus] = None,
    client_id: Optional[int] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user = Depends(get_current_active_user)
):
    """List invoices with filters."""
    service = get_invoice_tax_service()
    
    result = await service.list_invoices(
        user_id=current_user["id"],
        status=status,
        client_id=client_id,
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size
    )
    
    return result


@router.get("/invoices/{invoice_id}")
async def get_invoice(
    invoice_id: str,
    current_user = Depends(get_current_active_user)
):
    """Get invoice by ID."""
    service = get_invoice_tax_service()
    
    invoice = await service.get_invoice(invoice_id, current_user["id"])
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    return {"invoice": invoice}


@router.put("/invoices/{invoice_id}")
async def update_invoice(
    invoice_id: str,
    request: UpdateInvoiceRequest,
    current_user = Depends(get_current_active_user)
):
    """Update an invoice (drafts only)."""
    service = get_invoice_tax_service()
    
    updates = request.dict(exclude_unset=True)
    if "items" in updates:
        updates["items"] = [item.dict() for item in request.items]
    if "tax_rates" in updates and request.tax_rates:
        updates["tax_rates"] = [tr.dict() for tr in request.tax_rates]
    
    invoice = await service.update_invoice(
        invoice_id=invoice_id,
        user_id=current_user["id"],
        updates=updates
    )
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    return {"invoice": invoice}


@router.post("/invoices/{invoice_id}/send")
async def send_invoice(
    invoice_id: str,
    request: SendInvoiceRequest,
    current_user = Depends(get_current_active_user)
):
    """Send invoice to client."""
    service = get_invoice_tax_service()
    
    result = await service.send_invoice(
        invoice_id=invoice_id,
        user_id=current_user["id"],
        email_to=request.email_to,
        message=sanitize_text(request.message, 2000) if request.message else None
    )
    
    return result


@router.post("/invoices/{invoice_id}/payment")
async def record_payment(
    invoice_id: str,
    request: RecordPaymentRequest,
    current_user = Depends(get_current_active_user)
):
    """Record a payment for an invoice."""
    service = get_invoice_tax_service()
    
    result = await service.record_payment(
        invoice_id=invoice_id,
        user_id=current_user["id"],
        amount=request.amount,
        payment_method=request.payment_method,
        payment_date=request.payment_date,
        reference=sanitize_text(request.reference, 500) if request.reference else None
    )
    
    return result


@router.post("/invoices/{invoice_id}/cancel")
async def cancel_invoice(
    invoice_id: str,
    request: CancelInvoiceRequest,
    current_user = Depends(get_current_active_user)
):
    """Cancel an invoice."""
    service = get_invoice_tax_service()
    
    result = await service.cancel_invoice(
        invoice_id=invoice_id,
        user_id=current_user["id"],
        reason=sanitize_text(request.reason, 1000)
    )
    
    return result


@router.post("/invoices/{invoice_id}/duplicate")
async def duplicate_invoice(
    invoice_id: str,
    current_user = Depends(get_current_active_user)
):
    """Duplicate an invoice."""
    service = get_invoice_tax_service()
    
    invoice = await service.duplicate_invoice(invoice_id, current_user["id"])
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    return {"invoice": invoice}


@router.get("/invoices/{invoice_id}/pdf")
async def export_invoice_pdf(
    invoice_id: str,
    current_user = Depends(get_current_active_user)
):
    """Export invoice as PDF."""
    service = get_invoice_tax_service()
    result = await service.export_invoice_pdf(invoice_id, current_user["id"])
    return result


# Tax Rate Endpoints
@router.get("/tax-rates")
async def get_tax_rates(
    country: Optional[str] = None,
    current_user = Depends(get_current_active_user)
):
    """Get configured tax rates."""
    service = get_invoice_tax_service()
    rates = await service.get_tax_rates(current_user["id"], country)
    return {"tax_rates": rates}


@router.post("/tax-rates")
async def create_tax_rate(
    request: CreateTaxRateRequest,
    current_user = Depends(get_current_active_user)
):
    """Create a new tax rate."""
    service = get_invoice_tax_service()
    
    rate = await service.create_tax_rate(
        user_id=current_user["id"],
        name=request.name,
        rate=request.rate,
        tax_type=request.tax_type,
        country=request.country,
        region=request.region,
        is_default=request.is_default
    )
    
    return {"tax_rate": rate}


@router.put("/tax-rates/{tax_id}")
async def update_tax_rate(
    tax_id: str,
    request: UpdateTaxRateRequest,
    current_user = Depends(get_current_active_user)
):
    """Update a tax rate."""
    service = get_invoice_tax_service()
    
    rate = await service.update_tax_rate(
        tax_id=tax_id,
        user_id=current_user["id"],
        updates=request.dict(exclude_unset=True)
    )
    
    if not rate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tax rate not found"
        )
    
    return {"tax_rate": rate}


@router.delete("/tax-rates/{tax_id}")
async def delete_tax_rate(
    tax_id: str,
    current_user = Depends(get_current_active_user)
):
    """Delete a tax rate."""
    service = get_invoice_tax_service()
    
    success = await service.delete_tax_rate(tax_id, current_user["id"])
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tax rate not found"
        )
    
    return {"message": "Tax rate deleted"}


# Tax Reporting Endpoints
@router.get("/tax-report")
async def get_tax_report(
    year: int,
    quarter: Optional[int] = None,
    current_user = Depends(get_current_active_user)
):
    """Generate tax report."""
    service = get_invoice_tax_service()
    report = await service.get_tax_report(current_user["id"], year, quarter)
    return {"report": report}


@router.get("/income-statement")
async def get_income_statement(
    year: int,
    month: Optional[int] = None,
    current_user = Depends(get_current_active_user)
):
    """Generate income statement."""
    service = get_invoice_tax_service()
    statement = await service.get_income_statement(current_user["id"], year, month)
    return {"statement": statement}


# Invoice Templates
@router.get("/templates")
async def get_invoice_templates(
    current_user = Depends(get_current_active_user)
):
    """Get invoice templates."""
    service = get_invoice_tax_service()
    templates = await service.get_invoice_templates(current_user["id"])
    return {"templates": templates}


@router.put("/templates/{template_id}/default")
async def set_default_template(
    template_id: str,
    current_user = Depends(get_current_active_user)
):
    """Set default invoice template."""
    service = get_invoice_tax_service()
    result = await service.set_invoice_template(current_user["id"], template_id)
    return result


# Export
@router.post("/export")
async def export_to_accounting(
    request: ExportAccountingRequest,
    current_user = Depends(get_current_active_user)
):
    """Export invoices for accounting software."""
    service = get_invoice_tax_service()
    
    result = await service.export_to_accounting(
        user_id=current_user["id"],
        format=request.format,
        date_from=request.date_from,
        date_to=request.date_to
    )
    
    return result


# Recurring Invoices
@router.post("/recurring")
async def create_recurring_invoice(
    request: CreateRecurringInvoiceRequest,
    current_user = Depends(get_current_active_user)
):
    """Create a recurring invoice schedule."""
    service = get_invoice_tax_service()
    
    items = [item.dict() for item in request.items]
    
    recurring = await service.create_recurring_invoice(
        user_id=current_user["id"],
        client_id=request.client_id,
        items=items,
        frequency=request.frequency,
        start_date=request.start_date,
        end_date=request.end_date
    )
    
    return {"recurring_invoice": recurring}


@router.get("/recurring")
async def list_recurring_invoices(
    current_user = Depends(get_current_active_user)
):
    """List recurring invoice schedules."""
    service = get_invoice_tax_service()
    recurring = await service.list_recurring_invoices(current_user["id"])
    return {"recurring_invoices": recurring}
