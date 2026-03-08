# @AI-HINT: Timezone management API endpoints
"""
Timezone API - Timezone utilities and user preferences.

Features:
- Timezone list and search
- User preferences
- Time conversion
- Meeting time suggestions
- World clock
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime

from app.core.security import get_current_active_user
from app.services.timezone import get_timezone_service

router = APIRouter(prefix="/timezone", tags=["timezone"])


# Request/Response Models
class SetTimezoneRequest(BaseModel):
    timezone: str
    auto_detect: bool = True
    date_format: str = "MM/DD/YYYY"
    time_format: str = "12h"
    week_start: str = "sunday"


class ConvertTimeRequest(BaseModel):
    time: datetime
    from_timezone: str
    to_timezone: str


class MultiZoneTimeRequest(BaseModel):
    time: datetime
    source_timezone: str
    target_timezones: List[str]


class ParticipantInfo(BaseModel):
    user_id: int
    timezone: str


class SuggestMeetingTimesRequest(BaseModel):
    participants: List[ParticipantInfo]
    duration_minutes: int = 60
    date_range_days: int = 7


class FindOverlapRequest(BaseModel):
    user_ids: List[int]
    include_weekends: bool = False


# Endpoints
@router.get("/list")
async def get_timezones(
    search: Optional[str] = None,
    region: Optional[str] = None,
    
):
    """Get list of all timezones."""
    service = get_timezone_service()
    timezones = await service.get_timezones(search, region)
    return {"timezones": timezones}


@router.get("/regions")
async def get_timezone_regions(
    
):
    """Get list of timezone regions."""
    service = get_timezone_service()
    regions = await service.get_timezone_regions()
    return {"regions": regions}


@router.get("/detect")
async def detect_timezone(
    browser_timezone: Optional[str] = None,
    
):
    """Detect user's timezone."""
    service = get_timezone_service()
    result = await service.detect_timezone(browser_timezone=browser_timezone)
    return result


@router.get("/preferences")
async def get_user_timezone(
    current_user = Depends(get_current_active_user)
):
    """Get user's timezone preference."""
    service = get_timezone_service()
    preferences = await service.get_user_timezone(current_user["id"])
    return {"preferences": preferences}


@router.put("/preferences")
async def set_user_timezone(
    request: SetTimezoneRequest,
    current_user = Depends(get_current_active_user)
):
    """Set user's timezone preference."""
    service = get_timezone_service()
    
    preferences = await service.set_user_timezone(
        user_id=current_user["id"],
        timezone=request.timezone,
        auto_detect=request.auto_detect,
        date_format=request.date_format,
        time_format=request.time_format,
        week_start=request.week_start
    )
    
    return {"preferences": preferences}


@router.post("/convert")
async def convert_time(
    request: ConvertTimeRequest,
    current_user = Depends(get_current_active_user)
):
    """Convert time between timezones."""
    service = get_timezone_service()
    
    result = await service.convert_time(
        time=request.time,
        from_timezone=request.from_timezone,
        to_timezone=request.to_timezone
    )
    
    return result


@router.get("/current/{timezone}")
async def get_current_time(
    timezone: str,
    
):
    """Get current time in a specific timezone."""
    service = get_timezone_service()
    result = await service.get_current_time(timezone)
    return result


@router.post("/convert/multiple")
async def get_time_in_multiple_zones(
    request: MultiZoneTimeRequest,
    current_user = Depends(get_current_active_user)
):
    """Get time in multiple timezones."""
    service = get_timezone_service()
    
    results = await service.get_time_in_multiple_zones(
        time=request.time,
        source_timezone=request.source_timezone,
        target_timezones=request.target_timezones
    )
    
    return {"times": results}


@router.post("/suggest-meeting-times")
async def suggest_meeting_times(
    request: SuggestMeetingTimesRequest,
    current_user = Depends(get_current_active_user)
):
    """Suggest optimal meeting times for participants."""
    service = get_timezone_service()
    
    participants = [p.dict() for p in request.participants]
    
    result = await service.suggest_meeting_times(
        participants=participants,
        duration_minutes=request.duration_minutes,
        date_range_days=request.date_range_days
    )
    
    return result


@router.post("/find-overlap")
async def find_overlapping_hours(
    request: FindOverlapRequest,
    current_user = Depends(get_current_active_user)
):
    """Find overlapping working hours across users."""
    service = get_timezone_service()
    
    result = await service.find_overlapping_hours(
        user_ids=request.user_ids,
        include_weekends=request.include_weekends
    )
    
    return result


@router.get("/world-clock")
async def get_world_clock(
    current_user = Depends(get_current_active_user)
):
    """Get world clock with user's favorite timezones."""
    service = get_timezone_service()
    result = await service.get_world_clock(current_user["id"])
    return result


@router.post("/favorites/{timezone}")
async def add_favorite_timezone(
    timezone: str,
    current_user = Depends(get_current_active_user)
):
    """Add timezone to favorites."""
    service = get_timezone_service()
    result = await service.add_favorite_timezone(current_user["id"], timezone)
    return result


@router.delete("/favorites/{timezone}")
async def remove_favorite_timezone(
    timezone: str,
    current_user = Depends(get_current_active_user)
):
    """Remove timezone from favorites."""
    service = get_timezone_service()
    success = await service.remove_favorite_timezone(current_user["id"], timezone)
    return {"success": success}
