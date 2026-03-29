# @AI-HINT: Analytics API endpoints - delegates to analytics_service for all data access
from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List
from datetime import datetime, timedelta, timezone

from app.core.security import get_current_user, require_admin
from app.services import analytics_service
from app.db.turso_http import get_turso_http
from app.schemas.analytics_schemas import (
    RegistrationTrendResponse,
    ActiveUsersStatsResponse,
    LocationDistributionResponse,
    ProjectStatsResponse,
    CompletionRateResponse,
    CategoryPopularityResponse,
    RevenueStatsResponse,
    RevenueTrendResponse,
    TopFreelancerResponse,
    FreelancerSuccessRateResponse,
    TopClientResponse,
    PlatformHealthResponse,
    EngagementMetricsResponse,
    IntervalEnum,
    SortByEnum
)
import logging

logger = logging.getLogger("megilance")

router = APIRouter()


# ==================== User Analytics ====================

@router.get(
    "/users/registration-trends",
    response_model=List[RegistrationTrendResponse],
    summary="Get user registration trends"
)
async def get_registration_trends(
    start_date: datetime = Query(..., description="Start date for analysis"),
    end_date: datetime = Query(..., description="End date for analysis"),
    interval: IntervalEnum = Query(default=IntervalEnum.day, description="Aggregation interval"),
    current_user = Depends(require_admin)
):
    """Get user registration trends over a specified time period. Admin only."""
    return analytics_service.get_registration_trends(
        start_date.isoformat(), end_date.isoformat(), interval.value
    )


@router.get(
    "/users/active-stats",
    response_model=ActiveUsersStatsResponse,
    summary="Get active user statistics"
)
async def get_active_user_stats(
    days: int = Query(default=30, ge=1, le=365, description="Number of days to look back"),
    current_user = Depends(require_admin)
):
    """Get active user statistics for the specified period. Admin only."""
    return analytics_service.get_active_user_stats(days)


@router.get(
    "/users/location-distribution",
    response_model=List[LocationDistributionResponse],
    summary="Get user location distribution"
)
async def get_location_distribution(
    current_user = Depends(require_admin)
):
    """Get user distribution by location. Admin only."""
    return analytics_service.get_location_distribution()


# ==================== Project Analytics ====================

@router.get(
    "/projects/stats",
    response_model=ProjectStatsResponse,
    summary="Get project statistics"
)
async def get_project_stats(
    current_user = Depends(require_admin)
):
    """Get overall project statistics. Admin only."""
    return analytics_service.get_project_stats()


@router.get(
    "/projects/completion-rate",
    response_model=CompletionRateResponse,
    summary="Get project completion rate"
)
async def get_completion_rate(
    current_user = Depends(require_admin)
):
    """Get project completion rate. Admin only."""
    return analytics_service.get_completion_rate()


@router.get(
    "/projects/popular-categories",
    response_model=List[CategoryPopularityResponse],
    summary="Get popular project categories"
)
async def get_popular_categories(
    limit: int = Query(default=10, ge=1, le=50),
    current_user = Depends(require_admin)
):
    """Get most popular project categories. Admin only."""
    return analytics_service.get_popular_categories(limit)


# ==================== Revenue Analytics ====================

@router.get(
    "/revenue/stats",
    response_model=RevenueStatsResponse,
    summary="Get revenue statistics"
)
async def get_revenue_stats(
    start_date: datetime = Query(..., description="Start date"),
    end_date: datetime = Query(..., description="End date"),
    current_user = Depends(require_admin)
):
    """Get revenue statistics for a date range. Admin only."""
    return analytics_service.get_revenue_stats(
        start_date.isoformat(), end_date.isoformat()
    )


@router.get(
    "/revenue/trends",
    response_model=List[RevenueTrendResponse],
    summary="Get revenue trends"
)
async def get_revenue_trends(
    start_date: datetime = Query(..., description="Start date"),
    end_date: datetime = Query(..., description="End date"),
    interval: IntervalEnum = Query(default=IntervalEnum.day),
    current_user = Depends(require_admin)
):
    """Get revenue trends over time. Admin only."""
    return analytics_service.get_revenue_trends(
        start_date.isoformat(), end_date.isoformat(), interval.value
    )


# ==================== Freelancer Analytics ====================

@router.get(
    "/freelancers/top",
    response_model=List[TopFreelancerResponse],
    summary="Get top freelancers"
)
async def get_top_freelancers(
    limit: int = Query(default=10, ge=1, le=100),
    sort_by: SortByEnum = Query(default=SortByEnum.earnings),
    current_user = Depends(require_admin)
):
    """Get top performing freelancers. Admin only."""
    return analytics_service.get_top_freelancers(limit, sort_by.value)


@router.get(
    "/freelancers/{freelancer_id}/success-rate",
    response_model=FreelancerSuccessRateResponse,
    summary="Get freelancer success metrics"
)
async def get_freelancer_success_rate(
    freelancer_id: int,
    current_user = Depends(get_current_user)
):
    """Get success metrics for a specific freelancer. Accessible by freelancer or admin."""
    user_type = current_user.get("user_type", "").lower()
    role = current_user.get("role", "").lower()
    
    if current_user["id"] != freelancer_id and user_type != "admin" and role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    return analytics_service.get_freelancer_success_rate(freelancer_id)


# ==================== Client Analytics ====================

@router.get(
    "/clients/top",
    response_model=List[TopClientResponse],
    summary="Get top clients"
)
async def get_top_clients(
    limit: int = Query(default=10, ge=1, le=100),
    current_user = Depends(require_admin)
):
    """Get top clients by spending. Admin only."""
    return analytics_service.get_top_clients(limit)


# ==================== Platform Health ====================

@router.get(
    "/platform/health",
    response_model=PlatformHealthResponse,
    summary="Get platform health metrics"
)
async def get_platform_health(
    current_user = Depends(require_admin)
):
    """Get platform health metrics. Admin only."""
    return analytics_service.get_platform_health()


@router.get(
    "/platform/engagement",
    response_model=EngagementMetricsResponse,
    summary="Get engagement metrics"
)
async def get_engagement_metrics(
    days: int = Query(default=30, ge=1, le=365),
    current_user = Depends(require_admin)
):
    """Get user engagement metrics. Admin only."""
    return analytics_service.get_engagement_metrics(days)


# ==================== Cohort & Growth Analytics ====================

@router.get(
    "/cohorts/registration",
    summary="Get registration cohort analysis"
)
async def get_registration_cohorts(
    months: int = Query(default=6, ge=2, le=12, description="Number of months to analyze"),
    current_user = Depends(require_admin)
):
    """Monthly cohort retention analysis. Admin only."""
    return analytics_service.get_registration_cohort_analysis(months)


@router.get(
    "/funnel/conversion",
    summary="Get platform conversion funnel"
)
async def get_conversion_funnel(
    current_user = Depends(require_admin)
):
    """Platform conversion funnel from registration to payment. Admin only."""
    return analytics_service.get_conversion_funnel()


@router.get(
    "/growth/summary",
    summary="Get platform growth summary"
)
async def get_growth_summary(
    current_user = Depends(require_admin)
):
    """Key metrics with week-over-week and month-over-month changes. Admin only."""
    return analytics_service.get_growth_summary()


# ==================== Dashboard Summary ====================

@router.get(
    "/dashboard/summary",
    summary="Get dashboard summary"
)
async def get_dashboard_summary(
    current_user = Depends(require_admin)
):
    """Get comprehensive dashboard summary. Admin only."""
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)
    
    return {
        "users": analytics_service.get_active_user_stats(30),
        "projects": analytics_service.get_project_stats(),
        "revenue": analytics_service.get_revenue_stats(
            thirty_days_ago.isoformat(), now.isoformat()
        ),
        "health": analytics_service.get_platform_health(),
        "engagement": analytics_service.get_engagement_metrics(30)
    }


# ==================== User-Facing Dashboards ====================

@router.get(
    "/dashboard/freelancer",
    summary="Get freelancer personal dashboard"
)
async def get_freelancer_dashboard(
    period: str = Query("month", pattern=r'^(week|month|quarter|year)$'),
    current_user = Depends(get_current_user)
):
    """
    Comprehensive freelancer dashboard with earnings, proposal stats,
    active contracts, and performance metrics. Accessible by the freelancer only.
    """
    user_id = current_user.get("user_id") or current_user.get("id")
    user_type = (current_user.get("user_type") or "").lower()
    if user_type != "freelancer":
        raise HTTPException(status_code=403, detail="Only freelancers can access this dashboard")

    try:
        turso = get_turso_http()
        now = datetime.now(timezone.utc)
        period_days = {"week": 7, "month": 30, "quarter": 90, "year": 365}
        period_start = (now - timedelta(days=period_days[period])).isoformat()

        # Earnings in period
        earnings = turso.fetch_one(
            """SELECT COALESCE(SUM(amount), 0), COUNT(*),
                      COALESCE(SUM(platform_fee), 0)
               FROM payments WHERE to_user_id = ? AND status = 'completed'
               AND created_at >= ?""",
            [user_id, period_start]
        )
        period_earnings = round(float(earnings[0]), 2) if earnings else 0
        period_transactions = int(earnings[1]) if earnings else 0
        period_fees = round(float(earnings[2]), 2) if earnings else 0

        # All-time earnings
        all_time = turso.fetch_one(
            "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE to_user_id = ? AND status = 'completed'",
            [user_id]
        )
        all_time_earnings = round(float(all_time[0]), 2) if all_time else 0

        # Active contracts
        active_contracts = turso.fetch_one(
            "SELECT COUNT(*) FROM contracts WHERE freelancer_id = ? AND status = 'active'",
            [user_id]
        )
        active_contract_count = int(active_contracts[0]) if active_contracts else 0

        # Completed contracts
        completed_contracts = turso.fetch_one(
            "SELECT COUNT(*) FROM contracts WHERE freelancer_id = ? AND status = 'completed'",
            [user_id]
        )
        completed_count = int(completed_contracts[0]) if completed_contracts else 0

        # Proposal stats
        proposals = turso.execute(
            """SELECT status, COUNT(*) FROM proposals
               WHERE freelancer_id = ? AND is_draft = 0
               GROUP BY status""",
            [user_id]
        )
        prop_breakdown = {}
        prop_total = 0
        for row in proposals.get("rows", []):
            s = row[0] or "unknown"
            c = int(row[1] or 0)
            prop_breakdown[s] = c
            prop_total += c

        accepted = prop_breakdown.get("accepted", 0)
        rejected = prop_breakdown.get("rejected", 0)
        decided = accepted + rejected
        acceptance_rate = round((accepted / decided) * 100, 1) if decided > 0 else 0

        # Average rating
        avg_rating = turso.fetch_one(
            "SELECT AVG(rating), COUNT(*) FROM reviews WHERE reviewee_id = ? AND is_public = 1",
            [user_id]
        )
        rating = round(float(avg_rating[0]), 2) if avg_rating and avg_rating[0] else 0
        review_count = int(avg_rating[1]) if avg_rating else 0

        # Pending milestones
        pending_ms = turso.fetch_one(
            """SELECT COUNT(*), COALESCE(SUM(amount), 0)
               FROM milestones m
               JOIN contracts c ON m.contract_id = c.id
               WHERE c.freelancer_id = ? AND m.status IN ('pending', 'submitted')""",
            [user_id]
        )

        return {
            "user_id": user_id,
            "period": period,
            "earnings": {
                "period_total": period_earnings,
                "period_transactions": period_transactions,
                "period_fees_paid": period_fees,
                "period_net": round(period_earnings - period_fees, 2),
                "all_time_total": all_time_earnings,
            },
            "contracts": {
                "active": active_contract_count,
                "completed": completed_count,
            },
            "proposals": {
                "total": prop_total,
                "acceptance_rate": acceptance_rate,
                "status_breakdown": prop_breakdown,
            },
            "reputation": {
                "average_rating": rating,
                "total_reviews": review_count,
            },
            "milestones": {
                "pending_count": int(pending_ms[0]) if pending_ms else 0,
                "pending_amount": round(float(pending_ms[1]), 2) if pending_ms else 0,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_freelancer_dashboard failed: %s", e, exc_info=True)
        raise HTTPException(status_code=503, detail="Database temporarily unavailable")


@router.get(
    "/dashboard/client",
    summary="Get client personal dashboard"
)
async def get_client_dashboard(
    period: str = Query("month", pattern=r'^(week|month|quarter|year)$'),
    current_user = Depends(get_current_user)
):
    """
    Comprehensive client dashboard with spending, project stats,
    active contracts, and hiring metrics. Accessible by the client only.
    """
    user_id = current_user.get("user_id") or current_user.get("id")
    user_type = (current_user.get("user_type") or "").lower()
    if user_type != "client":
        raise HTTPException(status_code=403, detail="Only clients can access this dashboard")

    try:
        turso = get_turso_http()
        now = datetime.now(timezone.utc)
        period_days = {"week": 7, "month": 30, "quarter": 90, "year": 365}
        period_start = (now - timedelta(days=period_days[period])).isoformat()

        # Spending in period
        spending = turso.fetch_one(
            """SELECT COALESCE(SUM(amount), 0), COUNT(*)
               FROM payments WHERE from_user_id = ? AND status = 'completed'
               AND created_at >= ?""",
            [user_id, period_start]
        )
        period_spending = round(float(spending[0]), 2) if spending else 0
        period_transactions = int(spending[1]) if spending else 0

        # All-time spending
        all_time = turso.fetch_one(
            "SELECT COALESCE(SUM(amount), 0) FROM payments WHERE from_user_id = ? AND status = 'completed'",
            [user_id]
        )
        all_time_spending = round(float(all_time[0]), 2) if all_time else 0

        # Project stats
        project_stats = turso.execute(
            "SELECT status, COUNT(*) FROM projects WHERE client_id = ? GROUP BY status",
            [user_id]
        )
        proj_breakdown = {}
        proj_total = 0
        for row in project_stats.get("rows", []):
            s = row[0] or "unknown"
            c = int(row[1] or 0)
            proj_breakdown[s] = c
            proj_total += c

        # Active contracts
        active_contracts = turso.fetch_one(
            "SELECT COUNT(*) FROM contracts WHERE client_id = ? AND status = 'active'",
            [user_id]
        )

        # Completed contracts
        completed_contracts = turso.fetch_one(
            "SELECT COUNT(*) FROM contracts WHERE client_id = ? AND status = 'completed'",
            [user_id]
        )

        # Total proposals received on user's projects
        proposals_received = turso.fetch_one(
            """SELECT COUNT(*)
               FROM proposals pr
               JOIN projects p ON pr.project_id = p.id
               WHERE p.client_id = ? AND pr.is_draft = 0""",
            [user_id]
        )

        # Pending milestones to approve
        pending_ms = turso.fetch_one(
            """SELECT COUNT(*), COALESCE(SUM(m.amount), 0)
               FROM milestones m
               JOIN contracts c ON m.contract_id = c.id
               WHERE c.client_id = ? AND m.status = 'submitted'""",
            [user_id]
        )

        # Average rating given
        avg_given = turso.fetch_one(
            "SELECT AVG(rating), COUNT(*) FROM reviews WHERE reviewer_id = ?",
            [user_id]
        )

        return {
            "user_id": user_id,
            "period": period,
            "spending": {
                "period_total": period_spending,
                "period_transactions": period_transactions,
                "all_time_total": all_time_spending,
            },
            "projects": {
                "total": proj_total,
                "status_breakdown": proj_breakdown,
            },
            "contracts": {
                "active": int(active_contracts[0]) if active_contracts else 0,
                "completed": int(completed_contracts[0]) if completed_contracts else 0,
            },
            "hiring": {
                "total_proposals_received": int(proposals_received[0]) if proposals_received else 0,
                "average_rating_given": round(float(avg_given[0]), 2) if avg_given and avg_given[0] else 0,
                "reviews_given": int(avg_given[1]) if avg_given else 0,
            },
            "milestones_to_approve": {
                "count": int(pending_ms[0]) if pending_ms else 0,
                "amount": round(float(pending_ms[1]), 2) if pending_ms else 0,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_client_dashboard failed: %s", e, exc_info=True)
        raise HTTPException(status_code=503, detail="Database temporarily unavailable")
