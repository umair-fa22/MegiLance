"""
@AI-HINT: Client and Freelancer portal endpoints - dashboards, projects, proposals
Uses service layer for all DB operations
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
from datetime import datetime, timezone
import json

from app.core.security import get_current_active_user
from app.models.user import User
from app.services import portal_service
from app.services.db_utils import paginate_params
from pydantic import BaseModel

router = APIRouter()


# ============ Pydantic Schemas ============

class ClientDashboardStats(BaseModel):
    total_projects: int
    active_projects: int
    completed_projects: int
    total_spent: float
    active_freelancers: int
    pending_proposals: int

class FreelancerDashboardStats(BaseModel):
    total_earnings: float
    active_projects: int
    completed_projects: int
    pending_proposals: int
    success_rate: float
    average_rating: Optional[float]
    profile_views: Optional[int] = 0
    availability_status: Optional[str] = None
    profile_completeness: Optional[int] = None


class CreateProjectRequest(BaseModel):
    title: str
    description: str
    budget: float
    skills: list
    category: Optional[str] = "Web Development"
    budget_type: Optional[str] = "Fixed"
    timeline: Optional[str] = "1-3 months"


def _safe_str(val):
    """Convert bytes to string if needed"""
    from app.api.v1.utils import safe_str
    return safe_str(val)


# ============ Helper Functions ============

async def get_client_user(current_user: User = Depends(get_current_active_user)):
    """Verify that current user is a client"""
    user_type = _safe_str(current_user.user_type)
    if user_type not in ['Client', 'client']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Client access required"
        )
    return current_user

async def get_freelancer_user(current_user: User = Depends(get_current_active_user)):
    """Verify that current user is a freelancer"""
    user_type = _safe_str(current_user.user_type)
    if user_type not in ['Freelancer', 'freelancer']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Freelancer access required"
        )
    return current_user


# ============ CLIENT PORTAL ENDPOINTS ============

@router.get("/client/dashboard/stats", response_model=ClientDashboardStats)
async def get_client_dashboard_stats(client: User = Depends(get_client_user)):
    """Get client dashboard statistics"""
    data = portal_service.get_client_stats(client.id)
    return ClientDashboardStats(**data)


@router.get("/client/projects")
async def get_client_projects(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    client: User = Depends(get_client_user)
):
    """Get client's projects"""
    offset, limit = paginate_params(page, page_size)
    return portal_service.get_client_projects_list(client.id, status, limit, offset)


@router.post("/client/projects", status_code=status.HTTP_201_CREATED)
async def create_client_project(
    project_data: CreateProjectRequest,
    client: User = Depends(get_client_user)
):
    """Create a new project"""
    now = datetime.now(timezone.utc).isoformat()

    budget_min = project_data.budget * 0.8 if project_data.budget_type == 'Fixed' else project_data.budget
    budget_max = project_data.budget

    result = portal_service.create_project(
        client.id, project_data.title, project_data.description,
        budget_min, budget_max, project_data.budget_type, project_data.category,
        project_data.timeline, project_data.skills, now
    )

    if not result:
        raise HTTPException(status_code=500, detail="Failed to create project")

    return {
        "id": result["id"],
        "title": result["title"],
        "status": result["status"],
        "message": "Project created successfully"
    }


@router.get("/client/proposals")
async def get_client_proposals(
    project_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    client: User = Depends(get_client_user)
):
    """Get proposals for client's projects"""
    offset, limit = paginate_params(page, page_size)
    return portal_service.get_client_proposals_list(client.id, project_id, limit, offset)


@router.get("/client/payments")
async def get_client_payments(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    client: User = Depends(get_client_user)
):
    """Get client's payment history"""
    offset, limit = paginate_params(page, page_size)
    return portal_service.get_payments_list(client.id, "from", limit, offset)


@router.get("/client/spending/monthly")
async def get_client_monthly_spending(
    months: int = Query(6, ge=1, le=12),
    client: User = Depends(get_client_user)
):
    """Get client's monthly spending for chart display"""
    from datetime import timedelta

    monthly_data = portal_service.get_monthly_payment_data(client.id, "from", months)

    spending = []
    today = datetime.now()
    month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    for i in range(months - 1, -1, -1):
        target_date = today - timedelta(days=i * 30)
        month_key = target_date.strftime('%Y-%m')
        month_name = month_names[target_date.month - 1]
        spending.append({
            "name": month_name,
            "spending": monthly_data.get(month_key, 0)
        })

    return {"spending": spending}


@router.get("/client/wallet")
async def get_client_wallet(client: User = Depends(get_client_user)):
    """Get client's wallet balance and transactions"""
    wallet = portal_service.get_wallet_payments(client.id, "from")

    return {
        "balance": float(client.account_balance or 0.0) if hasattr(client, 'account_balance') else 0.0,
        "currency": "USD",
        "pending_payments": wallet["pending"],
        "total_spent": wallet["completed"]
    }


# ============ FREELANCER PORTAL ENDPOINTS ============

@router.get("/freelancer/dashboard/stats", response_model=FreelancerDashboardStats)
async def get_freelancer_dashboard_stats(freelancer: User = Depends(get_freelancer_user)):
    """Get freelancer dashboard statistics"""
    data = portal_service.get_freelancer_stats(freelancer.id)
    data["profile_views"] = getattr(freelancer, "profile_views", 0) or 0
    data["availability_status"] = getattr(freelancer, "availability_status", None)
    from app.services.profile_validation import get_profile_completeness
    data["profile_completeness"] = get_profile_completeness(freelancer)
    return FreelancerDashboardStats(**data)


@router.get("/freelancer/dashboard")
async def get_freelancer_dashboard(freelancer: User = Depends(get_freelancer_user)):
    """Get freelancer dashboard overview (alias for dashboard/stats)"""
    data = portal_service.get_freelancer_stats(freelancer.id)
    data["profile_views"] = getattr(freelancer, "profile_views", 0) or 0
    data["availability_status"] = getattr(freelancer, "availability_status", None)
    from app.services.profile_validation import get_profile_completeness
    data["profile_completeness"] = get_profile_completeness(freelancer)
    return FreelancerDashboardStats(**data)


@router.get("/freelancer/stats")
async def get_freelancer_stats_alias(freelancer: User = Depends(get_freelancer_user)):
    """Get freelancer stats (alias for dashboard/stats)"""
    data = portal_service.get_freelancer_stats(freelancer.id)
    data["profile_views"] = getattr(freelancer, "profile_views", 0) or 0
    data["availability_status"] = getattr(freelancer, "availability_status", None)
    from app.services.profile_validation import get_profile_completeness
    data["profile_completeness"] = get_profile_completeness(freelancer)
    return FreelancerDashboardStats(**data)


@router.get("/freelancer/reviews")
async def get_freelancer_reviews(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    freelancer: User = Depends(get_freelancer_user)
):
    """Get freelancer's reviews"""
    from app.db.turso_http import execute_query
    offset = (page - 1) * page_size
    result = execute_query(
        """SELECT r.id, r.rating, r.comment, r.created_at, u.name as reviewer_name
           FROM reviews r LEFT JOIN users u ON r.reviewer_id = u.id
           WHERE r.reviewee_id = ? ORDER BY r.created_at DESC LIMIT ? OFFSET ?""",
        [freelancer.id, page_size, offset]
    )
    cols = result.get("columns", result.get("cols", []))
    _cn = lambda c: c.get("name", c) if isinstance(c, dict) else c
    _cv = lambda c: c.get("value") if isinstance(c, dict) else c
    reviews = [{_cn(c): _cv(v) for c, v in zip(cols, r)} for r in result.get("rows", [])]
    return {"reviews": reviews, "total": len(reviews)}


@router.get("/freelancer/notifications")
async def get_freelancer_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    freelancer: User = Depends(get_freelancer_user)
):
    """Get freelancer's notifications"""
    from app.db.turso_http import execute_query
    offset = (page - 1) * page_size
    result = execute_query(
        """SELECT id, type, title, message, is_read, created_at
           FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?""",
        [freelancer.id, page_size, offset]
    )
    cols = result.get("columns", result.get("cols", []))
    _cn = lambda c: c.get("name", c) if isinstance(c, dict) else c
    _cv = lambda c: c.get("value") if isinstance(c, dict) else c
    notifications = [{_cn(c): _cv(v) for c, v in zip(cols, r)} for r in result.get("rows", [])]
    return {"notifications": notifications, "total": len(notifications)}


@router.get("/freelancer/jobs")
async def get_freelancer_jobs(
    category: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    freelancer: User = Depends(get_freelancer_user)
):
    """Get available jobs for freelancer"""
    offset, limit = paginate_params(page, page_size)
    return portal_service.get_available_jobs(category, limit, offset)


@router.get("/freelancer/projects")
async def get_freelancer_projects(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    freelancer: User = Depends(get_freelancer_user)
):
    """Get freelancer's active contracts/projects"""
    offset, limit = paginate_params(page, page_size)
    return portal_service.get_freelancer_contracts(freelancer.id, status, limit, offset)


@router.post("/freelancer/proposals", status_code=status.HTTP_201_CREATED)
async def submit_freelancer_proposal(
    project_id: int,
    cover_letter: str,
    bid_amount: float,
    delivery_time: int,
    freelancer: User = Depends(get_freelancer_user)
):
    """Submit a proposal for a project"""
    if not portal_service.check_project_exists(project_id):
        raise HTTPException(status_code=404, detail="Project not found")

    if portal_service.check_proposal_exists(project_id, freelancer.id):
        raise HTTPException(status_code=400, detail="Proposal already submitted for this project")

    now = datetime.now(timezone.utc).isoformat()
    hourly_rate = bid_amount / delivery_time if delivery_time > 0 else float(freelancer.hourly_rate or 0)

    proposal_id = portal_service.create_proposal(
        project_id, freelancer.id, cover_letter, delivery_time, hourly_rate, now
    )

    if proposal_id is None:
        raise HTTPException(status_code=500, detail="Failed to submit proposal")

    return {
        "id": proposal_id,
        "project_id": project_id,
        "status": "submitted",
        "message": "Proposal submitted successfully"
    }


@router.get("/freelancer/proposals")
async def get_freelancer_proposals(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    freelancer: User = Depends(get_freelancer_user)
):
    """Get freelancer's submitted proposals"""
    offset, limit = paginate_params(page, page_size)
    return portal_service.get_freelancer_proposals_list(freelancer.id, limit, offset)


@router.get("/freelancer/portfolio")
async def get_freelancer_portfolio(freelancer: User = Depends(get_freelancer_user)):
    """Get freelancer's portfolio items"""
    items = portal_service.get_freelancer_portfolio_items(freelancer.id)
    return {"portfolio_items": items}


@router.get("/freelancer/skills")
async def get_freelancer_skills(freelancer: User = Depends(get_freelancer_user)):
    """Get freelancer's skills"""
    skills_data = []
    skills_str = _safe_str(freelancer.skills)
    if skills_str:
        try:
            skills_data = json.loads(skills_str)
        except json.JSONDecodeError:
            skills_data = [s.strip() for s in skills_str.split(",") if s.strip()]

    return {
        "skills": skills_data,
        "hourly_rate": float(freelancer.hourly_rate or 0.0) if hasattr(freelancer, 'hourly_rate') else 0.0
    }


@router.get("/freelancer/earnings")
async def get_freelancer_earnings(freelancer: User = Depends(get_freelancer_user)):
    """Get freelancer's earnings breakdown"""
    wallet = portal_service.get_wallet_payments(freelancer.id, "to")

    return {
        "total_earnings": wallet["completed"],
        "pending_earnings": wallet["pending"],
        "available_balance": float(freelancer.account_balance or 0.0) if hasattr(freelancer, 'account_balance') else 0.0,
        "currency": "USD"
    }


@router.get("/freelancer/wallet")
async def get_freelancer_wallet(freelancer: User = Depends(get_freelancer_user)):
    """Get freelancer's wallet balance"""
    wallet = portal_service.get_wallet_payments(freelancer.id, "to")

    return {
        "balance": float(freelancer.account_balance or 0.0) if hasattr(freelancer, 'account_balance') else 0.0,
        "currency": "USD",
        "pending_earnings": wallet["pending"],
        "total_earned": wallet["completed"]
    }


@router.get("/freelancer/earnings/monthly")
async def get_freelancer_monthly_earnings(
    months: int = Query(6, ge=1, le=12),
    freelancer: User = Depends(get_freelancer_user)
):
    """Get freelancer's monthly earnings for chart display"""
    from datetime import timedelta

    monthly_data = portal_service.get_monthly_payment_data(freelancer.id, "to", months)

    earnings = []
    today = datetime.now()
    month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    for i in range(months - 1, -1, -1):
        target_date = today - timedelta(days=i * 30)
        month_key = target_date.strftime('%Y-%m')
        month_name = month_names[target_date.month - 1]
        earnings.append({
            "month": month_name,
            "amount": monthly_data.get(month_key, 0)
        })

    return {"earnings": earnings}


@router.get("/freelancer/payments")
async def get_freelancer_payments(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    freelancer: User = Depends(get_freelancer_user)
):
    """Get freelancer's payment history"""
    offset, limit = paginate_params(page, page_size)
    return portal_service.get_payments_list(freelancer.id, "to", limit, offset)


# ============ SHARED ENDPOINTS ============

@router.get("/freelancers")
async def list_freelancers(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200)
):
    """List all freelancers - public endpoint"""
    offset, limit = paginate_params(page, page_size)
    return portal_service.list_all_freelancers(limit, offset)

class WithdrawRequest(BaseModel):
    amount: float

@router.post("/freelancer/withdraw")
async def withdraw_funds(
    body: WithdrawRequest,
    freelancer: User = Depends(get_freelancer_user)
):
    """Withdraw funds from wallet"""
    if body.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")
    current_balance = float(freelancer.account_balance or 0.0)
    if body.amount > current_balance:
        raise HTTPException(status_code=400, detail="Insufficient funds")

    now = datetime.now(timezone.utc).isoformat()

    success = portal_service.create_withdrawal(freelancer.id, body.amount, now)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to process withdrawal")

    new_balance = current_balance - body.amount
    portal_service.update_user_balance(freelancer.id, new_balance)

    return {"message": "Withdrawal requested successfully", "new_balance": new_balance}
