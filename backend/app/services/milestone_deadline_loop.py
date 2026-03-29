# @AI-HINT: Background scheduler to notify users when a milestone is overdue.
import asyncio
import logging
import json
from datetime import datetime, timezone
from app.db.turso_http import execute_query
from app.services.notifications_service import insert_notification

logger = logging.getLogger(__name__)

async def check_overdue_milestones_loop():
    """
    Periodically checks for milestones that are overdue and sends a notification.
    """
    logger.info("Milestone Deadline Scheduler started")
    while True:
        try:
            now_iso = datetime.now(timezone.utc).isoformat()
            
            # Find milestones that are overdue and not complete
            result = execute_query("""
                SELECT m.id, m.contract_id, m.title, c.client_id, c.freelancer_id
                FROM milestones m
                JOIN contracts c ON m.contract_id = c.id
                WHERE m.status IN ('pending', 'in_progress')
                AND m.due_date < ?
            """, [now_iso])
            
            if result and result.get("rows"):
                for row in result["rows"]:
                    if not row or len(row) < 5: continue
                    milestone_id = int(row[0].get("value")) if row[0] is not None and row[0].get("value") is not None else 0
                    contract_id = int(row[1].get("value")) if row[1] is not None and row[1].get("value") is not None else 0
                    title = row[2].get("value") if row[2] is not None and row[2].get("value") is not None else "Unknown Milestone"
                    client_id = int(row[3].get("value")) if row[3] is not None and row[3].get("value") is not None else 0
                    freelancer_id = int(row[4].get("value")) if row[4] is not None and row[4].get("value") is not None else 0
                    
                    if not milestone_id or not client_id or not freelancer_id: continue

                    # Check if already notified
                    data_str_like = f"%\"milestone_id\": {milestone_id}%"
                    try:
                        notif_check = execute_query("""
                            SELECT id FROM notifications 
                            WHERE notification_type = 'milestone_overdue' 
                            AND user_id = ? 
                            AND data LIKE ?
                        """, [freelancer_id, data_str_like])
                    except Exception as e:
                        notif_check = None
                    
                    if notif_check and notif_check.get("rows") and len(notif_check["rows"]) > 0:
                        # Already notified
                        continue
                        
                    logger.info(f"Notifying users for overdue milestone {milestone_id}")
                    
                    data_json = json.dumps({
                        "milestone_id": milestone_id,
                        "contract_id": contract_id,
                        "type": "overdue"
                    })
                    
                    # Notify Freelancer
                    insert_notification(
                        user_id=freelancer_id,
                        notification_type="milestone_overdue",
                        title="Milestone Overdue",
                        content=f"Your milestone '{title}' is overdue! Please submit your work or update the client.",
                        data_json=data_json,
                        priority="high",
                        action_url=f"/dashboard/freelancer/contracts/{contract_id}",
                        expires_at=None,
                        now=now_iso
                    )
                    
                    # Notify Client
                    insert_notification(
                        user_id=client_id,
                        notification_type="milestone_overdue",
                        title="Milestone Overdue",
                        content=f"The milestone '{title}' from your freelancer is overdue.",
                        data_json=data_json,
                        priority="high",
                        action_url=f"/dashboard/client/contracts/{contract_id}",
                        expires_at=None,
                        now=now_iso
                    )
                    
        except Exception as e:
            logger.error(f"Error in milestone deadline loop: {e}")
            
        # Check every 12 hours (43200 seconds)
        await asyncio.sleep(43200)

_overdue_task = None

def start_overdue_scheduler():
    global _overdue_task
    _overdue_task = asyncio.create_task(check_overdue_milestones_loop())
    
def stop_overdue_scheduler():
    global _overdue_task
    if _overdue_task:
        _overdue_task.cancel()