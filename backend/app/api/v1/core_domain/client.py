# @AI-HINT: Client-specific API endpoints - delegates to client_service
from fastapi import APIRouter, Depends, HTTPException
from typing import List

from app.core.security import get_current_user_from_token
from app.services import client_service
from app.schemas.client import ClientJobCreate
import logging

logger = logging.getLogger("megilance")

router = APIRouter()


@router.get("/projects", response_model=List[dict])
def get_client_projects(
    current_user = Depends(get_current_user_from_token)
):
    """
    Get client projects with transformed data structure for frontend
    """
    return client_service.get_client_projects(current_user["user_id"])


@router.get("/payments", response_model=List[dict])
def get_client_payments(
    current_user = Depends(get_current_user_from_token)
):
    """
    Get client payments with transformed data structure for frontend
    """
    return client_service.get_client_payments(current_user["user_id"])


@router.get("/freelancers", response_model=List[dict])
def get_client_freelancers(
    current_user = Depends(get_current_user_from_token)
):
    """
    Get freelancers that have worked with the client
    """
    return client_service.get_client_freelancers(current_user["user_id"])


@router.get("/reviews", response_model=List[dict])
def get_client_reviews(
    current_user = Depends(get_current_user_from_token)
):
    """
    Get reviews for the client
    """
    return client_service.get_client_reviews(current_user["user_id"])


@router.post("/jobs")
def create_client_job(
    job_data: ClientJobCreate,
    current_user = Depends(get_current_user_from_token)
):
    """
    Create a new job posting for the client
    """
    try:
        return client_service.create_job(current_user["user_id"], job_data.model_dump())
    except Exception as e:
        logger.error("create_client_job failed: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred. Please try again.")
