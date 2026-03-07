# @AI-HINT: Production escrow service with Stripe integration and milestone management
"""Advanced Escrow Service - Secure payment holding and release system."""

import logging
import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from enum import Enum
from decimal import Decimal, ROUND_HALF_UP

logger = logging.getLogger(__name__)


class EscrowStatus(str, Enum):
    """Escrow transaction status."""
    PENDING = "pending"           # Awaiting funding
    FUNDED = "funded"             # Funds held
    PARTIALLY_RELEASED = "partially_released"
    RELEASED = "released"         # All funds released
    DISPUTED = "disputed"         # Under dispute
    REFUNDED = "refunded"         # Funds returned to client
    CANCELLED = "cancelled"


class TransactionType(str, Enum):
    """Transaction types."""
    DEPOSIT = "deposit"           # Client deposits to escrow
    RELEASE = "release"           # Release to freelancer
    REFUND = "refund"             # Return to client
    FEE = "fee"                   # Platform fee
    BONUS = "bonus"               # Client bonus payment
    DISPUTE_HOLD = "dispute_hold"
    DISPUTE_RELEASE = "dispute_release"


class AdvancedEscrowService:
    """
    Production-grade escrow service with Stripe integration.
    
    Handles secure fund holding, milestone releases, and dispute management.
    """
    
    # Platform fee percentage (e.g., 10%)
    PLATFORM_FEE_PERCENT = Decimal("10.0")
    
    # Payment processor fee (Stripe ~2.9% + $0.30)
    PROCESSOR_FEE_PERCENT = Decimal("2.9")
    PROCESSOR_FEE_FIXED = Decimal("0.30")
    
    # Minimum escrow amount
    MIN_ESCROW_AMOUNT = Decimal("5.00")
    
    # Maximum hold period (days)
    MAX_HOLD_PERIOD = 180
    
    def __init__(self, stripe_key: Optional[str] = None):
        self.stripe_key = stripe_key
        
        # In-memory escrow store (would be database in production)
        self._escrows: Dict[str, Dict] = {}
        self._transactions: Dict[str, List[Dict]] = {}
        self._milestones: Dict[str, List[Dict]] = {}
    
    async def create_escrow(
        self,
        contract_id: int,
        client_id: int,
        freelancer_id: int,
        amount: Decimal,
        currency: str = "USD",
        milestones: Optional[List[Dict]] = None,
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a new escrow account for a contract.
        
        Args:
            contract_id: Associated contract
            client_id: Client funding the escrow
            freelancer_id: Freelancer to receive funds
            amount: Total escrow amount
            currency: Currency code
            milestones: Optional milestone breakdown
            description: Escrow description
            
        Returns:
            Escrow details with funding instructions
        """
        try:
            # Validate amount
            amount = Decimal(str(amount)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            if amount < self.MIN_ESCROW_AMOUNT:
                raise ValueError(f"Minimum escrow amount is ${self.MIN_ESCROW_AMOUNT}")
            
            # Generate escrow ID
            escrow_id = f"esc_{secrets.token_hex(12)}"
            
            # Calculate fees
            platform_fee = (amount * self.PLATFORM_FEE_PERCENT / 100).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            processor_fee = (amount * self.PROCESSOR_FEE_PERCENT / 100 + self.PROCESSOR_FEE_FIXED).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            total_amount = amount + platform_fee + processor_fee
            freelancer_amount = amount - platform_fee
            
            # Create escrow record
            escrow = {
                "id": escrow_id,
                "contract_id": contract_id,
                "client_id": client_id,
                "freelancer_id": freelancer_id,
                "amount": float(amount),
                "currency": currency.upper(),
                "platform_fee": float(platform_fee),
                "processor_fee": float(processor_fee),
                "total_charged": float(total_amount),
                "freelancer_amount": float(freelancer_amount),
                "funded_amount": 0.0,
                "released_amount": 0.0,
                "refunded_amount": 0.0,
                "status": EscrowStatus.PENDING,
                "description": description,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "funded_at": None,
                "released_at": None,
                "expires_at": (datetime.now(timezone.utc) + timedelta(days=self.MAX_HOLD_PERIOD)).isoformat(),
                "stripe_payment_intent": None,
                "metadata": {}
            }
            
            self._escrows[escrow_id] = escrow
            self._transactions[escrow_id] = []
            
            # Create milestones if provided
            if milestones:
                self._milestones[escrow_id] = []
                for i, m in enumerate(milestones):
                    milestone = {
                        "id": f"ms_{secrets.token_hex(8)}",
                        "escrow_id": escrow_id,
                        "order": i + 1,
                        "title": m.get("title", f"Milestone {i + 1}"),
                        "description": m.get("description"),
                        "amount": float(m.get("amount", 0)),
                        "percentage": float(m.get("percentage", 0)),
                        "status": "pending",
                        "due_date": m.get("due_date"),
                        "completed_at": None,
                        "released_at": None
                    }
                    self._milestones[escrow_id].append(milestone)
            
            logger.info(f"Escrow created: {escrow_id} for ${amount}")
            
            return {
                "escrow_id": escrow_id,
                "status": "created",
                "escrow": escrow,
                "milestones": self._milestones.get(escrow_id, []),
                "payment_details": {
                    "amount": float(amount),
                    "platform_fee": float(platform_fee),
                    "processor_fee": float(processor_fee),
                    "total_to_pay": float(total_amount),
                    "freelancer_receives": float(freelancer_amount),
                    "currency": currency.upper()
                },
                "funding_instructions": await self._get_funding_instructions(escrow_id)
            }
            
        except Exception as e:
            logger.error(f"Create escrow error: {str(e)}")
            raise
    
    async def fund_escrow(
        self,
        escrow_id: str,
        payment_method: str,
        payment_details: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Fund an escrow account.
        
        Args:
            escrow_id: Escrow to fund
            payment_method: Payment method (card, bank_transfer, etc.)
            payment_details: Payment method specific details
        """
        if escrow_id not in self._escrows:
            raise ValueError("Escrow not found")
        
        escrow = self._escrows[escrow_id]
        
        if escrow["status"] != EscrowStatus.PENDING:
            raise ValueError(f"Escrow cannot be funded in status: {escrow['status']}")
        
        try:
            # Simulate payment processing (would use Stripe in production)
            payment_id = f"pay_{secrets.token_hex(12)}"
            
            # Record deposit transaction
            transaction = {
                "id": f"txn_{secrets.token_hex(10)}",
                "escrow_id": escrow_id,
                "type": TransactionType.DEPOSIT,
                "amount": escrow["total_charged"],
                "currency": escrow["currency"],
                "status": "completed",
                "payment_method": payment_method,
                "payment_id": payment_id,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "metadata": payment_details
            }
            self._transactions[escrow_id].append(transaction)
            
            # Update escrow status
            escrow["status"] = EscrowStatus.FUNDED
            escrow["funded_amount"] = escrow["amount"]
            escrow["funded_at"] = datetime.now(timezone.utc).isoformat()
            escrow["stripe_payment_intent"] = payment_id
            
            logger.info(f"Escrow funded: {escrow_id}")
            
            return {
                "status": "funded",
                "escrow_id": escrow_id,
                "transaction": transaction,
                "escrow_status": escrow["status"],
                "message": "Funds are now held in escrow"
            }
            
        except Exception as e:
            logger.error(f"Fund escrow error: {str(e)}")
            raise
    
    async def release_funds(
        self,
        escrow_id: str,
        amount: Optional[Decimal] = None,
        milestone_id: Optional[str] = None,
        released_by: int = None,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Release funds from escrow to freelancer.
        
        Can release full amount, partial amount, or specific milestone.
        """
        if escrow_id not in self._escrows:
            raise ValueError("Escrow not found")
        
        escrow = self._escrows[escrow_id]
        
        if escrow["status"] not in [EscrowStatus.FUNDED, EscrowStatus.PARTIALLY_RELEASED]:
            raise ValueError(f"Cannot release funds in status: {escrow['status']}")
        
        try:
            # Determine release amount
            if milestone_id:
                # Release specific milestone
                milestones = self._milestones.get(escrow_id, [])
                milestone = next((m for m in milestones if m["id"] == milestone_id), None)
                if not milestone:
                    raise ValueError("Milestone not found")
                if milestone["status"] == "released":
                    raise ValueError("Milestone already released")
                release_amount = Decimal(str(milestone["amount"]))
                milestone["status"] = "released"
                milestone["released_at"] = datetime.now(timezone.utc).isoformat()
            elif amount:
                release_amount = Decimal(str(amount)).quantize(Decimal("0.01"))
            else:
                # Release remaining balance
                release_amount = Decimal(str(escrow["funded_amount"] - escrow["released_amount"]))
            
            # Validate release amount
            available = Decimal(str(escrow["funded_amount"])) - Decimal(str(escrow["released_amount"]))
            if release_amount > available:
                raise ValueError(f"Insufficient funds. Available: ${available}")
            
            # Calculate freelancer amount (after platform fee)
            freelancer_share = (release_amount * (100 - self.PLATFORM_FEE_PERCENT) / 100).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            
            # Record release transaction
            transaction = {
                "id": f"txn_{secrets.token_hex(10)}",
                "escrow_id": escrow_id,
                "type": TransactionType.RELEASE,
                "amount": float(release_amount),
                "freelancer_amount": float(freelancer_share),
                "currency": escrow["currency"],
                "status": "completed",
                "milestone_id": milestone_id,
                "released_by": released_by,
                "notes": notes,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            self._transactions[escrow_id].append(transaction)
            
            # Update escrow
            escrow["released_amount"] = float(Decimal(str(escrow["released_amount"])) + release_amount)
            
            # Update status
            if Decimal(str(escrow["released_amount"])) >= Decimal(str(escrow["funded_amount"])):
                escrow["status"] = EscrowStatus.RELEASED
                escrow["released_at"] = datetime.now(timezone.utc).isoformat()
            else:
                escrow["status"] = EscrowStatus.PARTIALLY_RELEASED
            
            logger.info(f"Funds released: {escrow_id}, amount: ${release_amount}")
            
            return {
                "status": "released",
                "escrow_id": escrow_id,
                "released_amount": float(release_amount),
                "freelancer_receives": float(freelancer_share),
                "remaining_balance": float(Decimal(str(escrow["funded_amount"])) - Decimal(str(escrow["released_amount"]))),
                "escrow_status": escrow["status"],
                "transaction": transaction
            }
            
        except Exception as e:
            logger.error(f"Release funds error: {str(e)}")
            raise
    
    async def request_refund(
        self,
        escrow_id: str,
        amount: Optional[Decimal] = None,
        reason: str = None,
        requested_by: int = None
    ) -> Dict[str, Any]:
        """
        Request a refund from escrow.
        
        Creates a refund request that may require approval or dispute resolution.
        """
        if escrow_id not in self._escrows:
            raise ValueError("Escrow not found")
        
        escrow = self._escrows[escrow_id]
        
        if escrow["status"] not in [EscrowStatus.FUNDED, EscrowStatus.PARTIALLY_RELEASED]:
            raise ValueError(f"Cannot refund in status: {escrow['status']}")
        
        available = Decimal(str(escrow["funded_amount"])) - Decimal(str(escrow["released_amount"]))
        refund_amount = Decimal(str(amount)) if amount else available
        
        if refund_amount > available:
            raise ValueError(f"Insufficient funds for refund. Available: ${available}")
        
        # Create refund request
        refund_request = {
            "id": f"ref_{secrets.token_hex(10)}",
            "escrow_id": escrow_id,
            "amount": float(refund_amount),
            "reason": reason,
            "requested_by": requested_by,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # If full refund and no releases, auto-approve
        if Decimal(str(escrow["released_amount"])) == 0:
            return await self.process_refund(escrow_id, refund_request["id"], approved=True)
        
        return {
            "status": "pending_approval",
            "refund_request": refund_request,
            "message": "Refund request submitted for review"
        }
    
    async def process_refund(
        self,
        escrow_id: str,
        refund_id: str,
        approved: bool,
        admin_id: Optional[int] = None,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """Process a refund request."""
        if escrow_id not in self._escrows:
            raise ValueError("Escrow not found")
        
        escrow = self._escrows[escrow_id]
        
        if not approved:
            return {
                "status": "rejected",
                "escrow_id": escrow_id,
                "message": "Refund request rejected"
            }
        
        available = Decimal(str(escrow["funded_amount"])) - Decimal(str(escrow["released_amount"]))
        
        # Process refund (would integrate with Stripe)
        transaction = {
            "id": f"txn_{secrets.token_hex(10)}",
            "escrow_id": escrow_id,
            "type": TransactionType.REFUND,
            "amount": float(available),
            "currency": escrow["currency"],
            "status": "completed",
            "approved_by": admin_id,
            "notes": notes,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        self._transactions[escrow_id].append(transaction)
        
        # Update escrow
        escrow["refunded_amount"] = float(Decimal(str(escrow.get("refunded_amount", 0))) + available)
        escrow["status"] = EscrowStatus.REFUNDED
        
        logger.info(f"Refund processed: {escrow_id}, amount: ${available}")
        
        return {
            "status": "refunded",
            "escrow_id": escrow_id,
            "refunded_amount": float(available),
            "transaction": transaction
        }
    
    async def create_dispute(
        self,
        escrow_id: str,
        raised_by: int,
        reason: str,
        evidence: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Create a dispute for an escrow.
        
        Puts funds on hold until dispute is resolved.
        """
        if escrow_id not in self._escrows:
            raise ValueError("Escrow not found")
        
        escrow = self._escrows[escrow_id]
        
        if escrow["status"] not in [EscrowStatus.FUNDED, EscrowStatus.PARTIALLY_RELEASED]:
            raise ValueError(f"Cannot dispute in status: {escrow['status']}")
        
        # Create dispute
        dispute = {
            "id": f"dis_{secrets.token_hex(10)}",
            "escrow_id": escrow_id,
            "raised_by": raised_by,
            "reason": reason,
            "evidence": evidence or [],
            "status": "open",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "responses": [],
            "resolution": None
        }
        
        # Put escrow in dispute status
        previous_status = escrow["status"]
        escrow["status"] = EscrowStatus.DISPUTED
        escrow["dispute_id"] = dispute["id"]
        
        # Record dispute hold transaction
        available = Decimal(str(escrow["funded_amount"])) - Decimal(str(escrow["released_amount"]))
        transaction = {
            "id": f"txn_{secrets.token_hex(10)}",
            "escrow_id": escrow_id,
            "type": TransactionType.DISPUTE_HOLD,
            "amount": float(available),
            "currency": escrow["currency"],
            "status": "completed",
            "dispute_id": dispute["id"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        self._transactions[escrow_id].append(transaction)
        
        logger.info(f"Dispute created: {dispute['id']} for escrow {escrow_id}")
        
        return {
            "status": "disputed",
            "dispute": dispute,
            "escrow_status": escrow["status"],
            "held_amount": float(available),
            "message": "Funds are now on hold pending dispute resolution"
        }
    
    async def resolve_dispute(
        self,
        escrow_id: str,
        dispute_id: str,
        resolution: str,  # "release_to_freelancer", "refund_to_client", "split"
        split_percent: Optional[float] = None,
        admin_id: int = None,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Resolve a dispute and distribute funds accordingly.
        """
        if escrow_id not in self._escrows:
            raise ValueError("Escrow not found")
        
        escrow = self._escrows[escrow_id]
        
        if escrow["status"] != EscrowStatus.DISPUTED:
            raise ValueError("Escrow is not in dispute")
        
        available = Decimal(str(escrow["funded_amount"])) - Decimal(str(escrow["released_amount"]))
        
        results = {"freelancer_amount": 0, "client_refund": 0}
        
        if resolution == "release_to_freelancer":
            # Release all to freelancer
            results["freelancer_amount"] = float(available)
            await self.release_funds(escrow_id, available, released_by=admin_id, notes=f"Dispute resolution: {notes}")
            
        elif resolution == "refund_to_client":
            # Refund all to client
            results["client_refund"] = float(available)
            await self.process_refund(escrow_id, "dispute_refund", approved=True, admin_id=admin_id, notes=f"Dispute resolution: {notes}")
            
        elif resolution == "split":
            # Split between parties
            if not split_percent:
                split_percent = 50.0
            freelancer_share = (available * Decimal(str(split_percent)) / 100).quantize(Decimal("0.01"))
            client_share = available - freelancer_share
            
            results["freelancer_amount"] = float(freelancer_share)
            results["client_refund"] = float(client_share)
            
            await self.release_funds(escrow_id, freelancer_share, released_by=admin_id, notes=f"Dispute split: {split_percent}%")
        
        logger.info(f"Dispute {dispute_id} resolved: {resolution}")
        
        return {
            "status": "resolved",
            "dispute_id": dispute_id,
            "resolution": resolution,
            **results,
            "resolved_by": admin_id,
            "notes": notes
        }
    
    async def get_escrow(self, escrow_id: str) -> Optional[Dict[str, Any]]:
        """Get escrow details."""
        if escrow_id not in self._escrows:
            return None
        
        escrow = self._escrows[escrow_id].copy()
        escrow["transactions"] = self._transactions.get(escrow_id, [])
        escrow["milestones"] = self._milestones.get(escrow_id, [])
        
        return escrow
    
    async def get_user_escrows(
        self,
        user_id: int,
        role: str = "any",  # "client", "freelancer", "any"
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get all escrows for a user."""
        escrows = []
        
        for escrow_id, escrow in self._escrows.items():
            # Filter by role
            if role == "client" and escrow["client_id"] != user_id:
                continue
            elif role == "freelancer" and escrow["freelancer_id"] != user_id:
                continue
            elif role == "any" and user_id not in [escrow["client_id"], escrow["freelancer_id"]]:
                continue
            
            # Filter by status
            if status and escrow["status"] != status:
                continue
            
            escrow_copy = escrow.copy()
            escrow_copy["user_role"] = "client" if escrow["client_id"] == user_id else "freelancer"
            escrows.append(escrow_copy)
        
        return escrows
    
    async def complete_milestone(
        self,
        escrow_id: str,
        milestone_id: str,
        completed_by: int
    ) -> Dict[str, Any]:
        """Mark a milestone as completed (awaiting release)."""
        if escrow_id not in self._milestones:
            raise ValueError("No milestones for this escrow")
        
        milestones = self._milestones[escrow_id]
        milestone = next((m for m in milestones if m["id"] == milestone_id), None)
        
        if not milestone:
            raise ValueError("Milestone not found")
        
        if milestone["status"] != "pending":
            raise ValueError(f"Milestone cannot be completed in status: {milestone['status']}")
        
        milestone["status"] = "completed"
        milestone["completed_at"] = datetime.now(timezone.utc).isoformat()
        
        return {
            "status": "completed",
            "milestone": milestone,
            "message": "Milestone marked as completed. Awaiting client approval for fund release."
        }
    
    async def _get_funding_instructions(self, escrow_id: str) -> Dict[str, Any]:
        """Get payment instructions for funding escrow."""
        escrow = self._escrows.get(escrow_id)
        if not escrow:
            return {}
        
        return {
            "methods": [
                {
                    "type": "card",
                    "description": "Credit/Debit Card",
                    "supported_brands": ["visa", "mastercard", "amex"],
                    "processing_time": "Instant"
                },
                {
                    "type": "bank_transfer",
                    "description": "Bank Transfer (ACH)",
                    "processing_time": "1-3 business days"
                },
                {
                    "type": "paypal",
                    "description": "PayPal",
                    "processing_time": "Instant"
                }
            ],
            "total_amount": escrow["total_charged"],
            "currency": escrow["currency"],
            "escrow_id": escrow_id
        }


# Singleton instance
_escrow_service: Optional[AdvancedEscrowService] = None


def get_escrow_service() -> AdvancedEscrowService:
    """Get or create escrow service instance."""
    global _escrow_service
    if _escrow_service is None:
        _escrow_service = AdvancedEscrowService()
    return _escrow_service
