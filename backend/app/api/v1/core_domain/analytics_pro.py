# @AI-HINT: Advanced analytics API endpoints with ML predictions
"""
Advanced Analytics API - Business intelligence and predictive analytics.

Endpoints for:
- Revenue forecasting
- Cohort analysis
- Churn prediction
- Market trends
- Platform health
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from datetime import datetime, timezone
import logging

from app.core.security import get_current_active_user, require_admin
from app.services.advanced_analytics import (
    get_advanced_analytics_service
)

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# Revenue Analytics
# ============================================================================

@router.get("/revenue/forecast")
async def get_revenue_forecast(
    months_ahead: int = Query(6, ge=1, le=24, description="Months to forecast"),
    include_confidence: bool = Query(True, description="Include confidence intervals"),
    current_user = Depends(require_admin)
):
    """
    Get ML-powered revenue forecast.
    
    Uses time series analysis to predict future revenue with confidence intervals.
    Admin only endpoint.
    """
    
    try:
        service = get_advanced_analytics_service()
        
        forecast = await service.get_revenue_forecast(
            months_ahead=months_ahead,
            include_confidence=include_confidence
        )
        
        return forecast
        
    except Exception as e:
        logger.error(f"Revenue forecast error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate forecast")


@router.get("/revenue/breakdown")
async def get_revenue_breakdown(
    start_date: Optional[datetime] = Query(None, description="Period start"),
    end_date: Optional[datetime] = Query(None, description="Period end"),
    current_user = Depends(require_admin)
):
    """
    Get revenue breakdown by category, type, and source.
    
    Admin only endpoint.
    """
    
    try:
        service = get_advanced_analytics_service()
        
        breakdown = await service.get_revenue_breakdown(
            start_date=start_date,
            end_date=end_date
        )
        
        return breakdown
        
    except Exception as e:
        logger.error(f"Revenue breakdown error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get breakdown")


# ============================================================================
# User Analytics
# ============================================================================

@router.get("/cohort-analysis")
async def get_cohort_analysis(
    cohort_type: str = Query("monthly", description="Cohort grouping: monthly or weekly"),
    metric: str = Query("retention", description="Metric to analyze"),
    current_user = Depends(require_admin)
):
    """
    Perform cohort analysis for user retention.
    
    Tracks how user cohorts behave over time periods.
    Admin only endpoint.
    """
    
    if cohort_type not in ["monthly", "weekly"]:
        raise HTTPException(status_code=400, detail="Invalid cohort type")
    
    try:
        service = get_advanced_analytics_service()
        
        analysis = await service.get_cohort_analysis(
            cohort_type=cohort_type,
            metric=metric
        )
        
        return analysis
        
    except Exception as e:
        logger.error(f"Cohort analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get cohort analysis")


@router.get("/churn-prediction")
async def get_churn_predictions(
    user_id: Optional[int] = Query(None, description="Specific user to predict"),
    current_user = Depends(get_current_active_user)
):
    """
    Get churn predictions for users.
    
    Uses ML model to predict which users are at risk of churning.
    Admin only endpoint (unless checking own prediction).
    """
    # Allow users to check their own churn risk
    from app.services.db_utils import get_user_role
    role = get_user_role(current_user)
    uid = current_user["id"] if isinstance(current_user, dict) else current_user.id
    if user_id and user_id != uid and role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if not user_id and role != "admin":
        user_id = uid
    
    try:
        service = get_advanced_analytics_service()
        
        predictions = await service.get_churn_prediction(user_id=user_id)
        
        return predictions
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail="Internal server error")
    except Exception as e:
        logger.error(f"Churn prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get predictions")


# ============================================================================
# Market Analytics
# ============================================================================

@router.get("/market-trends")
async def get_market_trends(
    category: Optional[str] = Query(None, description="Filter by category"),
    current_user = Depends(get_current_active_user)
):
    """
    Get market trends for skills and categories.
    
    Analyzes demand patterns and pricing trends.
    """
    try:
        service = get_advanced_analytics_service()
        
        trends = await service.get_market_trends(category=category)
        
        return trends
        
    except Exception as e:
        logger.error(f"Market trends error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get market trends")


# ============================================================================
# Platform Health
# ============================================================================

@router.get("/platform-health")
async def get_platform_health(
    current_user = Depends(require_admin)
):
    """
    Get comprehensive platform health metrics.
    
    Includes user engagement, activity levels, and conversion rates.
    Admin only endpoint.
    """
    
    try:
        service = get_advanced_analytics_service()
        
        health = await service.get_platform_health()
        
        return health
        
    except Exception as e:
        logger.error(f"Platform health error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get platform health")


# ============================================================================
# Dashboard Summary
# ============================================================================

@router.get("/dashboard-summary")
async def get_analytics_dashboard(
    current_user = Depends(require_admin)
):
    """
    Get combined analytics dashboard data.
    
    Returns key metrics for admin dashboard in single request.
    Admin only endpoint.
    """
    
    try:
        service = get_advanced_analytics_service()
        
        # Gather all metrics
        health = await service.get_platform_health()
        revenue = await service.get_revenue_breakdown()
        trends = await service.get_market_trends()
        forecast = await service.get_revenue_forecast(months_ahead=3)
        
        return {
            "platform_health": health,
            "revenue_summary": {
                "current_period": revenue["total_revenue"],
                "transaction_count": revenue["transaction_count"],
                "top_category": revenue["by_category"][0] if revenue["by_category"] else None
            },
            "market_summary": {
                "total_projects": trends["market_summary"]["total_projects"],
                "top_skill": trends["top_skills"][0] if trends["top_skills"] else None,
                "avg_budget": trends["market_summary"]["avg_budget_overall"]
            },
            "forecast_summary": {
                "next_month": forecast["forecast"][0] if forecast["forecast"] else None,
                "trend": forecast["summary"]["trend"],
                "growth_rate": forecast["summary"]["growth_rate"]
            },
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Dashboard summary error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get dashboard summary")


# ============================================================================
# Custom Reports
# ============================================================================

@router.post("/generate-report")
async def generate_custom_report(
    report_type: str = Query(..., description="Type: revenue, users, projects, engagement"),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    format: str = Query("json", description="Output format: json, csv"),
    current_user = Depends(require_admin)
):
    """
    Generate custom analytics report.
    
    Admin only endpoint.
    """
    
    valid_types = ["revenue", "users", "projects", "engagement"]
    if report_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid report type. Valid types: {valid_types}"
        )
    
    try:
        service = get_advanced_analytics_service()
        
        # Generate report based on type
        if report_type == "revenue":
            data = await service.get_revenue_breakdown(start_date, end_date)
        elif report_type == "users":
            data = await service.get_cohort_analysis()
        elif report_type == "projects":
            data = await service.get_market_trends()
        elif report_type == "engagement":
            data = await service.get_platform_health()
        
        return {
            "report_type": report_type,
            "period": {
                "start": start_date.isoformat() if start_date else None,
                "end": end_date.isoformat() if end_date else None
            },
            "data": data,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "generated_by": current_user["id"] if isinstance(current_user, dict) else current_user.id
        }
        
    except Exception as e:
        logger.error(f"Generate report error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate report")
