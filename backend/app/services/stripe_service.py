# @AI-HINT: Stripe payment service for handling payment intents, customers, subscriptions, and webhooks
# Manages all Stripe operations including payment processing, refunds, and platform fees

import stripe
import json
import logging
from typing import Optional, Dict, Any, List
from decimal import Decimal
from datetime import datetime, timezone

from ..core.config import get_settings
from ..db.turso_http import execute_query, parse_rows

logger = logging.getLogger(__name__)


class StripeService:
    """Service for handling Stripe payment operations"""
    
    def __init__(self):
        settings = get_settings()
        self.stripe_secret_key = settings.STRIPE_SECRET_KEY
        self.platform_fee_percent = settings.STRIPE_PLATFORM_FEE_PERCENT
        
        if self.stripe_secret_key:
            stripe.api_key = self.stripe_secret_key
    
    # ===== Customer Management =====
    
    def create_customer(
        self, 
        email: str, 
        name: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None
    ) -> stripe.Customer:
        """
        Create a Stripe customer
        
        Args:
            email: Customer email
            name: Customer name
            metadata: Additional metadata (e.g., user_id)
        
        Returns:
            stripe.Customer: Created customer object
        """
        customer_data = {
            "email": email,
            "name": name or email.split("@")[0],
            "metadata": metadata or {}
        }
        
        return stripe.Customer.create(**customer_data)
    
    def get_customer(self, customer_id: str) -> stripe.Customer:
        """Get a Stripe customer by ID"""
        return stripe.Customer.retrieve(customer_id)
    
    def update_customer(
        self, 
        customer_id: str, 
        **kwargs
    ) -> stripe.Customer:
        """Update a Stripe customer"""
        return stripe.Customer.modify(customer_id, **kwargs)
    
    def delete_customer(self, customer_id: str) -> stripe.Customer:
        """Delete a Stripe customer"""
        return stripe.Customer.delete(customer_id)
    
    # ===== Payment Intent Management =====
    
    def create_payment_intent(
        self,
        amount: float,
        currency: str = "usd",
        customer_id: Optional[str] = None,
        payment_method: Optional[str] = None,
        description: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None,
        application_fee_amount: Optional[int] = None,
        capture_method: str = "automatic",
    ) -> stripe.PaymentIntent:
        """
        Create a payment intent
        
        Args:
            amount: Amount in dollars (will be converted to cents)
            currency: Currency code (default: usd)
            customer_id: Stripe customer ID
            payment_method: Payment method ID
            description: Payment description
            metadata: Additional metadata (e.g., project_id, milestone_id)
            application_fee_amount: Platform fee in cents
            capture_method: 'automatic' or 'manual' (for escrow)
        
        Returns:
            stripe.PaymentIntent: Created payment intent
        """
        # Convert dollars to cents
        amount_cents = int(amount * 100)
        
        # Calculate platform fee if not provided
        if application_fee_amount is None and self.platform_fee_percent > 0:
            application_fee_amount = int(amount_cents * (self.platform_fee_percent / 100))
        
        intent_data = {
            "amount": amount_cents,
            "currency": currency,
            "description": description,
            "metadata": metadata or {},
            "capture_method": capture_method,
        }
        
        if customer_id:
            intent_data["customer"] = customer_id
        
        if payment_method:
            intent_data["payment_method"] = payment_method
            intent_data["confirm"] = True  # Auto-confirm if payment method provided
        
        if application_fee_amount and application_fee_amount > 0:
            intent_data["application_fee_amount"] = application_fee_amount
        
        return stripe.PaymentIntent.create(**intent_data)
    
    def get_payment_intent(self, payment_intent_id: str) -> stripe.PaymentIntent:
        """Get a payment intent by ID"""
        return stripe.PaymentIntent.retrieve(payment_intent_id)
    
    def confirm_payment_intent(
        self, 
        payment_intent_id: str,
        payment_method: Optional[str] = None
    ) -> stripe.PaymentIntent:
        """Confirm a payment intent"""
        confirm_data = {}
        if payment_method:
            confirm_data["payment_method"] = payment_method
        
        return stripe.PaymentIntent.confirm(payment_intent_id, **confirm_data)
    
    def capture_payment_intent(
        self, 
        payment_intent_id: str,
        amount_to_capture: Optional[int] = None
    ) -> stripe.PaymentIntent:
        """
        Capture a payment intent (for manual capture/escrow)
        
        Args:
            payment_intent_id: Payment intent ID
            amount_to_capture: Amount to capture in cents (None = full amount)
        """
        capture_data = {}
        if amount_to_capture is not None:
            capture_data["amount_to_capture"] = amount_to_capture
        
        return stripe.PaymentIntent.capture(payment_intent_id, **capture_data)
    
    def cancel_payment_intent(
        self, 
        payment_intent_id: str,
        cancellation_reason: Optional[str] = None
    ) -> stripe.PaymentIntent:
        """Cancel a payment intent"""
        cancel_data = {}
        if cancellation_reason:
            cancel_data["cancellation_reason"] = cancellation_reason
        
        return stripe.PaymentIntent.cancel(payment_intent_id, **cancel_data)
    
    # ===== Refund Management =====
    
    def create_refund(
        self,
        payment_intent_id: str,
        amount: Optional[float] = None,
        reason: Optional[str] = None,
        metadata: Optional[Dict[str, str]] = None
    ) -> stripe.Refund:
        """
        Create a refund
        
        Args:
            payment_intent_id: Payment intent to refund
            amount: Amount to refund in dollars (None = full refund)
            reason: Refund reason ('duplicate', 'fraudulent', 'requested_by_customer')
            metadata: Additional metadata
        
        Returns:
            stripe.Refund: Created refund object
        """
        refund_data = {
            "payment_intent": payment_intent_id,
            "metadata": metadata or {}
        }
        
        if amount is not None:
            refund_data["amount"] = int(amount * 100)  # Convert to cents
        
        if reason:
            refund_data["reason"] = reason
        
        return stripe.Refund.create(**refund_data)
    
    def get_refund(self, refund_id: str) -> stripe.Refund:
        """Get a refund by ID"""
        return stripe.Refund.retrieve(refund_id)
    
    # ===== Payment Method Management =====
    
    def attach_payment_method(
        self, 
        payment_method_id: str, 
        customer_id: str
    ) -> stripe.PaymentMethod:
        """Attach a payment method to a customer"""
        return stripe.PaymentMethod.attach(
            payment_method_id,
            customer=customer_id
        )
    
    def detach_payment_method(self, payment_method_id: str) -> stripe.PaymentMethod:
        """Detach a payment method from a customer"""
        return stripe.PaymentMethod.detach(payment_method_id)
    
    def list_payment_methods(
        self, 
        customer_id: str, 
        type: str = "card"
    ) -> List[stripe.PaymentMethod]:
        """List customer's payment methods"""
        return stripe.PaymentMethod.list(
            customer=customer_id,
            type=type
        ).data
    
    def set_default_payment_method(
        self, 
        customer_id: str, 
        payment_method_id: str
    ) -> stripe.Customer:
        """Set default payment method for a customer"""
        return stripe.Customer.modify(
            customer_id,
            invoice_settings={
                "default_payment_method": payment_method_id
            }
        )
    
    # ===== Subscription Management =====
    
    def create_subscription(
        self,
        customer_id: str,
        price_id: str,
        metadata: Optional[Dict[str, str]] = None,
        trial_period_days: Optional[int] = None
    ) -> stripe.Subscription:
        """
        Create a subscription
        
        Args:
            customer_id: Stripe customer ID
            price_id: Stripe price ID
            metadata: Additional metadata
            trial_period_days: Trial period in days
        
        Returns:
            stripe.Subscription: Created subscription
        """
        subscription_data = {
            "customer": customer_id,
            "items": [{"price": price_id}],
            "metadata": metadata or {}
        }
        
        if trial_period_days is not None:
            subscription_data["trial_period_days"] = trial_period_days
        
        return stripe.Subscription.create(**subscription_data)
    
    def get_subscription(self, subscription_id: str) -> stripe.Subscription:
        """Get a subscription by ID"""
        return stripe.Subscription.retrieve(subscription_id)
    
    def cancel_subscription(
        self, 
        subscription_id: str,
        at_period_end: bool = True
    ) -> stripe.Subscription:
        """Cancel a subscription"""
        if at_period_end:
            return stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=True
            )
        else:
            return stripe.Subscription.delete(subscription_id)
    
    def update_subscription(
        self,
        subscription_id: str,
        **kwargs
    ) -> stripe.Subscription:
        """Update a subscription"""
        return stripe.Subscription.modify(subscription_id, **kwargs)
    
    # ===== Webhook Handling =====
    
    def construct_webhook_event(
        self, 
        payload: str, 
        signature: str,
        webhook_secret: str
    ) -> stripe.Event:
        """
        Construct and verify a webhook event
        
        Args:
            payload: Raw request body
            signature: Stripe-Signature header
            webhook_secret: Webhook signing secret
        
        Returns:
            stripe.Event: Verified event object
        
        Raises:
            stripe.error.SignatureVerificationError: If signature is invalid
        """
        return stripe.Webhook.construct_event(
            payload, signature, webhook_secret
        )
    
    async def handle_webhook_event(self, event: stripe.Event) -> Dict[str, Any]:
        """
        Handle webhook events from Stripe
        """
        event_type = event["type"]
        event_data = event["data"]["object"]
        
        handlers = {
            "payment_intent.succeeded": self._handle_payment_succeeded,
            "payment_intent.payment_failed": self._handle_payment_failed,
            "payment_intent.canceled": self._handle_payment_canceled,
            "charge.refunded": self._handle_charge_refunded,
            "customer.subscription.created": self._handle_subscription_created,
            "customer.subscription.updated": self._handle_subscription_updated,
            "customer.subscription.deleted": self._handle_subscription_deleted,
        }
        
        handler = handlers.get(event_type)
        if handler:
            return await handler(event_data)
        
        return {"status": "unhandled", "event_type": event_type}
    
    # ===== Webhook Event Handlers =====
    
    async def _handle_payment_succeeded(self, payment_intent: Dict) -> Dict:
        """Handle successful payment"""
        metadata = payment_intent.get("metadata", {})
        payment_id = metadata.get("payment_id")
        if payment_id:
            execute_query(
                "UPDATE payments SET status = 'completed', stripe_payment_intent_id = ?, updated_at = ? WHERE id = ?",
                [payment_intent["id"], datetime.now(timezone.utc).isoformat(), payment_id]
            )
        return {"status": "success", "payment_id": payment_id}
    
    async def _handle_payment_failed(self, payment_intent: Dict) -> Dict:
        """Handle failed payment"""
        metadata = payment_intent.get("metadata", {})
        payment_id = metadata.get("payment_id")
        if payment_id:
            execute_query(
                "UPDATE payments SET status = 'failed', updated_at = ? WHERE id = ?",
                [datetime.now(timezone.utc).isoformat(), payment_id]
            )
        return {"status": "failed", "payment_id": payment_id}
    
    async def _handle_payment_canceled(self, payment_intent: Dict) -> Dict:
        """Handle canceled payment"""
        metadata = payment_intent.get("metadata", {})
        payment_id = metadata.get("payment_id")
        if payment_id:
            execute_query(
                "UPDATE payments SET status = 'canceled', updated_at = ? WHERE id = ?",
                [datetime.now(timezone.utc).isoformat(), payment_id]
            )
        return {"status": "canceled", "payment_id": payment_id}
    
    async def _handle_charge_refunded(self, charge: Dict) -> Dict:
        """Handle refunded charge"""
        return {"status": "refunded"}
    
    async def _handle_subscription_created(self, subscription: Dict) -> Dict:
        """Handle subscription created"""
        return {"status": "subscription_created"}
    
    async def _handle_subscription_updated(self, subscription: Dict) -> Dict:
        """Handle subscription updated"""
        return {"status": "subscription_updated"}
    
    async def _handle_subscription_deleted(self, subscription: Dict) -> Dict:
        """Handle subscription deleted"""
        return {"status": "subscription_deleted"}
    
    # ===== Helper Methods =====
    
    def calculate_platform_fee(self, amount: float) -> float:
        """Calculate platform fee from amount"""
        return amount * (self.platform_fee_percent / 100)
    
    def format_amount_for_stripe(self, amount: float) -> int:
        """Convert dollar amount to cents for Stripe"""
        return int(amount * 100)
    
    def format_amount_from_stripe(self, amount_cents: int) -> float:
        """Convert cents from Stripe to dollars"""
        return amount_cents / 100

    # ===== Turso Webhook DB Operations =====

    async def update_payment_status_turso(self, payment_id: int, new_status: str) -> None:
        """Update a payment record's status."""
        execute_query(
            "UPDATE payments SET status = ?, updated_at = datetime('now') WHERE id = ?",
            [new_status, payment_id]
        )

    async def create_payment_notification_turso(
        self, user_id: int, notification_type: str, title: str, content: str, data: dict
    ) -> None:
        """Create a payment-related notification."""
        execute_query(
            """INSERT INTO notifications 
            (user_id, notification_type, title, content, data, is_read, created_at, priority)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'), 'high')""",
            [user_id, notification_type, title, content, json.dumps(data), 0]
        )

    async def complete_refund_turso(self, refund_id: int) -> None:
        """Mark a refund as completed."""
        execute_query(
            "UPDATE refunds SET status = 'completed', processed_at = datetime('now') WHERE id = ?",
            [refund_id]
        )


# Singleton instance
stripe_service = StripeService()
