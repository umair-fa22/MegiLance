# @AI-HINT: Background scheduler to auto-release funds for submitted milestones after a timeout period.
import asyncio
import logging
from datetime import datetime, timedelta, timezone
from app.db.turso_http import execute_query
from app.services.milestones_service import get_milestone_for_approval, approve_milestone, create_payment_record, get_contract_parties, check_and_complete_contract

logger = logging.getLogger(__name__)

# Config: Number of days without client action before a milestone auto-approves
AUTO_APPROVAL_DAYS = 14

async def auto_release_escrow_loop():
    """
    Periodically checks for milestones that have been in 'submitted' status
    for over AUTO_APPROVAL_DAYS days and auto-approves them.
    """
    logger.info(f"Escrow Auto-Release Scheduler started (Timeout: {AUTO_APPROVAL_DAYS} days)")
    while True:
        try:
            # Calculate the cutoff date
            cutoff_date = (datetime.now(timezone.utc) - timedelta(days=AUTO_APPROVAL_DAYS)).isoformat()
            
            # Find milestones that were submitted before cutoff date and are still 'submitted'
            result = execute_query("""
                SELECT id 
                FROM milestones 
                WHERE status = 'submitted' 
                AND submitted_at < ?
            """, [cutoff_date])
            
            if result and result.get("rows"):
                for row in result["rows"]:
                    milestone_id = int(row[0].get("value"))
                    logger.info(f"Auto-releasing escrow for milestone {milestone_id}")
                    try:
                        ms = get_milestone_for_approval(milestone_id)
                        if not ms:
                            continue
                            
                        amount = ms["amount"]
                        contract_id = ms["contract_id"]
                        
                        parties = get_contract_parties(contract_id)
                        if not parties:
                            continue
                            
                        client_id = parties["client_id"]
                        freelancer_id = parties["freelancer_id"]
                        
                        # Set platform fee (e.g. 10%)
                        from app.core.config import get_settings
                        settings = get_settings()
                        fee_percent = float(getattr(settings, "STRIPE_PLATFORM_FEE_PERCENT", 10.0)) / 100.0
                        
                        platform_fee = amount * fee_percent
                        freelancer_amount = amount - platform_fee
                        
                        # 1. Update milestone to approved
                        approve_milestone(milestone_id, "Auto-approved by scheduler after 14 days of no action.")
                        
                        # 2. Create the payment record
                        create_payment_record(
                            contract_id=contract_id,
                            milestone_id=milestone_id,
                            client_id=client_id,
                            freelancer_id=freelancer_id,
                            amount=amount,
                            platform_fee=platform_fee,
                            freelancer_amount=freelancer_amount,
                            title=ms["title"]
                        )
                        
                        # 3. Complete contract if this was the last milestone
                        check_and_complete_contract(contract_id)
                        
                        logger.info(f"Successfully auto-approved milestone {milestone_id}.")
                        
                    except Exception as loop_e:
                        logger.error(f"Failed to auto-release milestone {milestone_id}: {loop_e}")
                        
        except Exception as e:
            logger.error(f"Error in escrow auto-release loop: {e}")
            
        # Check every 12 hours (43200 seconds)
        await asyncio.sleep(43200)

_auto_release_task = None

def start_escrow_scheduler():
    global _auto_release_task
    _auto_release_task = asyncio.create_task(auto_release_escrow_loop())
    
def stop_escrow_scheduler():
    global _auto_release_task
    if _auto_release_task:
        _auto_release_task.cancel()
