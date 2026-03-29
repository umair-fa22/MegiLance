# @AI-HINT: Invoice API endpoints - delegates to invoices_service for all DB operations
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
from datetime import date

from app.core.security import get_current_user
from app.models import User
from app.schemas.invoice import (
    InvoiceCreate, InvoiceUpdate, InvoiceRead,
    InvoicePayment, InvoiceList
)
from app.services import invoices_service
from app.services.db_utils import get_user_role

router = APIRouter(prefix="/invoices", tags=["invoices"])


@router.post("/", response_model=InvoiceRead, status_code=status.HTTP_201_CREATED)
async def create_invoice(
    invoice: InvoiceCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new invoice. Freelancers create invoices for their contracts."""
    contract = invoices_service.get_contract_freelancer(invoice.contract_id)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    if contract["freelancer_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Only the contract freelancer can create invoices")

    tax_rate = getattr(invoice, 'tax_rate', 0) or 0
    result = invoices_service.create_invoice(
        contract_id=invoice.contract_id,
        from_user_id=current_user.id,
        to_user_id=invoice.to_user_id,
        items=invoice.items,
        tax_rate=tax_rate,
        due_date=invoice.due_date,
        notes=invoice.notes
    )

    if not result:
        raise HTTPException(status_code=500, detail="Failed to retrieve created invoice")

    return result


@router.get("/", response_model=InvoiceList)
async def list_invoices(
    contract_id: Optional[int] = Query(None, description="Filter by contract"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    from_date: Optional[date] = Query(None, description="Filter from date"),
    to_date: Optional[date] = Query(None, description="Filter to date"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """List invoices with filters. Freelancers see invoices they created, clients see invoices sent to them."""
    user_role = get_user_role(current_user)

    data = invoices_service.list_invoices(
        user_id=current_user.id,
        user_role=user_role,
        contract_id=contract_id,
        status_filter=status_filter,
        from_date=from_date,
        to_date=to_date,
        page=page,
        page_size=page_size
    )

    return InvoiceList(**data)


@router.get("/{invoice_id}", response_model=InvoiceRead)
async def get_invoice(
    invoice_id: int,
    current_user: User = Depends(get_current_user)
):
    """Get a single invoice by ID"""
    invoice = invoices_service.get_invoice_by_id(invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if invoice["from_user_id"] != current_user.id and invoice["to_user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return invoice


@router.patch("/{invoice_id}/pay", response_model=InvoiceRead)
async def pay_invoice(
    invoice_id: int,
    payment_data: InvoicePayment,
    current_user: User = Depends(get_current_user)
):
    """Mark invoice as paid. Only clients can pay invoices."""
    inv = invoices_service.get_invoice_for_payment(invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if inv["to_user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Only the invoice recipient can mark it as paid")

    if inv["status"] == "paid":
        raise HTTPException(status_code=400, detail="Invoice already paid")

    resolved_payment_id = payment_data.payment_id
    if resolved_payment_id:
        if not invoices_service.verify_payment_exists(resolved_payment_id):
            raise HTTPException(status_code=404, detail="Payment not found")
    else:
        total = invoices_service.get_invoice_total(invoice_id)
        resolved_payment_id = invoices_service.create_manual_payment(current_user.id, total, invoice_id)

    invoices_service.mark_invoice_paid(invoice_id, resolved_payment_id)

    return await get_invoice(invoice_id, current_user)


@router.patch("/{invoice_id}", response_model=InvoiceRead)
async def update_invoice(
    invoice_id: int,
    update_data: InvoiceUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update invoice details. Only freelancer (creator) can update pending invoices."""
    inv = invoices_service.get_invoice_for_update(invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if inv["from_user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if inv["status"] not in ["pending", "overdue"]:
        raise HTTPException(status_code=400, detail="Only pending or overdue invoices can be updated")

    update_dict = update_data.model_dump(exclude_unset=True)
    if update_dict:
        invoices_service.update_invoice_fields(invoice_id, update_dict)

    return await get_invoice(invoice_id, current_user)


@router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_invoice(
    invoice_id: int,
    current_user: User = Depends(get_current_user)
):
    """Delete an invoice. Only pending invoices can be deleted."""
    inv = invoices_service.get_invoice_for_update(invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if inv["from_user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if inv["status"] != "pending":
        raise HTTPException(status_code=400, detail="Only pending invoices can be deleted")

    invoices_service.delete_invoice(invoice_id)
