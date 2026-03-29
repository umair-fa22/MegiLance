# @AI-HINT: Pakistan-friendly payment endpoints - USDC, AirTM, JazzCash, EasyPaisa, Wise
"""
Pakistan Payment API Endpoints

Since Stripe is NOT available in Pakistan, these endpoints provide alternatives:
- USDC on Polygon (lowest fees, recommended)
- JazzCash / EasyPaisa (local mobile wallets)
- AirTM (P2P exchange)
- Wise / Payoneer (international transfers)
"""

from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.security import get_current_active_user
from app.models.user import User
from app.services.pakistan_payments import (
    get_pakistan_payment_service,
    PakistanPaymentProvider,
    PaymentRequest,
    NetworkMode,
)

router = APIRouter()


# ============================================================================
# Network/Testnet Status (Important for FREE testing!)
# ============================================================================

@router.get("/network-status")
def get_network_status():
    """
    Get current network status - Testnet (FREE) or Mainnet (Real money).
    
    In testnet mode, all crypto transactions are FREE for testing!
    """
    is_testnet = NetworkMode.USE_TESTNET
    polygon_config = NetworkMode.get_polygon_config()
    
    return {
        "mode": "testnet" if is_testnet else "mainnet",
        "is_testnet": is_testnet,
        "free_testing": is_testnet,
        "polygon": {
            "network_name": polygon_config["name"],
            "chain_id": polygon_config["chain_id"],
            "rpc_url": polygon_config["rpc_url"],
            "explorer": polygon_config["explorer"],
            "usdc_contract": polygon_config["usdc_address"],
            "faucet": polygon_config.get("faucet", None)
        },
        "instructions": {
            "testnet": """
🆓 FREE TESTING MODE!

To test payments for FREE:
1. Install MetaMask: https://metamask.io
2. Add Polygon Amoy Testnet (Chain ID: 80002)
3. Get FREE test tokens from faucet
4. Make test transactions - costs nothing!

Faucet: https://faucet.polygon.technology/
""" if is_testnet else """
⚠️ PRODUCTION MODE - Real money transactions!

All payments will use real USDC on Polygon Mainnet.
Make sure you have sufficient funds before proceeding.
"""
        }
    }


@router.get("/testnet-setup")
def get_testnet_setup_guide():
    """
    Get step-by-step guide to set up FREE testnet for development.
    """
    return {
        "title": "🆓 Free Testnet Setup Guide",
        "total_cost": "$0.00",
        "time_required": "5-10 minutes",
        "steps": [
            {
                "step": 1,
                "title": "Install MetaMask",
                "action": "Download from https://metamask.io/download/",
                "details": "Browser extension for Chrome, Firefox, Edge, or Brave"
            },
            {
                "step": 2,
                "title": "Create Wallet",
                "action": "Follow MetaMask setup wizard",
                "details": "Save your 12-word seed phrase securely!"
            },
            {
                "step": 3,
                "title": "Add Polygon Amoy Testnet",
                "action": "Add custom network in MetaMask",
                "details": {
                    "network_name": "Polygon Amoy Testnet",
                    "rpc_url": "https://rpc-amoy.polygon.technology/",
                    "chain_id": 80002,
                    "currency_symbol": "MATIC",
                    "block_explorer": "https://amoy.polygonscan.com"
                }
            },
            {
                "step": 4,
                "title": "Get FREE Test MATIC",
                "action": "Visit https://faucet.polygon.technology/",
                "details": "Enter your wallet address, select Amoy, receive free MATIC"
            },
            {
                "step": 5,
                "title": "Get FREE Test USDC",
                "action": "Use testnet USDC faucet or swap MATIC",
                "details": "Test USDC contract: 0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582"
            },
            {
                "step": 6,
                "title": "Start Testing!",
                "action": "Make test payments through MegiLance",
                "details": "All transactions are FREE on testnet!"
            }
        ],
        "important_notes": [
            "🆓 Testnet tokens have NO real value",
            "✅ Perfect for development and integration testing",
            "🔄 Same code works for mainnet - just change network",
            "📝 Test transactions appear on testnet block explorer"
        ]
    }


# ============================================================================
# Request/Response Models
# ============================================================================

class ProviderListResponse(BaseModel):
    """List of available payment providers"""
    providers: List[dict]
    default_provider: str = "usdc_polygon"
    country: str = "PK"


class WalletConnectRequest(BaseModel):
    """Request to connect crypto wallet"""
    wallet_address: str = Field(..., min_length=42, max_length=42, pattern="^0x[a-fA-F0-9]{40}$")
    network: str = Field(default="polygon", pattern="^(polygon|ethereum|bsc)$")
    signature: Optional[str] = None  # Optional signature for verification


class WalletResponse(BaseModel):
    """Wallet connection response"""
    wallet_address: str
    network: str
    is_verified: bool
    connected_at: str


class CreatePaymentRequest(BaseModel):
    """Create a new payment"""
    amount: Decimal = Field(..., gt=0, le=10000)
    provider: str  # Will be converted to PakistanPaymentProvider
    recipient_id: Optional[int] = None
    contract_id: Optional[int] = None
    description: Optional[str] = None
    # Provider-specific fields
    wallet_address: Optional[str] = None  # For crypto
    mobile_number: Optional[str] = None  # For JazzCash/EasyPaisa


class FeeCalculationRequest(BaseModel):
    """Request to calculate fees"""
    amount: Decimal = Field(..., gt=0)
    provider: str


class FeeCalculationResponse(BaseModel):
    """Fee calculation result"""
    amount: Decimal
    fee_percent: Decimal
    fee_fixed: Decimal
    total_fee: Decimal
    net_amount: Decimal
    provider: str
    estimated_time: str


class VerifyTransactionRequest(BaseModel):
    """Request to verify a blockchain transaction"""
    transaction_id: str
    tx_hash: str = Field(..., min_length=66, max_length=66, pattern="^0x[a-fA-F0-9]{64}$")


# ============================================================================
# Provider Endpoints
# ============================================================================

@router.get("/providers", response_model=ProviderListResponse)
def list_payment_providers(
    country: str = "PK",
    current_user: User = Depends(get_current_active_user)
):
    """
    List available payment providers for Pakistan.
    
    Returns all payment methods that work in Pakistan including:
    - USDC on Polygon (recommended - lowest fees)
    - JazzCash / EasyPaisa (local mobile wallets)
    - AirTM (P2P exchange)
    - Wise / Payoneer (international)
    """
    service = get_pakistan_payment_service()
    providers = service.get_available_providers(country)
    
    return ProviderListResponse(
        providers=[
            {
                "id": p.provider.value,
                "name": p.display_name,
                "icon": p.icon,
                "fee_percent": float(p.fee_percent),
                "fee_fixed": float(p.fee_fixed_usd),
                "min_amount": float(p.min_amount_usd),
                "max_amount": float(p.max_amount_usd),
                "estimated_time": p.estimated_time,
                "requires_verification": p.requires_verification,
                "instructions": p.instructions,
                "recommended": p.provider == PakistanPaymentProvider.USDC_POLYGON
            }
            for p in providers
        ],
        default_provider="usdc_polygon",
        country=country
    )


@router.get("/providers/{provider_id}")
def get_provider_details(
    provider_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get detailed information about a specific payment provider."""
    try:
        provider = PakistanPaymentProvider(provider_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider '{provider_id}' not found"
        )
    
    service = get_pakistan_payment_service()
    config = service.get_provider_config(provider)
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provider configuration not found"
        )
    
    return {
        "id": config.provider.value,
        "name": config.display_name,
        "icon": config.icon,
        "enabled": config.enabled,
        "fee_percent": float(config.fee_percent),
        "fee_fixed": float(config.fee_fixed_usd),
        "min_amount": float(config.min_amount_usd),
        "max_amount": float(config.max_amount_usd),
        "estimated_time": config.estimated_time,
        "requires_verification": config.requires_verification,
        "instructions": config.instructions,
        "countries": config.countries
    }


# ============================================================================
# Fee Calculation
# ============================================================================

@router.post("/calculate-fee", response_model=FeeCalculationResponse)
def calculate_payment_fee(
    request: FeeCalculationRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Calculate fees for a payment amount and provider.
    
    Returns breakdown of:
    - Percentage fee
    - Fixed fee
    - Total fee
    - Net amount (what recipient gets)
    """
    try:
        provider = PakistanPaymentProvider(request.provider)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid provider: {request.provider}"
        )
    
    service = get_pakistan_payment_service()
    config = service.get_provider_config(provider)
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provider not available"
        )
    
    fees = service.calculate_fee(request.amount, provider)
    
    return FeeCalculationResponse(
        amount=request.amount,
        fee_percent=fees["fee_percent"],
        fee_fixed=fees["fee_fixed"],
        total_fee=fees["total_fee"],
        net_amount=fees["net_amount"],
        provider=request.provider,
        estimated_time=config.estimated_time
    )


# ============================================================================
# Wallet Management
# ============================================================================

@router.post("/wallet/connect", response_model=WalletResponse)
async def connect_wallet(
    request: WalletConnectRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Connect a crypto wallet (MetaMask, etc.) to user account.
    
    Supports networks:
    - polygon (recommended - lowest fees)
    - ethereum
    - bsc (Binance Smart Chain)
    """
    service = get_pakistan_payment_service()
    
    try:
        connection = await service.connect_wallet(
            user_id=current_user.id,
            wallet_address=request.wallet_address,
            network=request.network,
            signature=request.signature
        )
        
        return WalletResponse(
            wallet_address=connection.wallet_address,
            network=connection.network,
            is_verified=connection.is_verified,
            connected_at=connection.connected_at.isoformat()
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/wallet")
async def get_connected_wallet(
    current_user: User = Depends(get_current_active_user)
):
    """Get user's connected crypto wallet."""
    service = get_pakistan_payment_service()
    wallet = await service.get_wallet(current_user.id)
    
    if not wallet:
        return {"connected": False, "wallet": None}
    
    return {
        "connected": True,
        "wallet": {
            "wallet_address": wallet.wallet_address,
            "network": wallet.network,
            "is_verified": wallet.is_verified,
            "connected_at": wallet.connected_at.isoformat()
        }
    }


@router.delete("/wallet/disconnect")
async def disconnect_wallet(
    current_user: User = Depends(get_current_active_user)
):
    """Disconnect crypto wallet from user account."""
    service = get_pakistan_payment_service()
    success = await service.disconnect_wallet(current_user.id)
    
    return {
        "success": success,
        "message": "Wallet disconnected" if success else "No wallet connected"
    }


# ============================================================================
# Payment Processing
# ============================================================================

@router.post("/create")
async def create_payment(
    request: CreatePaymentRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new payment using Pakistan-friendly providers.
    
    Supported providers:
    - usdc_polygon (recommended)
    - usdc_ethereum
    - airtm
    - jazzcash
    - easypaisa
    - wise
    - payoneer
    """
    try:
        provider = PakistanPaymentProvider(request.provider)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid provider: {request.provider}. Available: {[p.value for p in PakistanPaymentProvider]}"
        )
    
    service = get_pakistan_payment_service()
    
    payment_request = PaymentRequest(
        user_id=current_user.id,
        recipient_id=request.recipient_id,
        amount=request.amount,
        provider=provider,
        wallet_address=request.wallet_address,
        mobile_number=request.mobile_number,
        description=request.description,
        contract_id=request.contract_id
    )
    
    response = await service.process_payment(payment_request)
    
    if not response.success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=response.message
        )
    
    return {
        "success": response.success,
        "transaction_id": response.transaction_id,
        "status": response.status,
        "provider": response.provider,
        "amount": float(response.amount),
        "fee": float(response.fee),
        "net_amount": float(response.net_amount),
        "message": response.message,
        "instructions": response.instructions,
        "redirect_url": response.redirect_url,
        "tx_hash": response.tx_hash,
        "block_explorer_url": response.block_explorer_url
    }


@router.post("/verify")
async def verify_payment(
    request: VerifyTransactionRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Verify a blockchain transaction (USDC payments).
    
    Provide the transaction ID from create_payment and the blockchain tx_hash.
    """
    service = get_pakistan_payment_service()
    
    try:
        response = await service.verify_usdc_transaction(
            request.transaction_id,
            request.tx_hash
        )
        
        return {
            "success": response.success,
            "status": response.status,
            "transaction_id": response.transaction_id,
            "tx_hash": response.tx_hash,
            "block_explorer_url": response.block_explorer_url,
            "message": response.message
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/status/{transaction_id}")
async def get_payment_status(
    transaction_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get the status of a payment transaction."""
    service = get_pakistan_payment_service()
    result = await service.get_transaction_status(transaction_id)
    
    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result["error"]
        )
    
    return result


# ============================================================================
# Exchange Rate
# ============================================================================

@router.get("/exchange-rate")
def get_exchange_rate(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current USD to PKR exchange rate.
    
    Used for JazzCash, EasyPaisa, and bank transfer conversions.
    """
    service = get_pakistan_payment_service()
    
    return {
        "from": "USD",
        "to": "PKR",
        "rate": float(service.pkr_usd_rate),
        "updated_at": "2024-12-07T00:00:00Z",  # Would be real-time in production
        "source": "market_rate"
    }


@router.post("/convert")
def convert_currency(
    amount: float,
    from_currency: str = "USD",
    to_currency: str = "PKR",
    current_user: User = Depends(get_current_active_user)
):
    """
    Convert between USD and PKR.
    """
    service = get_pakistan_payment_service()
    
    if from_currency == "USD" and to_currency == "PKR":
        converted = service.usd_to_pkr(Decimal(str(amount)))
    elif from_currency == "PKR" and to_currency == "USD":
        converted = service.pkr_to_usd(Decimal(str(amount)))
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only USD/PKR conversion is supported"
        )
    
    return {
        "from": from_currency,
        "to": to_currency,
        "amount": amount,
        "converted": float(converted),
        "rate": float(service.pkr_usd_rate)
    }
