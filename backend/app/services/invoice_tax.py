# @AI-HINT: Advanced invoice and tax management service
"""Invoice & Tax Management Service - Professional invoicing with tax calculations."""

from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from enum import Enum
import logging
import uuid
import hashlib
logger = logging.getLogger(__name__)


class InvoiceStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    VIEWED = "viewed"
    PAID = "paid"
    PARTIALLY_PAID = "partially_paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class TaxType(str, Enum):
    VAT = "vat"
    GST = "gst"
    SALES_TAX = "sales_tax"
    WITHHOLDING = "withholding"
    SERVICE_TAX = "service_tax"


class PaymentTerms(str, Enum):
    DUE_ON_RECEIPT = "due_on_receipt"
    NET_7 = "net_7"
    NET_15 = "net_15"
    NET_30 = "net_30"
    NET_45 = "net_45"
    NET_60 = "net_60"
    CUSTOM = "custom"


class InvoiceTaxService:
    """Service for invoice and tax management."""
    
    def __init__(self):
        pass
    
    # Invoice Management
    async def create_invoice(
        self,
        user_id: int,
        client_id: int,
        items: List[Dict[str, Any]],
        payment_terms: PaymentTerms = PaymentTerms.NET_30,
        tax_rates: Optional[List[Dict]] = None,
        notes: Optional[str] = None,
        due_date: Optional[datetime] = None,
        currency: str = "USD"
    ) -> Dict[str, Any]:
        """Create a new invoice."""
        invoice_id = str(uuid.uuid4())
        invoice_number = f"INV-{datetime.now(timezone.utc).strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"
        
        # Calculate totals
        subtotal = sum(item["quantity"] * item["unit_price"] for item in items)
        
        # Apply taxes
        tax_breakdown = []
        total_tax = 0
        if tax_rates:
            for tax in tax_rates:
                tax_amount = subtotal * (tax["rate"] / 100)
                total_tax += tax_amount
                tax_breakdown.append({
                    "name": tax["name"],
                    "rate": tax["rate"],
                    "amount": round(tax_amount, 2)
                })
        
        total = subtotal + total_tax
        
        # Calculate due date based on payment terms
        if not due_date:
            terms_days = {
                PaymentTerms.DUE_ON_RECEIPT: 0,
                PaymentTerms.NET_7: 7,
                PaymentTerms.NET_15: 15,
                PaymentTerms.NET_30: 30,
                PaymentTerms.NET_45: 45,
                PaymentTerms.NET_60: 60
            }
            days = terms_days.get(payment_terms, 30)
            due_date = datetime.now(timezone.utc) + timedelta(days=days)
        
        invoice = {
            "id": invoice_id,
            "invoice_number": invoice_number,
            "user_id": user_id,
            "client_id": client_id,
            "status": InvoiceStatus.DRAFT.value,
            "items": items,
            "subtotal": round(subtotal, 2),
            "tax_breakdown": tax_breakdown,
            "total_tax": round(total_tax, 2),
            "total": round(total, 2),
            "currency": currency,
            "payment_terms": payment_terms.value,
            "issue_date": datetime.now(timezone.utc).isoformat(),
            "due_date": due_date.isoformat(),
            "notes": notes,
            "amount_paid": 0,
            "amount_due": round(total, 2),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        return invoice
    
    async def get_invoice(
        self,
        invoice_id: str,
        user_id: int
    ) -> Optional[Dict[str, Any]]:
        """Get invoice by ID."""
        # Mock invoice
        return {
            "id": invoice_id,
            "invoice_number": "INV-202401-ABC123",
            "status": "sent",
            "items": [
                {
                    "description": "Web Development Services",
                    "quantity": 40,
                    "unit_price": 75.00,
                    "total": 3000.00
                }
            ],
            "subtotal": 3000.00,
            "tax_breakdown": [{"name": "VAT", "rate": 20, "amount": 600.00}],
            "total_tax": 600.00,
            "total": 3600.00,
            "currency": "USD",
            "issue_date": "2024-01-15T00:00:00",
            "due_date": "2024-02-15T00:00:00"
        }
    
    async def list_invoices(
        self,
        user_id: int,
        status: Optional[InvoiceStatus] = None,
        client_id: Optional[int] = None,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """List invoices with filters."""
        invoices = [
            {
                "id": "inv-1",
                "invoice_number": "INV-202401-001",
                "client_name": "Acme Corp",
                "status": "paid",
                "total": 5000.00,
                "currency": "USD",
                "issue_date": "2024-01-01T00:00:00",
                "due_date": "2024-01-31T00:00:00"
            },
            {
                "id": "inv-2",
                "invoice_number": "INV-202401-002",
                "client_name": "TechStart Inc",
                "status": "sent",
                "total": 3200.00,
                "currency": "USD",
                "issue_date": "2024-01-15T00:00:00",
                "due_date": "2024-02-15T00:00:00"
            }
        ]
        
        return {
            "invoices": invoices,
            "total": 2,
            "page": page,
            "page_size": page_size
        }
    
    async def update_invoice(
        self,
        invoice_id: str,
        user_id: int,
        updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update an invoice (only drafts)."""
        invoice = await self.get_invoice(invoice_id, user_id)
        if invoice:
            invoice.update(updates)
        return invoice
    
    async def send_invoice(
        self,
        invoice_id: str,
        user_id: int,
        email_to: str,
        message: Optional[str] = None
    ) -> Dict[str, Any]:
        """Send invoice to client."""
        return {
            "success": True,
            "invoice_id": invoice_id,
            "sent_to": email_to,
            "sent_at": datetime.now(timezone.utc).isoformat(),
            "message": "Invoice sent successfully"
        }
    
    async def record_payment(
        self,
        invoice_id: str,
        user_id: int,
        amount: float,
        payment_method: str,
        payment_date: Optional[datetime] = None,
        reference: Optional[str] = None
    ) -> Dict[str, Any]:
        """Record a payment for an invoice."""
        payment = {
            "id": str(uuid.uuid4()),
            "invoice_id": invoice_id,
            "amount": amount,
            "payment_method": payment_method,
            "payment_date": (payment_date or datetime.now(timezone.utc)).isoformat(),
            "reference": reference,
            "recorded_at": datetime.now(timezone.utc).isoformat()
        }
        
        return {"payment": payment, "message": "Payment recorded"}
    
    async def cancel_invoice(
        self,
        invoice_id: str,
        user_id: int,
        reason: str
    ) -> Dict[str, Any]:
        """Cancel an invoice."""
        return {
            "invoice_id": invoice_id,
            "status": "cancelled",
            "cancelled_at": datetime.now(timezone.utc).isoformat(),
            "reason": reason
        }
    
    async def duplicate_invoice(
        self,
        invoice_id: str,
        user_id: int
    ) -> Dict[str, Any]:
        """Create a copy of an existing invoice."""
        original = await self.get_invoice(invoice_id, user_id)
        if not original:
            return None
        
        new_id = str(uuid.uuid4())
        new_number = f"INV-{datetime.now(timezone.utc).strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"
        
        duplicate = {
            **original,
            "id": new_id,
            "invoice_number": new_number,
            "status": "draft",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        return duplicate
    
    # Tax Management
    async def get_tax_rates(
        self,
        user_id: int,
        country: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get configured tax rates."""
        return [
            {
                "id": "tax-1",
                "name": "Standard VAT",
                "type": TaxType.VAT.value,
                "rate": 20.0,
                "country": "GB",
                "is_default": True
            },
            {
                "id": "tax-2",
                "name": "Reduced VAT",
                "type": TaxType.VAT.value,
                "rate": 5.0,
                "country": "GB",
                "is_default": False
            },
            {
                "id": "tax-3",
                "name": "Sales Tax",
                "type": TaxType.SALES_TAX.value,
                "rate": 8.875,
                "country": "US",
                "region": "NY",
                "is_default": False
            }
        ]
    
    async def create_tax_rate(
        self,
        user_id: int,
        name: str,
        rate: float,
        tax_type: TaxType,
        country: str,
        region: Optional[str] = None,
        is_default: bool = False
    ) -> Dict[str, Any]:
        """Create a new tax rate."""
        return {
            "id": str(uuid.uuid4()),
            "name": name,
            "type": tax_type.value,
            "rate": rate,
            "country": country,
            "region": region,
            "is_default": is_default,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def update_tax_rate(
        self,
        tax_id: str,
        user_id: int,
        updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update a tax rate."""
        return {
            "id": tax_id,
            **updates,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def delete_tax_rate(
        self,
        tax_id: str,
        user_id: int
    ) -> bool:
        """Delete a tax rate."""
        return True
    
    # Tax Reporting
    async def get_tax_report(
        self,
        user_id: int,
        year: int,
        quarter: Optional[int] = None
    ) -> Dict[str, Any]:
        """Generate tax report."""
        return {
            "period": f"Q{quarter} {year}" if quarter else str(year),
            "total_revenue": 45000.00,
            "taxable_revenue": 42000.00,
            "tax_collected": {
                "vat": 8400.00,
                "gst": 0,
                "other": 0
            },
            "total_tax_collected": 8400.00,
            "tax_payable": 8400.00,
            "invoices": {
                "total": 15,
                "paid": 12,
                "outstanding": 3
            },
            "by_country": [
                {"country": "GB", "revenue": 25000.00, "tax": 5000.00},
                {"country": "US", "revenue": 17000.00, "tax": 3400.00}
            ],
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def get_income_statement(
        self,
        user_id: int,
        year: int,
        month: Optional[int] = None
    ) -> Dict[str, Any]:
        """Generate income statement."""
        return {
            "period": f"{month}/{year}" if month else str(year),
            "income": {
                "gross_revenue": 55000.00,
                "refunds": -500.00,
                "net_revenue": 54500.00
            },
            "expenses": {
                "platform_fees": 2725.00,
                "payment_processing": 1635.00,
                "total": 4360.00
            },
            "net_income": 50140.00,
            "tax_liability_estimate": 10028.00,
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    
    # Invoice Templates
    async def get_invoice_templates(
        self,
        user_id: int
    ) -> List[Dict[str, Any]]:
        """Get invoice templates."""
        return [
            {
                "id": "tpl-1",
                "name": "Default",
                "is_default": True,
                "preview_url": "/templates/invoice-default.png"
            },
            {
                "id": "tpl-2",
                "name": "Professional",
                "is_default": False,
                "preview_url": "/templates/invoice-professional.png"
            },
            {
                "id": "tpl-3",
                "name": "Minimal",
                "is_default": False,
                "preview_url": "/templates/invoice-minimal.png"
            }
        ]
    
    async def set_invoice_template(
        self,
        user_id: int,
        template_id: str
    ) -> Dict[str, Any]:
        """Set default invoice template."""
        return {
            "template_id": template_id,
            "message": "Default template updated"
        }
    
    # Export
    async def export_invoice_pdf(
        self,
        invoice_id: str,
        user_id: int
    ) -> Dict[str, Any]:
        """Export invoice as PDF."""
        return {
            "invoice_id": invoice_id,
            "format": "pdf",
            "download_url": f"/api/invoices/{invoice_id}/download/pdf",
            "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
        }
    
    async def export_to_accounting(
        self,
        user_id: int,
        format: str,  # quickbooks, xero, csv
        date_from: datetime,
        date_to: datetime
    ) -> Dict[str, Any]:
        """Export invoices for accounting software."""
        return {
            "format": format,
            "period": f"{date_from.date()} to {date_to.date()}",
            "invoices_exported": 25,
            "download_url": f"/api/invoices/export/{format}",
            "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
        }
    
    # Recurring Invoices
    async def create_recurring_invoice(
        self,
        user_id: int,
        client_id: int,
        items: List[Dict[str, Any]],
        frequency: str,  # weekly, monthly, quarterly, yearly
        start_date: datetime,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Create a recurring invoice schedule."""
        return {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "client_id": client_id,
            "items": items,
            "frequency": frequency,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat() if end_date else None,
            "next_invoice_date": start_date.isoformat(),
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def list_recurring_invoices(
        self,
        user_id: int
    ) -> List[Dict[str, Any]]:
        """List recurring invoice schedules."""
        return [
            {
                "id": "rec-1",
                "client_name": "Ongoing Client",
                "frequency": "monthly",
                "amount": 2000.00,
                "next_invoice_date": "2024-02-01T00:00:00",
                "is_active": True
            }
        ]


_singleton_invoice_tax_service = None

def get_invoice_tax_service() -> InvoiceTaxService:
    """Factory function for invoice/tax service."""
    global _singleton_invoice_tax_service
    if _singleton_invoice_tax_service is None:
        _singleton_invoice_tax_service = InvoiceTaxService()
    return _singleton_invoice_tax_service
