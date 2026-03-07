# @AI-HINT: Subscription and billing management service for premium features and plans
"""Subscription & Billing Service."""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from enum import Enum
import json
import uuid
import logging

from app.db.turso_http import execute_query, parse_rows

logger = logging.getLogger(__name__)


class PlanTier(str, Enum):
    FREE = "free"
    STARTER = "starter"
    PROFESSIONAL = "professional"
    BUSINESS = "business"
    ENTERPRISE = "enterprise"


class BillingCycle(str, Enum):
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUAL = "annual"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"


class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    CANCELLED = "cancelled"
    PAST_DUE = "past_due"
    TRIALING = "trialing"
    PAUSED = "paused"
    EXPIRED = "expired"


# Plan definitions with features
SUBSCRIPTION_PLANS = {
    PlanTier.FREE: {
        "name": "Free",
        "description": "Basic access for individuals",
        "price_monthly": Decimal("0.00"),
        "price_annual": Decimal("0.00"),
        "features": {
            "max_projects": 3,
            "max_proposals_per_month": 10,
            "max_file_storage_mb": 100,
            "priority_support": False,
            "analytics_access": False,
            "api_access": False,
            "custom_branding": False,
            "team_members": 0,
            "commission_rate": Decimal("15.0")
        }
    },
    PlanTier.STARTER: {
        "name": "Starter",
        "description": "Perfect for getting started",
        "price_monthly": Decimal("9.99"),
        "price_annual": Decimal("99.99"),
        "features": {
            "max_projects": 10,
            "max_proposals_per_month": 50,
            "max_file_storage_mb": 500,
            "priority_support": False,
            "analytics_access": True,
            "api_access": False,
            "custom_branding": False,
            "team_members": 0,
            "commission_rate": Decimal("12.0")
        }
    },
    PlanTier.PROFESSIONAL: {
        "name": "Professional",
        "description": "For serious freelancers",
        "price_monthly": Decimal("29.99"),
        "price_annual": Decimal("299.99"),
        "features": {
            "max_projects": 50,
            "max_proposals_per_month": 200,
            "max_file_storage_mb": 2000,
            "priority_support": True,
            "analytics_access": True,
            "api_access": True,
            "custom_branding": False,
            "team_members": 3,
            "commission_rate": Decimal("10.0")
        }
    },
    PlanTier.BUSINESS: {
        "name": "Business",
        "description": "For teams and agencies",
        "price_monthly": Decimal("79.99"),
        "price_annual": Decimal("799.99"),
        "features": {
            "max_projects": 200,
            "max_proposals_per_month": 500,
            "max_file_storage_mb": 10000,
            "priority_support": True,
            "analytics_access": True,
            "api_access": True,
            "custom_branding": True,
            "team_members": 10,
            "commission_rate": Decimal("8.0")
        }
    },
    PlanTier.ENTERPRISE: {
        "name": "Enterprise",
        "description": "Custom solutions for large organizations",
        "price_monthly": Decimal("299.99"),
        "price_annual": Decimal("2999.99"),
        "features": {
            "max_projects": -1,  # Unlimited
            "max_proposals_per_month": -1,  # Unlimited
            "max_file_storage_mb": 100000,
            "priority_support": True,
            "analytics_access": True,
            "api_access": True,
            "custom_branding": True,
            "team_members": -1,  # Unlimited
            "commission_rate": Decimal("5.0"),
            "dedicated_account_manager": True,
            "sla_guarantee": True,
            "custom_integrations": True
        }
    }
}


class SubscriptionBillingService:
    """Service for managing subscriptions and billing"""
    
    def __init__(self):
        self._ensure_table()
    
    def _ensure_table(self):
        """Create subscriptions table if not exists"""
        try:
            execute_query("""CREATE TABLE IF NOT EXISTS user_subscriptions (
                id TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
                tier TEXT NOT NULL DEFAULT 'free',
                status TEXT NOT NULL DEFAULT 'active',
                billing_cycle TEXT,
                payment_method_id TEXT,
                current_period_start TEXT,
                current_period_end TEXT,
                trial_end TEXT,
                cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
                cancellation_reason TEXT,
                cancellation_scheduled_at TEXT,
                scheduled_downgrade TEXT,
                cancelled_at TEXT,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            )""")
        except Exception:
            pass
    
    def _get_subscription(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get subscription row for user"""
        result = execute_query(
            "SELECT * FROM user_subscriptions WHERE user_id = ?",
            [user_id]
        )
        rows = parse_rows(result)
        return rows[0] if rows else None
    
    def _user_exists(self, user_id: int) -> bool:
        result = execute_query("SELECT id FROM users WHERE id = ?", [user_id])
        return len(parse_rows(result)) > 0
    
    # Plan Management
    async def get_available_plans(self) -> List[Dict[str, Any]]:
        """Get all available subscription plans"""
        plans = []
        for tier, plan_data in SUBSCRIPTION_PLANS.items():
            plans.append({
                "tier": tier.value,
                "name": plan_data["name"],
                "description": plan_data["description"],
                "price_monthly": float(plan_data["price_monthly"]),
                "price_annual": float(plan_data["price_annual"]),
                "annual_savings": float(
                    plan_data["price_monthly"] * 12 - plan_data["price_annual"]
                ),
                "features": {
                    k: v if not isinstance(v, Decimal) else float(v)
                    for k, v in plan_data["features"].items()
                }
            })
        return plans
    
    async def get_plan_details(self, tier: PlanTier) -> Optional[Dict[str, Any]]:
        """Get detailed information about a specific plan"""
        if tier not in SUBSCRIPTION_PLANS:
            return None
        
        plan_data = SUBSCRIPTION_PLANS[tier]
        return {
            "tier": tier.value,
            **plan_data,
            "price_monthly": float(plan_data["price_monthly"]),
            "price_annual": float(plan_data["price_annual"]),
            "features": {
                k: v if not isinstance(v, Decimal) else float(v)
                for k, v in plan_data["features"].items()
            }
        }
    
    async def compare_plans(self, tier1: PlanTier, tier2: PlanTier) -> Dict[str, Any]:
        """Compare two subscription plans"""
        plan1 = SUBSCRIPTION_PLANS.get(tier1, {})
        plan2 = SUBSCRIPTION_PLANS.get(tier2, {})
        
        features1 = plan1.get("features", {})
        features2 = plan2.get("features", {})
        
        comparison = {
            "plan1": {"tier": tier1.value, "name": plan1.get("name", "")},
            "plan2": {"tier": tier2.value, "name": plan2.get("name", "")},
            "differences": {}
        }
        
        all_features = set(features1.keys()) | set(features2.keys())
        for feature in all_features:
            val1 = features1.get(feature)
            val2 = features2.get(feature)
            if val1 != val2:
                comparison["differences"][feature] = {
                    "plan1": val1 if not isinstance(val1, Decimal) else float(val1),
                    "plan2": val2 if not isinstance(val2, Decimal) else float(val2)
                }
        
        return comparison
    
    # Subscription Management
    async def get_user_subscription(self, user_id: int) -> Dict[str, Any]:
        """Get user's current subscription"""
        if not self._user_exists(user_id):
            return {"error": "User not found"}
        
        sub = self._get_subscription(user_id)
        
        if not sub:
            return {
                "user_id": user_id,
                "tier": PlanTier.FREE.value,
                "status": SubscriptionStatus.ACTIVE.value,
                "billing_cycle": None,
                "current_period_start": None,
                "current_period_end": None,
                "features": {
                    k: v if not isinstance(v, Decimal) else float(v)
                    for k, v in SUBSCRIPTION_PLANS[PlanTier.FREE]["features"].items()
                }
            }
        
        tier = PlanTier(sub.get("tier", "free"))
        plan = SUBSCRIPTION_PLANS.get(tier, SUBSCRIPTION_PLANS[PlanTier.FREE])
        
        result = {
            "subscription_id": sub["id"],
            "user_id": user_id,
            "tier": sub["tier"],
            "status": sub["status"],
            "billing_cycle": sub.get("billing_cycle"),
            "current_period_start": sub.get("current_period_start"),
            "current_period_end": sub.get("current_period_end"),
            "trial_end": sub.get("trial_end"),
            "cancel_at_period_end": bool(sub.get("cancel_at_period_end")),
            "payment_method_id": sub.get("payment_method_id"),
            "features": {
                k: v if not isinstance(v, Decimal) else float(v)
                for k, v in plan["features"].items()
            }
        }
        
        if sub.get("scheduled_downgrade"):
            try:
                result["scheduled_downgrade"] = json.loads(sub["scheduled_downgrade"])
            except (json.JSONDecodeError, TypeError):
                pass
        
        return result
    
    async def create_subscription(
        self,
        user_id: int,
        tier: PlanTier,
        billing_cycle: BillingCycle,
        payment_method_id: Optional[str] = None,
        trial_days: int = 0
    ) -> Dict[str, Any]:
        """Create a new subscription for user"""
        try:
            if not self._user_exists(user_id):
                return {"error": "User not found"}
            
            plan = SUBSCRIPTION_PLANS.get(tier)
            if not plan:
                return {"error": "Invalid plan tier"}
            
            now = datetime.now(timezone.utc)
            
            if trial_days > 0:
                period_end = now + timedelta(days=trial_days)
                status = SubscriptionStatus.TRIALING
            elif billing_cycle == BillingCycle.MONTHLY:
                period_end = now + timedelta(days=30)
                status = SubscriptionStatus.ACTIVE
            elif billing_cycle == BillingCycle.QUARTERLY:
                period_end = now + timedelta(days=90)
                status = SubscriptionStatus.ACTIVE
            else:
                period_end = now + timedelta(days=365)
                status = SubscriptionStatus.ACTIVE
            
            sub_id = f"sub_{user_id}_{now.strftime('%Y%m%d%H%M%S')}"
            
            # Upsert subscription
            existing = self._get_subscription(user_id)
            if existing:
                execute_query(
                    """UPDATE user_subscriptions SET
                        id = ?, tier = ?, status = ?, billing_cycle = ?,
                        payment_method_id = ?, current_period_start = ?,
                        current_period_end = ?, trial_end = ?,
                        cancel_at_period_end = 0, cancellation_reason = NULL,
                        cancellation_scheduled_at = NULL, scheduled_downgrade = NULL,
                        cancelled_at = NULL, updated_at = ?
                    WHERE user_id = ?""",
                    [sub_id, tier.value, status.value, billing_cycle.value,
                     payment_method_id, now.isoformat(), period_end.isoformat(),
                     (now + timedelta(days=trial_days)).isoformat() if trial_days > 0 else None,
                     now.isoformat(), user_id]
                )
            else:
                execute_query(
                    """INSERT INTO user_subscriptions
                        (id, user_id, tier, status, billing_cycle, payment_method_id,
                         current_period_start, current_period_end, trial_end, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    [sub_id, user_id, tier.value, status.value, billing_cycle.value,
                     payment_method_id, now.isoformat(), period_end.isoformat(),
                     (now + timedelta(days=trial_days)).isoformat() if trial_days > 0 else None,
                     now.isoformat(), now.isoformat()]
                )
            
            # Create billing invoice for non-free tiers
            if tier != PlanTier.FREE and status != SubscriptionStatus.TRIALING:
                if billing_cycle == BillingCycle.ANNUAL:
                    amount = float(plan["price_annual"])
                elif billing_cycle == BillingCycle.QUARTERLY:
                    amount = float(plan["price_monthly"] * 3 * Decimal("0.95"))
                else:
                    amount = float(plan["price_monthly"])
                
                inv_id = f"inv_{uuid.uuid4().hex[:12]}"
                execute_query(
                    """INSERT INTO billing_invoices
                        (id, user_id, tier, billing_cycle, amount, currency, status,
                         description, period_start, period_end, paid_at, created_at)
                    VALUES (?, ?, ?, ?, ?, 'USD', 'paid', ?, ?, ?, ?, ?)""",
                    [inv_id, user_id, tier.value, billing_cycle.value, amount,
                     f"{plan['name']} Plan - {billing_cycle.value.capitalize()}",
                     now.isoformat(), period_end.isoformat(),
                     now.isoformat(), now.isoformat()]
                )
            
            subscription = {
                "subscription_id": sub_id,
                "user_id": user_id,
                "tier": tier.value,
                "status": status.value,
                "billing_cycle": billing_cycle.value,
                "current_period_start": now.isoformat(),
                "current_period_end": period_end.isoformat(),
                "trial_end": (now + timedelta(days=trial_days)).isoformat() if trial_days > 0 else None,
                "payment_method_id": payment_method_id,
                "features": {
                    k: v if not isinstance(v, Decimal) else float(v)
                    for k, v in plan["features"].items()
                },
                "created_at": now.isoformat()
            }
            
            return subscription
            
        except Exception as e:
            logger.error(f"Error creating subscription: {e}")
            return {"error": str(e)}
    
    async def upgrade_subscription(
        self,
        user_id: int,
        new_tier: PlanTier,
        prorate: bool = True
    ) -> Dict[str, Any]:
        """Upgrade user's subscription to a higher tier"""
        try:
            current_sub = await self.get_user_subscription(user_id)
            if "error" in current_sub:
                return current_sub
            
            current_tier = PlanTier(current_sub.get("tier", "free"))
            
            # Validate upgrade path
            tier_order = [PlanTier.FREE, PlanTier.STARTER, PlanTier.PROFESSIONAL, 
                        PlanTier.BUSINESS, PlanTier.ENTERPRISE]
            
            if tier_order.index(new_tier) <= tier_order.index(current_tier):
                return {"error": "Can only upgrade to a higher tier"}
            
            # Calculate prorated amount if applicable
            proration_credit = Decimal("0.00")
            if prorate and current_sub.get("current_period_end"):
                # Calculate unused days
                period_end = datetime.fromisoformat(current_sub["current_period_end"])
                remaining_days = (period_end - datetime.now(timezone.utc)).days
                if remaining_days > 0:
                    current_plan = SUBSCRIPTION_PLANS.get(current_tier, {})
                    daily_rate = current_plan.get("price_monthly", Decimal("0")) / 30
                    proration_credit = daily_rate * remaining_days
            
            # Create new subscription
            billing_cycle = BillingCycle(current_sub.get("billing_cycle", "monthly"))
            result = await self.create_subscription(
                user_id, new_tier, billing_cycle, 
                current_sub.get("payment_method_id")
            )
            
            if "error" not in result:
                result["proration_credit"] = float(proration_credit)
                result["upgraded_from"] = current_tier.value
            
            return result
            
        except Exception as e:
            logger.error(f"Error upgrading subscription: {e}")
            return {"error": str(e)}
    
    async def downgrade_subscription(
        self,
        user_id: int,
        new_tier: PlanTier,
        effective_at_period_end: bool = True
    ) -> Dict[str, Any]:
        """Downgrade user's subscription to a lower tier"""
        try:
            current_sub = await self.get_user_subscription(user_id)
            if "error" in current_sub:
                return current_sub
            
            current_tier = PlanTier(current_sub.get("tier", "free"))
            
            tier_order = [PlanTier.FREE, PlanTier.STARTER, PlanTier.PROFESSIONAL,
                        PlanTier.BUSINESS, PlanTier.ENTERPRISE]
            
            if tier_order.index(new_tier) >= tier_order.index(current_tier):
                return {"error": "Can only downgrade to a lower tier"}
            
            if effective_at_period_end:
                downgrade_data = json.dumps({
                    "new_tier": new_tier.value,
                    "effective_date": current_sub.get("current_period_end")
                })
                execute_query(
                    """UPDATE user_subscriptions SET scheduled_downgrade = ?, updated_at = ?
                    WHERE user_id = ?""",
                    [downgrade_data, datetime.now(timezone.utc).isoformat(), user_id]
                )
                
                return {
                    "message": "Downgrade scheduled",
                    "current_tier": current_tier.value,
                    "new_tier": new_tier.value,
                    "effective_date": current_sub.get("current_period_end")
                }
            else:
                billing_cycle = BillingCycle(current_sub.get("billing_cycle", "monthly"))
                return await self.create_subscription(
                    user_id, new_tier, billing_cycle,
                    current_sub.get("payment_method_id")
                )
                
        except Exception as e:
            logger.error(f"Error downgrading subscription: {e}")
            return {"error": str(e)}
    
    async def cancel_subscription(
        self,
        user_id: int,
        reason: Optional[str] = None,
        immediate: bool = False
    ) -> Dict[str, Any]:
        """Cancel user's subscription"""
        try:
            if not self._user_exists(user_id):
                return {"error": "User not found"}
            
            sub = self._get_subscription(user_id)
            if not sub or sub.get("tier") == PlanTier.FREE.value:
                return {"error": "No active subscription to cancel"}
            
            now = datetime.now(timezone.utc)
            
            if immediate:
                execute_query(
                    """UPDATE user_subscriptions SET
                        status = ?, tier = 'free', cancelled_at = ?,
                        cancellation_reason = ?, updated_at = ?
                    WHERE user_id = ?""",
                    [SubscriptionStatus.CANCELLED.value, now.isoformat(),
                     reason, now.isoformat(), user_id]
                )
            else:
                execute_query(
                    """UPDATE user_subscriptions SET
                        cancel_at_period_end = 1, cancellation_scheduled_at = ?,
                        cancellation_reason = ?, updated_at = ?
                    WHERE user_id = ?""",
                    [now.isoformat(), reason, now.isoformat(), user_id]
                )
            
            return {
                "message": "Subscription cancelled" if immediate else "Cancellation scheduled",
                "effective_date": now.isoformat() if immediate else sub.get("current_period_end"),
                "reason": reason
            }
            
        except Exception as e:
            logger.error(f"Error cancelling subscription: {e}")
            return {"error": str(e)}
    
    async def reactivate_subscription(self, user_id: int) -> Dict[str, Any]:
        """Reactivate a cancelled subscription"""
        try:
            if not self._user_exists(user_id):
                return {"error": "User not found"}
            
            sub = self._get_subscription(user_id)
            if not sub:
                return {"error": "No subscription found"}
            
            if sub.get("cancel_at_period_end"):
                now = datetime.now(timezone.utc)
                execute_query(
                    """UPDATE user_subscriptions SET
                        cancel_at_period_end = 0, cancellation_scheduled_at = NULL,
                        cancellation_reason = NULL, updated_at = ?
                    WHERE user_id = ?""",
                    [now.isoformat(), user_id]
                )
                
                updated = self._get_subscription(user_id)
                return {"message": "Subscription reactivated", "subscription": updated}
            
            return {"error": "Subscription is not scheduled for cancellation"}
            
        except Exception as e:
            logger.error(f"Error reactivating subscription: {e}")
            return {"error": str(e)}
    
    # Feature Access
    async def check_feature_access(
        self,
        user_id: int,
        feature: str
    ) -> Dict[str, Any]:
        """Check if user has access to a specific feature"""
        subscription = await self.get_user_subscription(user_id)
        if "error" in subscription:
            return {"has_access": False, "error": subscription["error"]}
        
        features = subscription.get("features", {})
        feature_value = features.get(feature)
        
        if feature_value is None:
            return {"has_access": False, "reason": "Feature not found"}
        
        if isinstance(feature_value, bool):
            return {"has_access": feature_value, "feature": feature}
        elif isinstance(feature_value, (int, float)):
            return {
                "has_access": feature_value != 0,
                "feature": feature,
                "limit": feature_value,
                "unlimited": feature_value == -1
            }
        
        return {"has_access": True, "feature": feature, "value": feature_value}
    
    async def get_feature_limits(self, user_id: int) -> Dict[str, Any]:
        """Get all feature limits for user's subscription"""
        subscription = await self.get_user_subscription(user_id)
        if "error" in subscription:
            return subscription
        
        return {
            "tier": subscription.get("tier"),
            "features": subscription.get("features", {}),
            "status": subscription.get("status")
        }
    
    # Billing History
    async def get_billing_history(
        self,
        user_id: int,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Get user's billing/invoice history"""
        result = execute_query(
            """SELECT * FROM billing_invoices WHERE user_id = ?
            ORDER BY created_at DESC LIMIT ?""",
            [user_id, limit]
        )
        invoices = parse_rows(result)
        return {
            "user_id": user_id,
            "invoices": invoices,
            "total_invoices": len(invoices)
        }
    
    async def get_upcoming_invoice(self, user_id: int) -> Dict[str, Any]:
        """Preview the next invoice"""
        subscription = await self.get_user_subscription(user_id)
        if "error" in subscription:
            return subscription
        
        tier = PlanTier(subscription.get("tier", "free"))
        if tier == PlanTier.FREE:
            return {"message": "No upcoming invoice for free tier"}
        
        plan = SUBSCRIPTION_PLANS[tier]
        billing_cycle = subscription.get("billing_cycle", "monthly")
        
        if billing_cycle == "annual":
            amount = plan["price_annual"]
        elif billing_cycle == "quarterly":
            amount = plan["price_monthly"] * 3 * Decimal("0.95")  # 5% quarterly discount
        else:
            amount = plan["price_monthly"]
        
        return {
            "user_id": user_id,
            "tier": tier.value,
            "billing_cycle": billing_cycle,
            "amount": float(amount),
            "currency": "USD",
            "next_billing_date": subscription.get("current_period_end"),
            "items": [
                {
                    "description": f"{plan['name']} Plan - {billing_cycle.capitalize()}",
                    "amount": float(amount)
                }
            ]
        }
    
    # Usage Tracking
    async def track_usage(
        self,
        user_id: int,
        usage_type: str,
        amount: int = 1
    ) -> Dict[str, Any]:
        """Track feature usage against limits"""
        limits = await self.get_feature_limits(user_id)
        if "error" in limits:
            return limits
        
        features = limits.get("features", {})
        limit_value = features.get(usage_type)
        
        if limit_value is None:
            return {"error": f"Unknown usage type: {usage_type}"}
        
        now = datetime.now(timezone.utc)
        period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
        if now.month == 12:
            period_end = now.replace(year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
        else:
            period_end = now.replace(month=now.month + 1, day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
        
        # Upsert usage
        existing = execute_query(
            """SELECT id, amount FROM feature_usage
            WHERE user_id = ? AND usage_type = ? AND period_start = ?""",
            [user_id, usage_type, period_start]
        )
        existing_rows = parse_rows(existing)
        
        if existing_rows:
            new_amount = int(existing_rows[0]["amount"]) + amount
            execute_query(
                "UPDATE feature_usage SET amount = ?, updated_at = ? WHERE id = ?",
                [new_amount, now.isoformat(), existing_rows[0]["id"]]
            )
            current_used = new_amount
        else:
            execute_query(
                """INSERT INTO feature_usage (user_id, usage_type, amount, period_start, period_end, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)""",
                [user_id, usage_type, amount, period_start, period_end, now.isoformat()]
            )
            current_used = amount
        
        unlimited = limit_value == -1
        return {
            "usage_type": usage_type,
            "amount_used": current_used,
            "limit": limit_value,
            "unlimited": unlimited,
            "remaining": None if unlimited else max(0, limit_value - current_used)
        }
    
    async def get_usage_summary(self, user_id: int) -> Dict[str, Any]:
        """Get usage summary for current billing period"""
        limits = await self.get_feature_limits(user_id)
        if "error" in limits:
            return limits
        
        now = datetime.now(timezone.utc)
        period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
        if now.month == 12:
            period_end = now.replace(year=now.year + 1, month=1, day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
        else:
            period_end = now.replace(month=now.month + 1, day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
        
        result = execute_query(
            """SELECT usage_type, amount FROM feature_usage
            WHERE user_id = ? AND period_start = ?""",
            [user_id, period_start]
        )
        usage_rows = parse_rows(result)
        usage_map = {r["usage_type"]: int(r["amount"]) for r in usage_rows}
        
        features = limits.get("features", {})
        
        return {
            "user_id": user_id,
            "tier": limits.get("tier"),
            "billing_period": {
                "start": period_start,
                "end": period_end
            },
            "usage": {
                "projects": {
                    "used": usage_map.get("max_projects", 0),
                    "limit": features.get("max_projects", 0)
                },
                "proposals": {
                    "used": usage_map.get("max_proposals_per_month", 0),
                    "limit": features.get("max_proposals_per_month", 0)
                },
                "storage_mb": {
                    "used": usage_map.get("max_file_storage_mb", 0),
                    "limit": features.get("max_file_storage_mb", 0)
                }
            }
        }
    
    # Admin methods
    async def get_all_subscriptions(
        self,
        status_filter: Optional[str] = None,
        tier_filter: Optional[str] = None,
        limit: int = 50
    ) -> Dict[str, Any]:
        """Admin: Get all subscriptions with filters"""
        query = "SELECT * FROM user_subscriptions WHERE 1=1"
        params = []
        
        if status_filter:
            query += " AND status = ?"
            params.append(status_filter)
        if tier_filter:
            query += " AND tier = ?"
            params.append(tier_filter)
        
        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)
        
        result = execute_query(query, params)
        subs = parse_rows(result)
        
        count_result = execute_query("SELECT COUNT(*) as cnt FROM user_subscriptions", [])
        total = int(parse_rows(count_result)[0]["cnt"]) if parse_rows(count_result) else 0
        
        return {
            "subscriptions": subs,
            "total": total,
            "filters": {
                "status": status_filter,
                "tier": tier_filter
            }
        }
    
    async def get_revenue_stats(self, period_days: int = 30) -> Dict[str, Any]:
        """Admin: Get revenue statistics"""
        now = datetime.now(timezone.utc)
        cutoff = (now - timedelta(days=period_days)).isoformat()
        
        # Total revenue in period
        total_result = execute_query(
            "SELECT COALESCE(SUM(amount), 0) as total FROM billing_invoices WHERE created_at >= ? AND status = 'paid'",
            [cutoff]
        )
        total_rows = parse_rows(total_result)
        total_revenue = float(total_rows[0]["total"]) if total_rows else 0.0
        
        # Revenue by tier
        tier_result = execute_query(
            "SELECT tier, SUM(amount) as total FROM billing_invoices WHERE created_at >= ? AND status = 'paid' GROUP BY tier",
            [cutoff]
        )
        by_tier = {r["tier"]: float(r["total"]) for r in parse_rows(tier_result)}
        
        # Revenue by billing cycle
        cycle_result = execute_query(
            "SELECT billing_cycle, SUM(amount) as total FROM billing_invoices WHERE created_at >= ? AND status = 'paid' GROUP BY billing_cycle",
            [cutoff]
        )
        by_cycle = {r["billing_cycle"]: float(r["total"]) for r in parse_rows(cycle_result)}
        
        # Subscription counts by status
        status_result = execute_query(
            "SELECT status, COUNT(*) as cnt FROM user_subscriptions GROUP BY status", []
        )
        status_counts = {r["status"]: int(r["cnt"]) for r in parse_rows(status_result)}
        
        # MRR from active monthly subs
        mrr_result = execute_query(
            """SELECT COALESCE(SUM(
                CASE WHEN billing_cycle = 'annual' THEN amount / 12.0
                     WHEN billing_cycle = 'quarterly' THEN amount / 3.0
                     ELSE amount END
            ), 0) as mrr FROM billing_invoices
            WHERE user_id IN (SELECT user_id FROM user_subscriptions WHERE status = 'active')
            AND id IN (SELECT id FROM billing_invoices WHERE user_id = billing_invoices.user_id ORDER BY created_at DESC LIMIT 1)""",
            []
        )
        mrr_rows = parse_rows(mrr_result)
        mrr = float(mrr_rows[0]["mrr"]) if mrr_rows else 0.0
        
        active = status_counts.get("active", 0)
        cancelled = status_counts.get("cancelled", 0)
        churn_rate = (cancelled / (active + cancelled) * 100) if (active + cancelled) > 0 else 0.0
        
        return {
            "period_days": period_days,
            "revenue": {
                "total": total_revenue,
                "by_tier": by_tier,
                "by_billing_cycle": by_cycle
            },
            "subscriptions": {
                "active": active,
                "trialing": status_counts.get("trialing", 0),
                "cancelled": cancelled
            },
            "churn_rate": round(churn_rate, 2),
            "mrr": round(mrr, 2),
            "arr": round(mrr * 12, 2)
        }


_service_instance = None

def get_subscription_billing_service() -> SubscriptionBillingService:
    """Get subscription billing service instance"""
    global _service_instance
    if _service_instance is None:
        _service_instance = SubscriptionBillingService()
    return _service_instance
