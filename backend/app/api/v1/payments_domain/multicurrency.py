# @AI-HINT: Multi-currency payment API endpoints for 150+ currencies and crypto

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List
from pydantic import BaseModel, Field
from decimal import Decimal

from app.core.security import get_current_user
from app.services.multicurrency_payments import get_multicurrency_service, MultiCurrencyPaymentService
from app.models.user import User

router = APIRouter()


# Request/Response Schemas
class CurrencyInfo(BaseModel):
    code: str
    name: str
    symbol: str
    is_crypto: bool = False


class ExchangeRateResponse(BaseModel):
    from_currency: str
    to_currency: str
    rate: float
    timestamp: str


class ConversionRequest(BaseModel):
    amount: Decimal = Field(..., gt=0)
    from_currency: str = Field(..., min_length=3, max_length=10)
    to_currency: str = Field(..., min_length=3, max_length=10)


class ConversionResponse(BaseModel):
    original_amount: Decimal
    converted_amount: Decimal
    from_currency: str
    to_currency: str
    exchange_rate: float
    timestamp: str


class PaymentRequest(BaseModel):
    amount: Decimal = Field(..., gt=0)
    currency: str = Field(..., min_length=3, max_length=10)
    recipient_id: str
    description: str | None = None


class CryptoPaymentRequest(BaseModel):
    amount: Decimal = Field(..., gt=0)
    cryptocurrency: str = Field(..., description="BTC, ETH, USDC, USDT, BNB, SOL, MATIC")
    wallet_address: str = Field(..., min_length=20)
    network: str | None = Field(None, description="ethereum, polygon, bitcoin, solana")


class PaymentResponse(BaseModel):
    payment_id: str
    amount: Decimal
    currency: str
    status: str
    created_at: str


# Currency Listing
@router.get("/currencies", response_model=List[CurrencyInfo])
async def list_currencies(
    currency_service: MultiCurrencyPaymentService = Depends(get_multicurrency_service)
):
    """List all supported fiat currencies (150+)."""
    try:
        currencies = await currency_service.get_supported_currencies()
        return [CurrencyInfo(**curr) for curr in currencies]
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch currencies")


@router.get("/cryptocurrencies", response_model=List[CurrencyInfo])
async def list_cryptocurrencies(
    currency_service: MultiCurrencyPaymentService = Depends(get_multicurrency_service)
):
    """List supported cryptocurrencies (BTC, ETH, USDC, USDT, BNB, SOL, MATIC)."""
    try:
        cryptos = await currency_service.get_supported_cryptocurrencies()
        return [CurrencyInfo(**crypto) for crypto in cryptos]
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch cryptocurrencies")


# Exchange Rates
@router.get("/exchange-rate/{from_currency}/{to_currency}", response_model=ExchangeRateResponse)
async def get_exchange_rate(
    from_currency: str,
    to_currency: str,
    currency_service: MultiCurrencyPaymentService = Depends(get_multicurrency_service)
):
    """Get real-time exchange rate between two currencies."""
    try:
        rate_data = await currency_service.get_exchange_rate(
            from_currency=from_currency.upper(),
            to_currency=to_currency.upper()
        )
        return ExchangeRateResponse(**rate_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Internal server error")
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch exchange rate")


# Currency Conversion
@router.post("/convert", response_model=ConversionResponse)
async def convert_currency(
    request: ConversionRequest,
    currency_service: MultiCurrencyPaymentService = Depends(get_multicurrency_service)
):
    """Convert amount between any two supported currencies."""
    try:
        conversion = await currency_service.convert_currency(
            amount=float(request.amount),
            from_currency=request.from_currency.upper(),
            to_currency=request.to_currency.upper()
        )
        return ConversionResponse(**conversion)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Internal server error")
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Currency conversion failed")


# Payments
@router.post("/payments", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(
    request: PaymentRequest,
    current_user: User = Depends(get_current_user),
    currency_service: MultiCurrencyPaymentService = Depends(get_multicurrency_service)
):
    """Create a payment in any supported currency."""
    try:
        payment = await currency_service.create_payment(
            amount=float(request.amount),
            currency=request.currency.upper(),
            sender_id=str(current_user.id),
            recipient_id=request.recipient_id,
            description=request.description
        )
        return PaymentResponse(**payment)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Internal server error")
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Payment creation failed")


@router.post("/crypto-payment", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_crypto_payment(
    request: CryptoPaymentRequest,
    current_user: User = Depends(get_current_user),
    currency_service: MultiCurrencyPaymentService = Depends(get_multicurrency_service)
):
    """
    Create a cryptocurrency payment.
    
    Supported cryptocurrencies:
    - BTC (Bitcoin)
    - ETH (Ethereum)
    - USDC (USD Coin)
    - USDT (Tether)
    - BNB (Binance Coin)
    - SOL (Solana)
    - MATIC (Polygon)
    """
    try:
        payment = await currency_service.create_crypto_payment(
            amount=float(request.amount),
            cryptocurrency=request.cryptocurrency.upper(),
            wallet_address=request.wallet_address,
            network=request.network,
            sender_id=str(current_user.id)
        )
        return PaymentResponse(**payment)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Internal server error")
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Crypto payment creation failed")


# Price Suggestions
@router.get("/price-suggestion")
async def get_price_suggestion(
    project_type: str,
    skill_level: str = Query(..., pattern="^(beginner|intermediate|expert)$"),
    currency: str = "USD",
    current_user: User = Depends(get_current_user),
    currency_service: MultiCurrencyPaymentService = Depends(get_multicurrency_service)
):
    """Get AI-powered price suggestion for a project."""
    try:
        suggestion = await currency_service.get_price_suggestion(
            project_type=project_type,
            skill_level=skill_level,
            currency=currency.upper()
        )
        return suggestion
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Price suggestion failed")


# Payment History
@router.get("/payments/history")
async def get_payment_history(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    currency_service: MultiCurrencyPaymentService = Depends(get_multicurrency_service)
):
    """Get payment history for current user."""
    try:
        history = await currency_service.get_payment_history(
            user_id=str(current_user.id),
            limit=limit,
            offset=offset
        )
        return {"payments": history, "total": len(history)}
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch payment history")


# Instant Payout
@router.post("/payout")
async def request_payout(
    amount: Decimal = Query(..., gt=0),
    currency: str = Query(..., min_length=3, max_length=10),
    current_user: User = Depends(get_current_user),
    currency_service: MultiCurrencyPaymentService = Depends(get_multicurrency_service)
):
    """Request instant payout to linked bank account or wallet."""
    try:
        payout = await currency_service.request_payout(
            user_id=str(current_user.id),
            amount=float(amount),
            currency=currency.upper()
        )
        return payout
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Internal server error")
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Payout request failed")
