# Contact Form API - Handle contact form submissions
"""
Contact form endpoint for MegiLance.
Stores inquiries in Turso database and sends notification emails.
"""
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from datetime import datetime
import httpx
from app.core.config import get_settings
settings = get_settings()
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class ContactSubmission(BaseModel):
    name: str
    email: EmailStr
    topic: str  # support, sales, partnerships
    message: str


class ContactResponse(BaseModel):
    success: bool
    message: str


@router.post("/contact", response_model=ContactResponse)
async def submit_contact_form(submission: ContactSubmission):
    """
    Submit a contact form inquiry.
    Stores the message in database for admin review.
    """
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Create contacts table if not exists
            create_table_sql = """
                CREATE TABLE IF NOT EXISTS contact_inquiries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    topic TEXT NOT NULL,
                    message TEXT NOT NULL,
                    status TEXT DEFAULT 'pending',
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    responded_at TEXT
                )
            """
            await client.post(
                settings.TURSO_DATABASE_URL,
                headers={
                    "Authorization": f"Bearer {settings.TURSO_AUTH_TOKEN}",
                    "Content-Type": "application/json",
                },
                json={"statements": [create_table_sql]},
            )

            # Insert the contact submission
            insert_sql = """
                INSERT INTO contact_inquiries (name, email, topic, message, created_at)
                VALUES (?, ?, ?, ?, ?)
            """
            insert_response = await client.post(
                settings.TURSO_DATABASE_URL,
                headers={
                    "Authorization": f"Bearer {settings.TURSO_AUTH_TOKEN}",
                    "Content-Type": "application/json",
                },
                json={
                    "statements": [
                        {
                            "q": insert_sql,
                            "params": [
                                submission.name,
                                submission.email,
                                submission.topic,
                                submission.message,
                                datetime.utcnow().isoformat(),
                            ],
                        }
                    ]
                },
            )

            if insert_response.status_code != 200:
                logger.error(f"Failed to store contact: {insert_response.text}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to save your message. Please try again.",
                )

        logger.info(f"Contact form submitted by {submission.email} - topic: {submission.topic}")

        return ContactResponse(
            success=True,
            message="Thank you for your message! We'll get back to you within 24 hours.",
        )

    except httpx.RequestError as e:
        logger.error(f"Network error storing contact form: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service temporarily unavailable. Please try again.",
        )
    except Exception as e:
        logger.error(f"Error processing contact form: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred. Please try again later.",
        )


@router.get("/contact/inquiries")
async def get_contact_inquiries(status_filter: str = None, limit: int = 50):
    """
    Admin endpoint to retrieve contact form inquiries.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            if status_filter:
                query = "SELECT * FROM contact_inquiries WHERE status = ? ORDER BY created_at DESC LIMIT ?"
                params = [status_filter, limit]
            else:
                query = "SELECT * FROM contact_inquiries ORDER BY created_at DESC LIMIT ?"
                params = [limit]

            response = await client.post(
                settings.TURSO_DATABASE_URL,
                headers={
                    "Authorization": f"Bearer {settings.TURSO_AUTH_TOKEN}",
                    "Content-Type": "application/json",
                },
                json={"statements": [{"q": query, "params": params}]},
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to fetch inquiries",
                )

            data = response.json()
            results = data.get("results", [{}])[0]
            rows = results.get("rows", [])
            columns = results.get("columns", [])

            inquiries = []
            for row in rows:
                inquiry = dict(zip(columns, row))
                inquiries.append(inquiry)

            return {"inquiries": inquiries, "total": len(inquiries)}

    except Exception as e:
        logger.error(f"Error fetching contact inquiries: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch inquiries",
        )


@router.patch("/contact/inquiries/{inquiry_id}/status")
async def update_inquiry_status(inquiry_id: int, new_status: str):
    """
    Update the status of a contact inquiry.
    """
    valid_statuses = ["pending", "in_progress", "resolved", "spam"]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {valid_statuses}",
        )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            responded_at = datetime.utcnow().isoformat() if new_status == "resolved" else None
            
            update_sql = """
                UPDATE contact_inquiries 
                SET status = ?, responded_at = ?
                WHERE id = ?
            """
            response = await client.post(
                settings.TURSO_DATABASE_URL,
                headers={
                    "Authorization": f"Bearer {settings.TURSO_AUTH_TOKEN}",
                    "Content-Type": "application/json",
                },
                json={
                    "statements": [
                        {"q": update_sql, "params": [new_status, responded_at, inquiry_id]}
                    ]
                },
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update inquiry status",
                )

            return {"success": True, "inquiry_id": inquiry_id, "new_status": new_status}

    except Exception as e:
        logger.error(f"Error updating inquiry status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update status",
        )
