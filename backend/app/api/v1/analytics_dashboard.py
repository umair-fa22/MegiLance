# @AI-HINT: Analytics dashboard API endpoints
"""
Analytics Dashboard API - Business intelligence endpoints.

Features:
- Custom dashboards
- Widget management
- Metrics & KPIs
- Real-time data
- Reports & exports
- Predictive analytics
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime

from app.core.security import get_current_active_user
from app.services.db_utils import sanitize_text
from app.services.analytics_dashboard import (
    get_analytics_dashboard_service,
    WidgetType,
    TimeGranularity
)

router = APIRouter(prefix="/analytics-dashboard", tags=["analytics-dashboard"])


# Request/Response Models
class CreateDashboardRequest(BaseModel):
    name: str
    description: Optional[str] = None
    is_default: bool = False


class AddWidgetRequest(BaseModel):
    widget_type: WidgetType
    title: str
    config: Dict[str, Any]


class SetKPITargetRequest(BaseModel):
    metric_name: str
    target_value: float
    target_date: str


class CreateAlertRuleRequest(BaseModel):
    metric_name: str
    condition: str
    threshold: float
    notification_channels: List[str]


class GenerateReportRequest(BaseModel):
    report_type: str
    period_start: str
    period_end: str
    metrics: List[str]
    format: str = "pdf"


class ExportDataRequest(BaseModel):
    metrics: List[str]
    period_start: str
    period_end: str
    format: str = "csv"


# Dashboard Endpoints
@router.post("/dashboards")
async def create_dashboard(
    request: CreateDashboardRequest,
    ,
    current_user = Depends(get_current_active_user)
):
    """Create a custom dashboard."""
    service = get_analytics_dashboard_service()
    dashboard = await service.create_dashboard(
        current_user["id"],
        sanitize_text(request.name, 200),
        sanitize_text(request.description, 1000) if request.description else None,
        request.is_default
    )
    return {"dashboard": dashboard}


@router.get("/dashboards")
async def list_dashboards(
    ,
    current_user = Depends(get_current_active_user)
):
    """List user's dashboards."""
    service = get_analytics_dashboard_service()
    dashboards = await service.list_dashboards(current_user["id"])
    return {"dashboards": dashboards}


@router.get("/dashboards/{dashboard_id}")
async def get_dashboard(
    dashboard_id: str,
    ,
    current_user = Depends(get_current_active_user)
):
    """Get dashboard by ID."""
    service = get_analytics_dashboard_service()
    dashboard = await service.get_dashboard(current_user["id"], dashboard_id)
    
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    
    return {"dashboard": dashboard}


@router.put("/dashboards/{dashboard_id}")
async def update_dashboard(
    dashboard_id: str,
    updates: Dict[str, Any],
    ,
    current_user = Depends(get_current_active_user)
):
    """Update dashboard settings."""
    ALLOWED_DASHBOARD_FIELDS = {"name", "description", "is_default"}
    safe_updates = {k: v for k, v in updates.items() if k in ALLOWED_DASHBOARD_FIELDS}
    for k in ("name", "description"):
        if k in safe_updates and isinstance(safe_updates[k], str):
            safe_updates[k] = sanitize_text(safe_updates[k], 1000)
    service = get_analytics_dashboard_service()
    result = await service.update_dashboard(current_user["id"], dashboard_id, safe_updates)
    return result


@router.delete("/dashboards/{dashboard_id}")
async def delete_dashboard(
    dashboard_id: str,
    ,
    current_user = Depends(get_current_active_user)
):
    """Delete a dashboard."""
    service = get_analytics_dashboard_service()
    success = await service.delete_dashboard(current_user["id"], dashboard_id)
    return {"success": success}


# Widget Endpoints
@router.post("/dashboards/{dashboard_id}/widgets")
async def add_widget(
    dashboard_id: str,
    request: AddWidgetRequest,
    ,
    current_user = Depends(get_current_active_user)
):
    """Add a widget to dashboard."""
    service = get_analytics_dashboard_service()
    widget = await service.add_widget(
        current_user["id"],
        dashboard_id,
        request.widget_type,
        sanitize_text(request.title, 200),
        request.config
    )
    return {"widget": widget}


@router.put("/dashboards/{dashboard_id}/widgets/{widget_id}")
async def update_widget(
    dashboard_id: str,
    widget_id: str,
    updates: Dict[str, Any],
    ,
    current_user = Depends(get_current_active_user)
):
    """Update widget settings."""
    ALLOWED_WIDGET_FIELDS = {"title", "config", "position"}
    safe_updates = {k: v for k, v in updates.items() if k in ALLOWED_WIDGET_FIELDS}
    if "title" in safe_updates and isinstance(safe_updates["title"], str):
        safe_updates["title"] = sanitize_text(safe_updates["title"], 200)
    service = get_analytics_dashboard_service()
    result = await service.update_widget(current_user["id"], dashboard_id, widget_id, safe_updates)
    return result


@router.delete("/dashboards/{dashboard_id}/widgets/{widget_id}")
async def delete_widget(
    dashboard_id: str,
    widget_id: str,
    ,
    current_user = Depends(get_current_active_user)
):
    """Delete a widget."""
    service = get_analytics_dashboard_service()
    success = await service.delete_widget(current_user["id"], dashboard_id, widget_id)
    return {"success": success}


# Metrics Endpoints
@router.get("/metrics")
async def get_available_metrics(
    ,
    current_user = Depends(get_current_active_user)
):
    """Get list of available metrics."""
    service = get_analytics_dashboard_service()
    metrics = await service.get_available_metrics(current_user["id"])
    return {"metrics": metrics}


@router.get("/metrics/{metric_name}")
async def get_metric(
    metric_name: str,
    granularity: TimeGranularity = TimeGranularity.DAY,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    ,
    current_user = Depends(get_current_active_user)
):
    """Get metric data."""
    service = get_analytics_dashboard_service()
    
    start = datetime.fromisoformat(start_date) if start_date else None
    end = datetime.fromisoformat(end_date) if end_date else None
    
    metric = await service.get_metric(current_user["id"], metric_name, granularity, start, end)
    return {"metric": metric}


@router.get("/realtime")
async def get_realtime_metrics(
    ,
    current_user = Depends(get_current_active_user)
):
    """Get real-time metrics snapshot."""
    service = get_analytics_dashboard_service()
    metrics = await service.get_realtime_metrics(current_user["id"])
    return metrics


# KPI Endpoints
@router.post("/kpis")
async def set_kpi_target(
    request: SetKPITargetRequest,
    ,
    current_user = Depends(get_current_active_user)
):
    """Set a KPI target."""
    service = get_analytics_dashboard_service()
    kpi = await service.set_kpi_target(
        current_user["id"],
        request.metric_name,
        request.target_value,
        datetime.fromisoformat(request.target_date)
    )
    return {"kpi": kpi}


@router.get("/kpis/progress")
async def get_kpi_progress(
    ,
    current_user = Depends(get_current_active_user)
):
    """Get KPI progress."""
    service = get_analytics_dashboard_service()
    progress = await service.get_kpi_progress(current_user["id"])
    return {"kpis": progress}


# Alert Rules Endpoints
@router.post("/alerts")
async def create_alert_rule(
    request: CreateAlertRuleRequest,
    ,
    current_user = Depends(get_current_active_user)
):
    """Create an alert rule."""
    service = get_analytics_dashboard_service()
    rule = await service.create_alert_rule(
        current_user["id"],
        request.metric_name,
        request.condition,
        request.threshold,
        request.notification_channels
    )
    return {"rule": rule}


@router.get("/alerts")
async def get_alert_rules(
    ,
    current_user = Depends(get_current_active_user)
):
    """Get user's alert rules."""
    service = get_analytics_dashboard_service()
    rules = await service.get_alert_rules(current_user["id"])
    return {"rules": rules}


# Reports & Export Endpoints
@router.post("/reports")
async def generate_report(
    request: GenerateReportRequest,
    ,
    current_user = Depends(get_current_active_user)
):
    """Generate analytics report."""
    service = get_analytics_dashboard_service()
    report = await service.generate_report(
        current_user["id"],
        request.report_type,
        datetime.fromisoformat(request.period_start),
        datetime.fromisoformat(request.period_end),
        request.metrics,
        request.format
    )
    return {"report": report}


@router.post("/export")
async def export_data(
    request: ExportDataRequest,
    ,
    current_user = Depends(get_current_active_user)
):
    """Export analytics data."""
    service = get_analytics_dashboard_service()
    export = await service.export_data(
        current_user["id"],
        request.metrics,
        datetime.fromisoformat(request.period_start),
        datetime.fromisoformat(request.period_end),
        request.format
    )
    return {"export": export}


# Comparison Endpoints
@router.get("/compare/{metric_name}")
async def get_comparison(
    metric_name: str,
    compare_with: str = "previous_period",
    ,
    current_user = Depends(get_current_active_user)
):
    """Compare metrics."""
    service = get_analytics_dashboard_service()
    comparison = await service.get_comparison(current_user["id"], metric_name, compare_with)
    return {"comparison": comparison}


@router.get("/benchmarks/{category}")
async def get_industry_benchmarks(
    category: str,
    ,
    current_user = Depends(get_current_active_user)
):
    """Get industry benchmark comparison."""
    service = get_analytics_dashboard_service()
    benchmarks = await service.get_industry_benchmarks(current_user["id"], category)
    return {"benchmarks": benchmarks}


# Predictive Analytics Endpoints
@router.get("/forecast/{metric_name}")
async def get_forecast(
    metric_name: str,
    forecast_days: int = 30,
    ,
    current_user = Depends(get_current_active_user)
):
    """Get metric forecast."""
    service = get_analytics_dashboard_service()
    forecast = await service.get_forecast(current_user["id"], metric_name, forecast_days)
    return {"forecast": forecast}


@router.get("/recommendations")
async def get_recommendations(
    ,
    current_user = Depends(get_current_active_user)
):
    """Get AI-powered recommendations."""
    service = get_analytics_dashboard_service()
    recommendations = await service.get_recommendations(current_user["id"])
    return {"recommendations": recommendations}
