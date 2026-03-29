# @AI-HINT: Job alerts API endpoints - saved job alert subscriptions and notification triggers
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

from app.core.security import get_current_user_from_token
from app.services import job_alerts_service

router = APIRouter()

# --- Schemas ---
class JobAlertBase(BaseModel):
    keywords: str
    frequency: str = "daily"
    is_ai_powered: bool = False

class JobAlertCreate(JobAlertBase):
    pass

class JobAlertUpdate(BaseModel):
    keywords: Optional[str] = None
    frequency: Optional[str] = None
    is_ai_powered: Optional[bool] = None

class JobAlert(JobAlertBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Endpoints ---

@router.get("/", response_model=List[JobAlert])
def get_job_alerts(current_user = Depends(get_current_user_from_token)):
    """Get all job alerts for the current user"""
    user_id = current_user.get("user_id")
    return job_alerts_service.get_alerts_for_user(user_id)

@router.post("/", response_model=JobAlert, status_code=status.HTTP_201_CREATED)
def create_job_alert(
    alert: JobAlertCreate,
    current_user = Depends(get_current_user_from_token)
):
    """Create a new job alert"""
    user_id = current_user.get("user_id")
    
    result = job_alerts_service.create_alert(user_id, alert.keywords, alert.frequency, alert.is_ai_powered)
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to create job alert")
    
    return result

@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job_alert(
    alert_id: int,
    current_user = Depends(get_current_user_from_token)
):
    """Delete a job alert"""
    user_id = current_user.get("user_id")
    
    # Check ownership
    owner = job_alerts_service.get_alert_owner(alert_id)
    if owner is None:
        raise HTTPException(status_code=404, detail="Job alert not found")
    if owner != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this alert")
        
    job_alerts_service.delete_alert(alert_id)
    return None

@router.put("/{alert_id}", response_model=JobAlert)
def update_job_alert(
    alert_id: int,
    alert_update: JobAlertUpdate,
    current_user = Depends(get_current_user_from_token)
):
    """Update a job alert"""
    user_id = current_user.get("user_id")
    
    # Check ownership
    current_alert = job_alerts_service.get_alert_by_id(alert_id)
    if not current_alert:
        raise HTTPException(status_code=404, detail="Job alert not found")
    if current_alert["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this alert")
        
    updated = job_alerts_service.update_alert(
        alert_id,
        keywords=alert_update.keywords,
        frequency=alert_update.frequency,
        is_ai_powered=alert_update.is_ai_powered,
    )
    
    return updated
