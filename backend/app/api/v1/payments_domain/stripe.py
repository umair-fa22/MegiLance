# @AI-HINT: Stripe payment API endpoints for payment processing, refunds, and webhooks - Turso HTTP only
# Handles payment intents, customer management, subscriptions, and Stripe webhook events

from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
import logging

# Lazy import stripe to avoid typing issues with Python 3.12
stripe = None

def get_stripe():
    global stripe
    if stripe is None:
        import stripe as _stripe
        stripe = _stripe
    return stripe

from app.core.security import get_current_active_user
from app.core.rate_limit import api_rate_limit

logger = logging.getLogger(__name__)
from app.schemas.stripe_schemas import (
    StripeCustomerCreate,
    StripeCustomerResponse,
    PaymentIntentCreate,
    PaymentIntentResponse,
    PaymentIntentConfirm,
    PaymentIntentCapture,
    RefundCreate,
    RefundResponse,
    PaymentMethodAttach,
    PaymentMethodResponse,
    SubscriptionCreate,
    SubscriptionResponse,
    WebhookResponse,
)
from app.services.stripe_service import stripe_service
from app.core.config import get_settings


router = APIRouter()


# ===== Customer Management =====

@router.post("/customers", response_model=StripeCustomerResponse, status_code=status.HTTP_201_CREATED)
@api_rate_limit()
def create_stripe_customer(
    request: Request,
    payload: StripeCustomerCreate,
    current_user = Depends(get_current_active_user),
):
    """
    Create a Stripe customer
    
    Creates a customer in Stripe for the current user.
    Customer ID should be stored in user profile for future payments.
    """
    try:
        # Add user_id to metadata
        metadata = payload.metadata or {}
        metadata["user_id"] = str(current_user['id'])
        
        customer = stripe_service.create_customer(
            email=payload.email,
            name=payload.name,
            metadata=metadata
        )
        
        return StripeCustomerResponse(
            id=customer.id,
            email=customer.email,
            name=customer.name,
            created=customer.created
        )
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/customers/{customer_id}", response_model=StripeCustomerResponse)
@api_rate_limit()
def get_stripe_customer(
    request: Request,
    customer_id: str,
    current_user = Depends(get_current_active_user),
):
    """Get Stripe customer details"""
    try:
        customer = stripe_service.get_customer(customer_id)
        
        # Verify ownership
        if customer.metadata.get("user_id") != str(current_user['id']):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
        return StripeCustomerResponse(
            id=customer.id,
            email=customer.email,
            name=customer.name,
            created=customer.created
        )
    except HTTPException:
        raise
    except stripe.error.StripeError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )


# ===== Payment Intent Management =====

@router.post("/payment-intents", response_model=PaymentIntentResponse, status_code=status.HTTP_201_CREATED)
@api_rate_limit()
def create_payment_intent(
    request: Request,
    payload: PaymentIntentCreate,
    current_user = Depends(get_current_active_user),
):
    """
    Create a payment intent
    
    Creates a Stripe payment intent for processing payments.
    Use capture_method='manual' for escrow (held funds).
    """
    try:
        # Add user_id to metadata
        metadata = payload.metadata or {}
        metadata["user_id"] = str(current_user['id'])
        
        payment_intent = stripe_service.create_payment_intent(
            amount=payload.amount,
            currency=payload.currency,
            customer_id=payload.customer_id,
            payment_method=payload.payment_method,
            description=payload.description,
            metadata=metadata,
            capture_method=payload.capture_method,
        )
        
        return PaymentIntentResponse(
            id=payment_intent.id,
            amount=payment_intent.amount,
            currency=payment_intent.currency,
            status=payment_intent.status,
            client_secret=payment_intent.client_secret
        )
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/payment-intents/{payment_intent_id}", response_model=PaymentIntentResponse)
@api_rate_limit()
def get_payment_intent(
    request: Request,
    payment_intent_id: str,
    current_user = Depends(get_current_active_user),
):
    """Get payment intent details"""
    try:
        payment_intent = stripe_service.get_payment_intent(payment_intent_id)
        
        # Verify ownership
        if payment_intent.metadata.get("user_id") != str(current_user['id']):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
        return PaymentIntentResponse(
            id=payment_intent.id,
            amount=payment_intent.amount,
            currency=payment_intent.currency,
            status=payment_intent.status,
            client_secret=payment_intent.client_secret
        )
    except HTTPException:
        raise
    except stripe.error.StripeError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment intent not found"
        )


@router.post("/payment-intents/{payment_intent_id}/confirm", response_model=PaymentIntentResponse)
@api_rate_limit()
def confirm_payment_intent(
    request: Request,
    payment_intent_id: str,
    payload: PaymentIntentConfirm,
    current_user = Depends(get_current_active_user),
):
    """Confirm a payment intent"""
    try:
        payment_intent = stripe_service.confirm_payment_intent(
            payment_intent_id,
            payment_method=payload.payment_method
        )
        
        return PaymentIntentResponse(
            id=payment_intent.id,
            amount=payment_intent.amount,
            currency=payment_intent.currency,
            status=payment_intent.status,
            client_secret=payment_intent.client_secret
        )
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/payment-intents/{payment_intent_id}/capture", response_model=PaymentIntentResponse)
@api_rate_limit()
def capture_payment_intent(
    request: Request,
    payment_intent_id: str,
    payload: PaymentIntentCapture,
    current_user = Depends(get_current_active_user),
):
    """
    Capture a payment intent (release escrow)
    
    Used for manual capture payments (escrow).
    Call this when work is approved to release funds to freelancer.
    """
    try:
        amount_cents = None
        if payload.amount_to_capture is not None:
            amount_cents = int(payload.amount_to_capture * 100)
        
        payment_intent = stripe_service.capture_payment_intent(
            payment_intent_id,
            amount_to_capture=amount_cents
        )
        
        return PaymentIntentResponse(
            id=payment_intent.id,
            amount=payment_intent.amount,
            currency=payment_intent.currency,
            status=payment_intent.status,
            client_secret=payment_intent.client_secret
        )
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/payment-intents/{payment_intent_id}/cancel", response_model=PaymentIntentResponse)
@api_rate_limit()
def cancel_payment_intent(
    request: Request,
    payment_intent_id: str,
    current_user = Depends(get_current_active_user),
):
    """Cancel a payment intent"""
    try:
        payment_intent = stripe_service.cancel_payment_intent(payment_intent_id)
        
        return PaymentIntentResponse(
            id=payment_intent.id,
            amount=payment_intent.amount,
            currency=payment_intent.currency,
            status=payment_intent.status,
            client_secret=payment_intent.client_secret
        )
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ===== Refund Management =====

@router.post("/refunds", response_model=RefundResponse, status_code=status.HTTP_201_CREATED)
@api_rate_limit()
def create_refund(
    request: Request,
    payload: RefundCreate,
    current_user = Depends(get_current_active_user),
):
    """
    Create a refund
    
    Refunds a payment partially or fully.
    """
    try:
        metadata = payload.metadata or {}
        metadata["refunded_by"] = str(current_user['id'])
        
        refund = stripe_service.create_refund(
            payment_intent_id=payload.payment_intent_id,
            amount=payload.amount,
            reason=payload.reason,
            metadata=metadata
        )
        
        return RefundResponse(
            id=refund.id,
            amount=refund.amount,
            status=refund.status,
            reason=refund.reason
        )
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/refunds/{refund_id}", response_model=RefundResponse)
@api_rate_limit()
def get_refund(
    request: Request,
    refund_id: str,
    current_user = Depends(get_current_active_user),
):
    """Get refund details"""
    try:
        refund = stripe_service.get_refund(refund_id)
        
        # Verify ownership
        if refund.metadata.get("refunded_by") != str(current_user['id']):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
        return RefundResponse(
            id=refund.id,
            amount=refund.amount,
            status=refund.status,
            reason=refund.reason
        )
    except HTTPException:
        raise
    except stripe.error.StripeError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Refund not found"
        )


# ===== Payment Method Management =====

@router.post("/customers/{customer_id}/payment-methods", response_model=PaymentMethodResponse)
@api_rate_limit()
def attach_payment_method(
    request: Request,
    customer_id: str,
    payload: PaymentMethodAttach,
    current_user = Depends(get_current_active_user),
):
    """Attach a payment method to a customer"""
    try:
        payment_method = stripe_service.attach_payment_method(
            payload.payment_method_id,
            customer_id
        )
        
        return PaymentMethodResponse(
            id=payment_method.id,
            type=payment_method.type,
            card=payment_method.card if hasattr(payment_method, 'card') else None
        )
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ===== Subscription Management =====

@router.post("/subscriptions", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
@api_rate_limit()
def create_subscription(
    request: Request,
    payload: SubscriptionCreate,
    current_user = Depends(get_current_active_user),
):
    """Create a subscription for platform fees"""
    try:
        metadata = payload.metadata or {}
        metadata["user_id"] = str(current_user['id'])
        
        subscription = stripe_service.create_subscription(
            customer_id=payload.customer_id,
            price_id=payload.price_id,
            metadata=metadata,
            trial_period_days=payload.trial_period_days
        )
        
        return SubscriptionResponse(
            id=subscription.id,
            status=subscription.status,
            current_period_end=subscription.current_period_end,
            cancel_at_period_end=subscription.cancel_at_period_end
        )
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/subscriptions/{subscription_id}", response_model=SubscriptionResponse)
@api_rate_limit()
def cancel_subscription(
    request: Request,
    subscription_id: str,
    at_period_end: bool = True,
    current_user = Depends(get_current_active_user),
):
    """Cancel a subscription"""
    try:
        subscription = stripe_service.cancel_subscription(
            subscription_id,
            at_period_end=at_period_end
        )
        
        return SubscriptionResponse(
            id=subscription.id,
            status=subscription.status,
            current_period_end=subscription.current_period_end,
            cancel_at_period_end=subscription.cancel_at_period_end
        )
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ===== Webhook Handler =====

@router.post("/webhooks", response_model=WebhookResponse)
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(..., alias="stripe-signature"),
):
    """
    Handle Stripe webhook events
    
    This endpoint receives events from Stripe (payment success/failure, etc.)
    Webhook signing secret must be configured in settings.
    """
    settings = get_settings()
    webhook_secret = settings.STRIPE_WEBHOOK_SECRET
    
    if not webhook_secret:
        logger.error("Stripe webhook secret not configured")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Webhook secret not configured"
        )
    
    # Get raw body
    payload = await request.body()
    
    try:
        # Verify webhook signature
        event = stripe_service.construct_webhook_event(
            payload.decode(),
            stripe_signature,
            webhook_secret
        )
        
        # Handle the event - process directly with Turso
        event_type = event.get("type", "unknown")
        event_data = event.get("data", {}).get("object", {})
        
        # Log webhook event
        logger.info(f"[STRIPE WEBHOOK] Received event: {event_type}")
        
        # Handle specific events
        if event_type == "payment_intent.succeeded":
            payment_intent_id = event_data.get("id")
            amount = event_data.get("amount", 0) / 100.0  # Convert cents to dollars
            metadata = event_data.get("metadata", {})
            
            # Update payment record if exists
            if metadata.get("payment_id"):
                payment_id = int(metadata["payment_id"])
                stripe_service.update_payment_status_turso(payment_id, "completed")
                logger.info(f"[STRIPE WEBHOOK] Payment {payment_id} marked as completed")
                
                # Send notification to user
                if metadata.get("user_id"):
                    user_id = int(metadata["user_id"])
                    stripe_service.create_payment_notification_turso(
                        user_id=user_id,
                        notification_type='PAYMENT_RECEIVED',
                        title='Payment Successful',
                        content=f'Your payment of ${amount:.2f} was successful.',
                        data={'payment_id': payment_id, 'amount': amount, 'stripe_id': payment_intent_id}
                    )
        
        elif event_type == "payment_intent.payment_failed":
            payment_intent_id = event_data.get("id")
            metadata = event_data.get("metadata", {})
            
            if metadata.get("payment_id"):
                payment_id = int(metadata["payment_id"])
                stripe_service.update_payment_status_turso(payment_id, "failed")
                logger.warning(f"[STRIPE WEBHOOK] Payment {payment_id} marked as failed")
                
                # Send notification
                if metadata.get("user_id"):
                    user_id = int(metadata["user_id"])
                    stripe_service.create_payment_notification_turso(
                        user_id=user_id,
                        notification_type='PAYMENT_FAILED',
                        title='Payment Failed',
                        content='Your payment failed. Please check your payment method.',
                        data={'payment_id': payment_id, 'stripe_id': payment_intent_id}
                    )
        
        elif event_type == "charge.refunded":
            refund_id = event_data.get("id")
            metadata = event_data.get("metadata", {})
            
            if metadata.get("refund_id"):
                db_refund_id = int(metadata["refund_id"])
                stripe_service.complete_refund_turso(db_refund_id)
                logger.info(f"[STRIPE WEBHOOK] Refund {db_refund_id} completed")
        
        return WebhookResponse(
            status="success",
            event_type=event_type,
            message=f"Webhook processed: {event_type}"
        )
    
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid Stripe signature: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid signature"
        )
    except Exception as e:
        logger.error(f"Webhook processing error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Webhook processing error"
        )
