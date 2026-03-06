# @AI-HINT: Webhook management service for third-party integrations (Turso DB-backed)
"""Webhook Service - Outbound webhook management."""

import logging
import hashlib
import hmac
import json
import httpx
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from enum import Enum

from app.db.turso_http import execute_query, parse_rows

logger = logging.getLogger(__name__)

_webhook_tables_ensured = False


def _ensure_webhook_tables():
    global _webhook_tables_ensured
    if _webhook_tables_ensured:
        return
    try:
        execute_query("""
            CREATE TABLE IF NOT EXISTS webhooks (
                id TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                url TEXT NOT NULL,
                events TEXT NOT NULL,
                description TEXT,
                secret TEXT NOT NULL,
                active INTEGER NOT NULL DEFAULT 1,
                success_count INTEGER NOT NULL DEFAULT 0,
                failure_count INTEGER NOT NULL DEFAULT 0,
                last_triggered TEXT,
                secret_rotated_at TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT
            )
        """, [])
        execute_query("""
            CREATE TABLE IF NOT EXISTS webhook_deliveries (
                id TEXT PRIMARY KEY,
                webhook_id TEXT NOT NULL,
                event TEXT NOT NULL,
                payload TEXT,
                status TEXT NOT NULL DEFAULT 'pending',
                attempts INTEGER NOT NULL DEFAULT 0,
                response_code INTEGER,
                error TEXT,
                is_test INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                completed_at TEXT
            )
        """, [])
        execute_query(
            "CREATE INDEX IF NOT EXISTS idx_webhooks_user ON webhooks(user_id)", []
        )
        execute_query(
            "CREATE INDEX IF NOT EXISTS idx_webhook_del_webhook ON webhook_deliveries(webhook_id)", []
        )
        execute_query(
            "CREATE INDEX IF NOT EXISTS idx_webhook_del_event ON webhook_deliveries(event)", []
        )
        _webhook_tables_ensured = True
    except Exception as e:
        logger.error(f"Failed to ensure webhook tables: {e}")


class WebhookEvent(str, Enum):
    """Webhook event types."""
    # User events
    USER_REGISTERED = "user.registered"
    USER_VERIFIED = "user.verified"
    USER_UPDATED = "user.updated"
    
    # Project events
    PROJECT_CREATED = "project.created"
    PROJECT_UPDATED = "project.updated"
    PROJECT_COMPLETED = "project.completed"
    PROJECT_CANCELLED = "project.cancelled"
    
    # Proposal events
    PROPOSAL_SUBMITTED = "proposal.submitted"
    PROPOSAL_ACCEPTED = "proposal.accepted"
    PROPOSAL_REJECTED = "proposal.rejected"
    
    # Contract events
    CONTRACT_CREATED = "contract.created"
    CONTRACT_SIGNED = "contract.signed"
    CONTRACT_COMPLETED = "contract.completed"
    CONTRACT_DISPUTED = "contract.disputed"
    
    # Payment events
    PAYMENT_INITIATED = "payment.initiated"
    PAYMENT_COMPLETED = "payment.completed"
    PAYMENT_FAILED = "payment.failed"
    ESCROW_FUNDED = "escrow.funded"
    ESCROW_RELEASED = "escrow.released"
    
    # Message events
    MESSAGE_SENT = "message.sent"
    MESSAGE_READ = "message.read"
    
    # Review events
    REVIEW_CREATED = "review.created"
    
    # Milestone events
    MILESTONE_COMPLETED = "milestone.completed"
    MILESTONE_APPROVED = "milestone.approved"


class WebhookStatus(str, Enum):
    """Webhook delivery status."""
    PENDING = "pending"
    DELIVERED = "delivered"
    FAILED = "failed"
    RETRYING = "retrying"


class WebhookService:
    """
    Webhook management service with Turso DB persistence.
    
    Handles registration, delivery, and management
    of outbound webhooks for third-party integrations.
    """
    
    def __init__(self, db=None):
        _ensure_webhook_tables()
    
    async def register_webhook(
        self,
        user_id: int,
        url: str,
        events: List[WebhookEvent],
        description: Optional[str] = None
    ) -> Dict[str, Any]:
        webhook_id = f"wh_{secrets.token_urlsafe(16)}"
        secret = secrets.token_urlsafe(32)
        now = datetime.now(timezone.utc).isoformat()
        events_json = json.dumps([e.value for e in events])
        
        execute_query(
            """INSERT INTO webhooks (id, user_id, url, events, description, secret, active,
               success_count, failure_count, created_at)
               VALUES (?, ?, ?, ?, ?, ?, 1, 0, 0, ?)""",
            [webhook_id, user_id, url, events_json, description, secret, now]
        )
        
        logger.info(f"Webhook registered: {webhook_id} for user {user_id}")
        
        return {
            "id": webhook_id,
            "user_id": user_id,
            "url": url,
            "events": [e.value for e in events],
            "description": description,
            "secret": secret,
            "active": True,
            "created_at": now,
            "success_count": 0,
            "failure_count": 0,
            "note": "Save this secret - it won't be shown again"
        }
    
    def _parse_webhook_row(self, row: Dict) -> Dict[str, Any]:
        if row.get("events"):
            try:
                row["events"] = json.loads(row["events"])
            except (json.JSONDecodeError, ValueError):
                row["events"] = []
        else:
            row["events"] = []
        row["active"] = bool(int(row.get("active", 0)))
        return row
    
    async def update_webhook(
        self,
        webhook_id: str,
        user_id: int,
        url: Optional[str] = None,
        events: Optional[List[WebhookEvent]] = None,
        active: Optional[bool] = None,
        description: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        set_parts = ["updated_at = ?"]
        params: list = [datetime.now(timezone.utc).isoformat()]
        
        if url:
            set_parts.append("url = ?")
            params.append(url)
        if events:
            set_parts.append("events = ?")
            params.append(json.dumps([e.value for e in events]))
        if active is not None:
            set_parts.append("active = ?")
            params.append(1 if active else 0)
        if description is not None:
            set_parts.append("description = ?")
            params.append(description)
        
        params.extend([webhook_id, user_id])
        execute_query(
            f"UPDATE webhooks SET {', '.join(set_parts)} WHERE id = ? AND user_id = ?",
            params
        )
        
        wh = await self.get_webhook(webhook_id, user_id)
        return wh
    
    async def delete_webhook(
        self,
        webhook_id: str,
        user_id: int
    ) -> bool:
        execute_query(
            "DELETE FROM webhook_deliveries WHERE webhook_id = ?", [webhook_id]
        )
        execute_query(
            "DELETE FROM webhooks WHERE id = ? AND user_id = ?", [webhook_id, user_id]
        )
        logger.info(f"Webhook deleted: {webhook_id}")
        return True
    
    async def get_webhook(
        self,
        webhook_id: str,
        user_id: int
    ) -> Optional[Dict[str, Any]]:
        result = execute_query(
            """SELECT id, user_id, url, events, description, active,
               success_count, failure_count, last_triggered, created_at, updated_at
               FROM webhooks WHERE id = ? AND user_id = ?""",
            [webhook_id, user_id]
        )
        if not result or not result.get("rows"):
            return None
        rows = parse_rows(result)
        if not rows:
            return None
        row = self._parse_webhook_row(rows[0])
        row["secret"] = "********"
        return row
    
    async def list_webhooks(
        self,
        user_id: int
    ) -> List[Dict[str, Any]]:
        result = execute_query(
            """SELECT id, user_id, url, events, description, active,
               success_count, failure_count, last_triggered, created_at, updated_at
               FROM webhooks WHERE user_id = ? ORDER BY created_at DESC""",
            [user_id]
        )
        webhooks = []
        if result and result.get("rows"):
            for row in parse_rows(result):
                wh = self._parse_webhook_row(row)
                wh["secret"] = "********"
                webhooks.append(wh)
        return webhooks
    
    async def trigger_webhook(
        self,
        event: WebhookEvent,
        payload: Dict[str, Any],
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        where = "active = 1"
        params: list = []
        if user_id:
            where += " AND user_id = ?"
            params.append(user_id)
        
        result = execute_query(
            f"SELECT id, user_id, url, events, secret FROM webhooks WHERE {where}",
            params
        )
        
        triggered = []
        if result and result.get("rows"):
            for row in parse_rows(result):
                events_list = []
                try:
                    events_list = json.loads(row.get("events", "[]"))
                except (json.JSONDecodeError, ValueError):
                    pass
                
                if event.value not in events_list:
                    continue
                
                delivery_id = f"del_{secrets.token_urlsafe(12)}"
                delivery = await self._deliver_webhook(
                    webhook=row,
                    delivery_id=delivery_id,
                    event=event,
                    payload=payload
                )
                triggered.append(delivery)
        
        return {
            "event": event.value,
            "webhooks_triggered": len(triggered),
            "deliveries": triggered
        }
    
    async def get_delivery_logs(
        self,
        webhook_id: str,
        user_id: int,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        # Verify ownership
        wh = await self.get_webhook(webhook_id, user_id)
        if not wh:
            return []
        
        result = execute_query(
            """SELECT id, webhook_id, event, status, attempts, response_code,
               error, is_test, created_at, completed_at
               FROM webhook_deliveries WHERE webhook_id = ?
               ORDER BY created_at DESC LIMIT ?""",
            [webhook_id, limit]
        )
        
        if result and result.get("rows"):
            return parse_rows(result)
        return []
    
    async def retry_delivery(
        self,
        delivery_id: str,
        user_id: int
    ) -> Optional[Dict[str, Any]]:
        result = execute_query(
            """SELECT d.id, d.webhook_id, d.event, d.payload, d.attempts,
                      w.url, w.secret, w.user_id
               FROM webhook_deliveries d
               JOIN webhooks w ON w.id = d.webhook_id
               WHERE d.id = ? AND w.user_id = ?""",
            [delivery_id, user_id]
        )
        if not result or not result.get("rows"):
            return None
        rows = parse_rows(result)
        if not rows:
            return None
        
        row = rows[0]
        payload = {}
        try:
            payload = json.loads(row.get("payload", "{}"))
        except (json.JSONDecodeError, ValueError):
            pass
        
        webhook = {
            "id": row["webhook_id"],
            "url": row["url"],
            "secret": row["secret"],
            "user_id": row["user_id"]
        }
        
        return await self._deliver_webhook(
            webhook=webhook,
            delivery_id=delivery_id,
            event=WebhookEvent(row["event"]),
            payload=payload,
            is_retry=True,
            existing_attempts=int(row.get("attempts", 0))
        )
    
    async def rotate_secret(
        self,
        webhook_id: str,
        user_id: int
    ) -> Optional[Dict[str, Any]]:
        wh = await self.get_webhook(webhook_id, user_id)
        if not wh:
            return None
        
        new_secret = secrets.token_urlsafe(32)
        now = datetime.now(timezone.utc).isoformat()
        execute_query(
            "UPDATE webhooks SET secret = ?, secret_rotated_at = ?, updated_at = ? WHERE id = ? AND user_id = ?",
            [new_secret, now, now, webhook_id, user_id]
        )
        
        return {
            "webhook_id": webhook_id,
            "new_secret": new_secret,
            "note": "Save this secret - it won't be shown again"
        }
    
    async def test_webhook(
        self,
        webhook_id: str,
        user_id: int
    ) -> Dict[str, Any]:
        result = execute_query(
            "SELECT id, url, secret, user_id FROM webhooks WHERE id = ? AND user_id = ?",
            [webhook_id, user_id]
        )
        if not result or not result.get("rows"):
            return {"error": "Webhook not found"}
        rows = parse_rows(result)
        if not rows:
            return {"error": "Webhook not found"}
        
        webhook = rows[0]
        test_payload = {
            "test": True,
            "message": "This is a test webhook delivery",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        delivery_id = f"test_{secrets.token_urlsafe(8)}"
        delivery = await self._deliver_webhook(
            webhook=webhook,
            delivery_id=delivery_id,
            event=WebhookEvent.USER_UPDATED,
            payload=test_payload,
            is_test=True
        )
        
        return {"test": True, "delivery": delivery}
    
    def get_available_events(self) -> List[Dict[str, str]]:
        return [
            {
                "event": event.value,
                "category": event.value.split(".")[0],
                "action": event.value.split(".")[1]
            }
            for event in WebhookEvent
        ]
    
    async def _deliver_webhook(
        self,
        webhook: Dict[str, Any],
        delivery_id: str,
        event: WebhookEvent,
        payload: Dict[str, Any],
        is_retry: bool = False,
        is_test: bool = False,
        existing_attempts: int = 0
    ) -> Dict[str, Any]:
        full_payload = {
            "event": event.value,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "delivery_id": delivery_id,
            "test": is_test,
            "data": payload
        }
        
        payload_json = json.dumps(full_payload)
        signature = self._generate_signature(payload_json, webhook["secret"])
        
        headers = {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
            "X-Webhook-Event": event.value,
            "X-Webhook-Delivery": delivery_id
        }
        
        now = datetime.now(timezone.utc).isoformat()
        attempts = (existing_attempts + 1) if is_retry else 1
        status = WebhookStatus.PENDING.value
        response_code = None
        error_msg = None
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    webhook["url"],
                    content=payload_json,
                    headers=headers
                )
                
                if response.status_code < 300:
                    status = WebhookStatus.DELIVERED.value
                    response_code = response.status_code
                    execute_query(
                        """UPDATE webhooks SET success_count = success_count + 1,
                           last_triggered = ? WHERE id = ?""",
                        [now, webhook["id"]]
                    )
                else:
                    raise Exception(f"HTTP {response.status_code}")
                    
        except Exception as e:
            logger.error(f"Webhook delivery failed: {delivery_id} - {str(e)}")
            error_msg = str(e)
            if attempts < 3:
                status = WebhookStatus.RETRYING.value
            else:
                status = WebhookStatus.FAILED.value
            execute_query(
                "UPDATE webhooks SET failure_count = failure_count + 1 WHERE id = ?",
                [webhook["id"]]
            )
        
        completed_at = datetime.now(timezone.utc).isoformat()
        
        if is_retry:
            execute_query(
                """UPDATE webhook_deliveries SET status = ?, attempts = ?,
                   response_code = ?, error = ?, completed_at = ? WHERE id = ?""",
                [status, attempts, response_code, error_msg, completed_at, delivery_id]
            )
        else:
            execute_query(
                """INSERT INTO webhook_deliveries (id, webhook_id, event, payload, status,
                   attempts, response_code, error, is_test, created_at, completed_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                [delivery_id, webhook["id"], event.value, json.dumps(payload),
                 status, attempts, response_code, error_msg,
                 1 if is_test else 0, now, completed_at]
            )
        
        return {
            "id": delivery_id,
            "webhook_id": webhook["id"],
            "event": event.value,
            "status": status,
            "attempts": attempts,
            "response_code": response_code,
            "error": error_msg
        }
    
    def _generate_signature(
        self,
        payload: str,
        secret: str
    ) -> str:
        return hmac.new(
            secret.encode("utf-8"),
            payload.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()
    
    @staticmethod
    def verify_signature(
        payload: str,
        signature: str,
        secret: str
    ) -> bool:
        expected = hmac.new(
            secret.encode("utf-8"),
            payload.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, signature)


def get_webhook_service(db=None) -> WebhookService:
    """Get webhook service instance."""
    return WebhookService()
