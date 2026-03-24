# @AI-HINT: Referral System API - Turso-only
"""
Referral System API

Handles:
- Sending referral invitations
- Tracking referral status
- Calculating rewards
- Referral stats
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from datetime import datetime, timezone
import logging
import uuid
import secrets
logger = logging.getLogger(__name__)

from app.core.security import get_current_user_from_token
from app.services import referrals_service

router = APIRouter()

def get_current_user(token_data = Depends(get_current_user_from_token)):
    """Get current user from token"""
    return token_data

def generate_referral_code():
    """Generate a unique referral code"""
    return secrets.token_urlsafe(8)

# ============ ENDPOINTS ============

@router.get("/stats", response_model=dict)
async def get_referral_stats(current_user = Depends(get_current_user)):
    """
    Get referral statistics for the current user.
    """
    user_id = current_user.get("user_id")
    
    stats = referrals_service.get_referral_stats(user_id)
    stats["referral_link"] = f"https://megilance.com/signup?ref={user_id}"
    
    return stats

@router.get("/", response_model=List[dict])
async def list_referrals(
    current_user = Depends(get_current_user)
):
    """
    List all referrals sent by the current user.
    """
    user_id = current_user.get("user_id")
    return referrals_service.list_referrals(user_id)

@router.post("/invite", status_code=status.HTTP_201_CREATED)
async def invite_friend(
    invite_data: dict,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user)
):
    """
    Invite a friend via email.
    """
    user_id = current_user.get("user_id")
    email = invite_data.get("email")
    
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
        
    # Check if already invited
    if referrals_service.check_already_invited(user_id, email):
        raise HTTPException(status_code=400, detail="You have already invited this email")
        
    # Check if user already exists
    if referrals_service.check_user_exists_by_email(email):
        raise HTTPException(status_code=400, detail="User is already a member of MegiLance")
        
    # Create referral record
    code = generate_referral_code()
    referrals_service.create_referral(user_id, email, code)
    
    # Mock sending email
    # background_tasks.add_task(send_referral_email, email, code, current_user)
    
    return {"message": "Invitation sent successfully", "email": email}
