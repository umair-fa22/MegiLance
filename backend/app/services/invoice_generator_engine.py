# @AI-HINT: Standalone Invoice Generator engine – creates professional invoices without auth
"""
Invoice Generator Engine - Standalone, public invoice creation tool.
No authentication required. Works for freelancers, small businesses, anyone.
Supports multi-currency, tax calculation, custom line items, and PDF-ready output.
"""

import logging
from typing import List, Dict, Any
from datetime import datetime, timezone, timedelta
import hashlib

logger = logging.getLogger("megilance")

# ============================================================================
# Currency Database
# ============================================================================

CURRENCIES: Dict[str, Dict[str, Any]] = {
    "USD": {"symbol": "$", "name": "US Dollar", "decimal_places": 2, "position": "before"},
    "EUR": {"symbol": "€", "name": "Euro", "decimal_places": 2, "position": "before"},
    "GBP": {"symbol": "£", "name": "British Pound", "decimal_places": 2, "position": "before"},
    "CAD": {"symbol": "CA$", "name": "Canadian Dollar", "decimal_places": 2, "position": "before"},
    "AUD": {"symbol": "A$", "name": "Australian Dollar", "decimal_places": 2, "position": "before"},
    "JPY": {"symbol": "¥", "name": "Japanese Yen", "decimal_places": 0, "position": "before"},
    "INR": {"symbol": "₹", "name": "Indian Rupee", "decimal_places": 2, "position": "before"},
    "PKR": {"symbol": "Rs", "name": "Pakistani Rupee", "decimal_places": 2, "position": "before"},
    "CNY": {"symbol": "¥", "name": "Chinese Yuan", "decimal_places": 2, "position": "before"},
    "BRL": {"symbol": "R$", "name": "Brazilian Real", "decimal_places": 2, "position": "before"},
    "MXN": {"symbol": "MX$", "name": "Mexican Peso", "decimal_places": 2, "position": "before"},
    "CHF": {"symbol": "CHF", "name": "Swiss Franc", "decimal_places": 2, "position": "before"},
    "SEK": {"symbol": "kr", "name": "Swedish Krona", "decimal_places": 2, "position": "after"},
    "NOK": {"symbol": "kr", "name": "Norwegian Krone", "decimal_places": 2, "position": "after"},
    "DKK": {"symbol": "kr", "name": "Danish Krone", "decimal_places": 2, "position": "after"},
    "SGD": {"symbol": "S$", "name": "Singapore Dollar", "decimal_places": 2, "position": "before"},
    "HKD": {"symbol": "HK$", "name": "Hong Kong Dollar", "decimal_places": 2, "position": "before"},
    "KRW": {"symbol": "₩", "name": "South Korean Won", "decimal_places": 0, "position": "before"},
    "TRY": {"symbol": "₺", "name": "Turkish Lira", "decimal_places": 2, "position": "before"},
    "ZAR": {"symbol": "R", "name": "South African Rand", "decimal_places": 2, "position": "before"},
    "AED": {"symbol": "د.إ", "name": "UAE Dirham", "decimal_places": 2, "position": "before"},
    "SAR": {"symbol": "﷼", "name": "Saudi Riyal", "decimal_places": 2, "position": "before"},
    "PLN": {"symbol": "zł", "name": "Polish Zloty", "decimal_places": 2, "position": "after"},
    "THB": {"symbol": "฿", "name": "Thai Baht", "decimal_places": 2, "position": "before"},
    "PHP": {"symbol": "₱", "name": "Philippine Peso", "decimal_places": 2, "position": "before"},
    "NGN": {"symbol": "₦", "name": "Nigerian Naira", "decimal_places": 2, "position": "before"},
    "EGP": {"symbol": "E£", "name": "Egyptian Pound", "decimal_places": 2, "position": "before"},
    "BDT": {"symbol": "৳", "name": "Bangladeshi Taka", "decimal_places": 2, "position": "before"},
    "VND": {"symbol": "₫", "name": "Vietnamese Dong", "decimal_places": 0, "position": "after"},
    "COP": {"symbol": "COL$", "name": "Colombian Peso", "decimal_places": 2, "position": "before"},
}

# ============================================================================
# Tax Rate Database by Region
# ============================================================================

TAX_RATES: Dict[str, Dict[str, Any]] = {
    "none": {"label": "No Tax", "rate": 0.0, "type": "none"},
    "us_general": {"label": "US Sales Tax (avg)", "rate": 7.5, "type": "sales_tax"},
    "us_california": {"label": "California Sales Tax", "rate": 8.68, "type": "sales_tax"},
    "us_texas": {"label": "Texas Sales Tax", "rate": 8.19, "type": "sales_tax"},
    "us_new_york": {"label": "New York Sales Tax", "rate": 8.52, "type": "sales_tax"},
    "us_florida": {"label": "Florida Sales Tax", "rate": 7.01, "type": "sales_tax"},
    "uk_standard": {"label": "UK VAT (Standard)", "rate": 20.0, "type": "vat"},
    "uk_reduced": {"label": "UK VAT (Reduced)", "rate": 5.0, "type": "vat"},
    "eu_standard": {"label": "EU VAT (avg)", "rate": 21.0, "type": "vat"},
    "eu_germany": {"label": "Germany VAT", "rate": 19.0, "type": "vat"},
    "eu_france": {"label": "France VAT", "rate": 20.0, "type": "vat"},
    "eu_netherlands": {"label": "Netherlands VAT", "rate": 21.0, "type": "vat"},
    "eu_spain": {"label": "Spain VAT", "rate": 21.0, "type": "vat"},
    "eu_italy": {"label": "Italy VAT", "rate": 22.0, "type": "vat"},
    "canada_gst": {"label": "Canada GST", "rate": 5.0, "type": "gst"},
    "canada_hst_on": {"label": "Canada HST (Ontario)", "rate": 13.0, "type": "hst"},
    "australia_gst": {"label": "Australia GST", "rate": 10.0, "type": "gst"},
    "india_gst": {"label": "India GST", "rate": 18.0, "type": "gst"},
    "pakistan_gst": {"label": "Pakistan GST", "rate": 17.0, "type": "gst"},
    "japan_ct": {"label": "Japan Consumption Tax", "rate": 10.0, "type": "consumption_tax"},
    "singapore_gst": {"label": "Singapore GST", "rate": 9.0, "type": "gst"},
    "uae_vat": {"label": "UAE VAT", "rate": 5.0, "type": "vat"},
    "brazil_iss": {"label": "Brazil ISS (avg)", "rate": 5.0, "type": "service_tax"},
    "south_africa_vat": {"label": "South Africa VAT", "rate": 15.0, "type": "vat"},
    "custom": {"label": "Custom Rate", "rate": 0.0, "type": "custom"},
}

# ============================================================================
# Invoice Templates
# ============================================================================

INVOICE_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "professional": {
        "label": "Professional",
        "description": "Clean, modern layout ideal for corporate clients",
        "accent_color": "#4573df",
        "font": "Inter",
    },
    "minimal": {
        "label": "Minimal",
        "description": "Simple and elegant with minimal design elements",
        "accent_color": "#1a1f36",
        "font": "Inter",
    },
    "creative": {
        "label": "Creative",
        "description": "Bold colors and modern layout for creative professionals",
        "accent_color": "#7c3aed",
        "font": "Poppins",
    },
    "classic": {
        "label": "Classic",
        "description": "Traditional business invoice layout",
        "accent_color": "#2563eb",
        "font": "Georgia",
    },
    "freelancer": {
        "label": "Freelancer",
        "description": "Optimized for freelance service invoices with hourly rates",
        "accent_color": "#059669",
        "font": "Inter",
    },
}

# ============================================================================
# Payment Terms
# ============================================================================

PAYMENT_TERMS: Dict[str, Dict[str, Any]] = {
    "due_on_receipt": {"label": "Due on Receipt", "days": 0},
    "net_7": {"label": "Net 7", "days": 7},
    "net_15": {"label": "Net 15", "days": 15},
    "net_30": {"label": "Net 30", "days": 30},
    "net_45": {"label": "Net 45", "days": 45},
    "net_60": {"label": "Net 60", "days": 60},
    "net_90": {"label": "Net 90", "days": 90},
    "custom": {"label": "Custom", "days": 0},
}


# ============================================================================
# Engine Functions
# ============================================================================

def get_options() -> Dict[str, Any]:
    """Return all available invoice options."""
    return {
        "currencies": [
            {"key": k, "symbol": v["symbol"], "name": v["name"]}
            for k, v in CURRENCIES.items()
        ],
        "tax_rates": [
            {"key": k, "label": v["label"], "rate": v["rate"], "type": v["type"]}
            for k, v in TAX_RATES.items()
        ],
        "templates": [
            {"key": k, "label": v["label"], "description": v["description"], "accent_color": v["accent_color"]}
            for k, v in INVOICE_TEMPLATES.items()
        ],
        "payment_terms": [
            {"key": k, "label": v["label"], "days": v["days"]}
            for k, v in PAYMENT_TERMS.items()
        ],
    }


def generate_invoice(
    # Sender info
    sender_name: str,
    sender_email: str = "",
    sender_address: str = "",
    sender_phone: str = "",
    sender_website: str = "",
    sender_tax_id: str = "",
    # Recipient info
    recipient_name: str = "",
    recipient_email: str = "",
    recipient_address: str = "",
    recipient_phone: str = "",
    # Invoice details
    invoice_number: str = "",
    issue_date: str = "",
    payment_terms: str = "net_30",
    custom_due_date: str = "",
    currency: str = "USD",
    # Line items  
    items: List[Dict[str, Any]] = None,
    # Tax & discount
    tax_preset: str = "none",
    custom_tax_rate: float = 0.0,
    discount_type: str = "none",  # none, percentage, fixed
    discount_value: float = 0.0,
    # Notes
    notes: str = "",
    terms_conditions: str = "",
    # Template
    template: str = "professional",
) -> Dict[str, Any]:
    """Generate a complete invoice with all calculations."""

    if not items:
        items = []

    # Generate invoice number if not provided
    if not invoice_number:
        ts = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
        hash_input = f"{sender_name}{ts}"
        short_hash = hashlib.md5(hash_input.encode()).hexdigest()[:6].upper()
        invoice_number = f"INV-{short_hash}"

    # Parse dates
    if not issue_date:
        issue_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Calculate due date
    term_info = PAYMENT_TERMS.get(payment_terms, PAYMENT_TERMS["net_30"])
    if custom_due_date:
        due_date = custom_due_date
    else:
        try:
            issue_dt = datetime.strptime(issue_date, "%Y-%m-%d")
            due_dt = issue_dt + timedelta(days=term_info["days"])
            due_date = due_dt.strftime("%Y-%m-%d")
        except ValueError:
            due_date = issue_date

    # Currency info
    curr_info = CURRENCIES.get(currency, CURRENCIES["USD"])

    # Calculate line items
    calculated_items = []
    subtotal = 0.0
    total_hours = 0.0

    for idx, item in enumerate(items):
        qty = float(item.get("quantity", 1))
        rate = float(item.get("rate", 0))
        item_total = round(qty * rate, curr_info["decimal_places"])
        subtotal += item_total

        if item.get("unit", "").lower() in ("hours", "hour", "hrs", "hr"):
            total_hours += qty

        calculated_items.append({
            "index": idx + 1,
            "description": item.get("description", ""),
            "quantity": qty,
            "unit": item.get("unit", "units"),
            "rate": rate,
            "total": item_total,
        })

    # Discount
    discount_amount = 0.0
    discount_label = ""
    if discount_type == "percentage" and discount_value > 0:
        discount_amount = round(subtotal * (discount_value / 100), curr_info["decimal_places"])
        discount_label = f"{discount_value}% discount"
    elif discount_type == "fixed" and discount_value > 0:
        discount_amount = round(min(discount_value, subtotal), curr_info["decimal_places"])
        discount_label = "Fixed discount"

    taxable_amount = subtotal - discount_amount

    # Tax
    tax_info = TAX_RATES.get(tax_preset, TAX_RATES["none"])
    tax_rate = custom_tax_rate if tax_preset == "custom" else tax_info["rate"]
    tax_amount = round(taxable_amount * (tax_rate / 100), curr_info["decimal_places"])
    tax_label = tax_info["label"] if tax_preset != "custom" else f"Tax ({custom_tax_rate}%)"

    # Grand total
    grand_total = round(taxable_amount + tax_amount, curr_info["decimal_places"])

    # Amount in words
    amount_words = _number_to_words(grand_total, currency)

    # Build template info
    template_info = INVOICE_TEMPLATES.get(template, INVOICE_TEMPLATES["professional"])

    # Summary stats
    item_count = len(calculated_items)
    avg_item_value = round(subtotal / item_count, 2) if item_count > 0 else 0

    return {
        "invoice": {
            "number": invoice_number,
            "issue_date": issue_date,
            "due_date": due_date,
            "payment_terms": term_info["label"],
            "status": "draft",
        },
        "sender": {
            "name": sender_name,
            "email": sender_email,
            "address": sender_address,
            "phone": sender_phone,
            "website": sender_website,
            "tax_id": sender_tax_id,
        },
        "recipient": {
            "name": recipient_name,
            "email": recipient_email,
            "address": recipient_address,
            "phone": recipient_phone,
        },
        "items": calculated_items,
        "calculations": {
            "subtotal": round(subtotal, curr_info["decimal_places"]),
            "discount": {
                "type": discount_type,
                "value": discount_value,
                "amount": discount_amount,
                "label": discount_label,
            },
            "taxable_amount": round(taxable_amount, curr_info["decimal_places"]),
            "tax": {
                "preset": tax_preset,
                "rate": tax_rate,
                "amount": tax_amount,
                "label": tax_label,
                "type": tax_info["type"],
            },
            "grand_total": grand_total,
            "amount_in_words": amount_words,
        },
        "currency": {
            "code": currency,
            "symbol": curr_info["symbol"],
            "name": curr_info["name"],
            "decimal_places": curr_info["decimal_places"],
            "position": curr_info["position"],
        },
        "template": {
            "key": template,
            "label": template_info["label"],
            "accent_color": template_info["accent_color"],
        },
        "notes": notes,
        "terms_conditions": terms_conditions,
        "summary": {
            "item_count": item_count,
            "total_hours": round(total_hours, 2) if total_hours > 0 else None,
            "avg_item_value": avg_item_value,
            "effective_tax_rate": round(tax_rate, 2),
            "discount_savings": discount_amount,
        },
        "meta": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "generator": "MegiLance Invoice Generator",
            "version": "1.0",
        },
    }


def _number_to_words(amount: float, currency: str) -> str:
    """Convert amount to words for invoice display."""
    ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
            "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
            "Seventeen", "Eighteen", "Nineteen"]
    tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

    def _convert_chunk(n: int) -> str:
        if n == 0:
            return ""
        if n < 20:
            return ones[n]
        if n < 100:
            return tens[n // 10] + (" " + ones[n % 10] if n % 10 else "")
        return ones[n // 100] + " Hundred" + (" " + _convert_chunk(n % 100) if n % 100 else "")

    whole = int(amount)
    cents = round((amount - whole) * 100)

    if whole == 0:
        result = "Zero"
    else:
        parts = []
        if whole >= 1_000_000:
            parts.append(_convert_chunk(whole // 1_000_000) + " Million")
            whole %= 1_000_000
        if whole >= 1000:
            parts.append(_convert_chunk(whole // 1000) + " Thousand")
            whole %= 1000
        if whole > 0:
            parts.append(_convert_chunk(whole))
        result = " ".join(parts)

    curr_name = CURRENCIES.get(currency, {}).get("name", currency)
    if cents > 0:
        result += f" and {cents}/100"
    result += f" {curr_name}"
    return result
