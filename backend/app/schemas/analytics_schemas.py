# @AI-HINT: Pydantic schemas for analytics API requests and responses
# Defines data models for analytics endpoints

from pydantic import BaseModel, Field, ConfigDict
from typing import Dict
from datetime import datetime
from enum import Enum


class IntervalEnum(str, Enum):
    """Time interval options for trend analysis"""
    day = "day"
    week = "week"
    month = "month"


class SortByEnum(str, Enum):
    """Sorting options for freelancer rankings"""
    earnings = "earnings"
    rating = "rating"
    projects = "projects"


# ==================== Request Schemas ====================

class TrendAnalysisRequest(BaseModel):
    """Request for trend analysis over time period"""
    start_date: datetime = Field(..., description="Start date for analysis")
    end_date: datetime = Field(..., description="End date for analysis")
    interval: IntervalEnum = Field(default=IntervalEnum.day, description="Aggregation interval")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "start_date": "2024-01-01T00:00:00Z",
            "end_date": "2024-12-31T23:59:59Z",
            "interval": "month"
        }
    })


class DateRangeRequest(BaseModel):
    """Request with date range only"""
    start_date: datetime = Field(..., description="Start date")
    end_date: datetime = Field(..., description="End date")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "start_date": "2024-01-01T00:00:00Z",
            "end_date": "2024-12-31T23:59:59Z"
        }
    })


class TopFreelancersRequest(BaseModel):
    """Request for top freelancers"""
    limit: int = Field(default=10, ge=1, le=100, description="Number of results")
    sort_by: SortByEnum = Field(default=SortByEnum.earnings, description="Sort criteria")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "limit": 10,
            "sort_by": "earnings"
        }
    })


# ==================== Response Schemas ====================

class RegistrationTrendResponse(BaseModel):
    """Single data point in registration trend"""
    date: str = Field(..., description="Date of registration")
    total: int = Field(..., description="Total registrations")
    clients: int = Field(..., description="Client registrations")
    freelancers: int = Field(..., description="Freelancer registrations")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "date": "2024-01-15",
            "total": 45,
            "clients": 20,
            "freelancers": 25
        }
    })


class ActiveUsersStatsResponse(BaseModel):
    """Active user statistics"""
    total_users: int = Field(..., description="Total registered users")
    active_users: int = Field(..., description="Active users in period")
    verified_users: int = Field(..., description="Email verified users")
    users_with_2fa: int = Field(..., description="Users with 2FA enabled")
    user_types: Dict[str, int] = Field(..., description="User count by type")
    period_days: int = Field(..., description="Period in days")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "total_users": 5000,
            "active_users": 1250,
            "verified_users": 4200,
            "users_with_2fa": 800,
            "user_types": {"client": 2000, "freelancer": 3000},
            "period_days": 30
        }
    })


class LocationDistributionResponse(BaseModel):
    """User distribution by location"""
    location: str = Field(..., description="Location name")
    count: int = Field(..., description="Number of users")


class ProjectStatsResponse(BaseModel):
    """Overall project statistics"""
    status_breakdown: Dict[str, int] = Field(..., description="Projects by status")
    average_budget: float = Field(..., description="Average project budget")
    projects_last_30_days: int = Field(..., description="Projects in last 30 days")
    average_proposals_per_project: float = Field(..., description="Avg proposals per project")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "status_breakdown": {
                "open": 150,
                "in_progress": 80,
                "completed": 420,
                "cancelled": 25
            },
            "average_budget": 2500.50,
            "projects_last_30_days": 45,
            "average_proposals_per_project": 8.5
        }
    })


class CompletionRateResponse(BaseModel):
    """Project completion metrics"""
    total_projects: int = Field(..., description="Total projects")
    completed: int = Field(..., description="Completed projects")
    in_progress: int = Field(..., description="In progress projects")
    cancelled: int = Field(..., description="Cancelled projects")
    completion_rate: float = Field(..., description="Completion rate percentage")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "total_projects": 500,
            "completed": 350,
            "in_progress": 100,
            "cancelled": 50,
            "completion_rate": 70.0
        }
    })


class CategoryPopularityResponse(BaseModel):
    """Popular category data"""
    category: str = Field(..., description="Category name")
    count: int = Field(..., description="Number of projects")


class RevenueStatsResponse(BaseModel):
    """Revenue statistics with growth tracking"""
    total_revenue: float = Field(..., description="Total revenue")
    platform_fees: float = Field(..., description="Platform fees collected")
    platform_fee_pct: float = Field(10.0, description="Platform fee percentage used")
    net_revenue: float = Field(..., description="Net revenue after fees")
    transaction_count: int = Field(..., description="Number of transactions")
    average_transaction: float = Field(..., description="Average transaction value")
    payment_methods: Dict[str, float] = Field(..., description="Revenue by payment method")
    revenue_growth_pct: float = Field(0.0, description="Revenue growth % vs previous period")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "total_revenue": 150000.00,
            "platform_fees": 15000.00,
            "platform_fee_pct": 10.0,
            "net_revenue": 135000.00,
            "transaction_count": 342,
            "average_transaction": 438.60,
            "payment_methods": {
                "stripe": 120000.00,
                "paypal": 30000.00
            },
            "revenue_growth_pct": 12.5
        }
    })


class RevenueTrendResponse(BaseModel):
    """Single data point in revenue trend"""
    date: str = Field(..., description="Date")
    revenue: float = Field(..., description="Revenue amount")
    transactions: int = Field(..., description="Transaction count")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "date": "2024-01-15",
            "revenue": 5420.50,
            "transactions": 15
        }
    })


class TopFreelancerResponse(BaseModel):
    """Top freelancer data"""
    id: int = Field(..., description="User ID")
    name: str = Field(..., description="Full name")
    email: str = Field(..., description="Email address")
    project_count: int = Field(..., description="Number of projects")
    total_earnings: float = Field(..., description="Total earnings")
    average_rating: float = Field(..., description="Average rating")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "id": 123,
            "name": "John Doe",
            "email": "john@example.com",
            "project_count": 45,
            "total_earnings": 125000.00,
            "average_rating": 4.8
        }
    })


class FreelancerSuccessRateResponse(BaseModel):
    """Freelancer success metrics"""
    proposals_submitted: int = Field(..., description="Total proposals submitted")
    proposals_accepted: int = Field(..., description="Proposals accepted")
    success_rate: float = Field(..., description="Success rate percentage")
    projects_completed: int = Field(..., description="Projects completed")
    average_rating: float = Field(..., description="Average rating")
    total_earnings: float = Field(..., description="Total earnings")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "proposals_submitted": 120,
            "proposals_accepted": 45,
            "success_rate": 37.5,
            "projects_completed": 42,
            "average_rating": 4.7,
            "total_earnings": 85000.00
        }
    })


class TopClientResponse(BaseModel):
    """Top client data"""
    id: int = Field(..., description="User ID")
    name: str = Field(..., description="Full name")
    email: str = Field(..., description="Email address")
    project_count: int = Field(..., description="Number of projects")
    total_spent: float = Field(..., description="Total amount spent")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "id": 456,
            "name": "Jane Smith",
            "email": "jane@example.com",
            "project_count": 28,
            "total_spent": 95000.00
        }
    })


class PlatformHealthResponse(BaseModel):
    """Platform health metrics with composite health score"""
    health_score: float = Field(0.0, description="Composite health score 0-100")
    health_status: str = Field("good", description="Health status: excellent, good, fair, needs_attention")
    active_disputes: int = Field(..., description="Active disputes")
    pending_support_tickets: int = Field(..., description="Pending support tickets")
    user_satisfaction_rating: float = Field(..., description="Average user rating")
    daily_active_users: int = Field(..., description="Daily active users")
    total_users: int = Field(0, description="Total registered users")
    dau_ratio: float = Field(0.0, description="DAU/Total users ratio %")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "health_score": 72.5,
            "health_status": "good",
            "active_disputes": 5,
            "pending_support_tickets": 12,
            "user_satisfaction_rating": 4.6,
            "daily_active_users": 450,
            "total_users": 5000,
            "dau_ratio": 9.0
        }
    })


class EngagementMetricsResponse(BaseModel):
    """User engagement metrics with growth tracking"""
    period_days: int = Field(..., description="Period in days")
    messages_sent: int = Field(..., description="Messages sent")
    proposals_submitted: int = Field(..., description="Proposals submitted")
    projects_posted: int = Field(..., description="Projects posted")
    contracts_created: int = Field(..., description="Contracts created")
    reviews_posted: int = Field(..., description="Reviews posted")
    growth: Dict[str, float] = Field(default_factory=dict, description="Growth % vs previous period")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "period_days": 30,
            "messages_sent": 8540,
            "proposals_submitted": 450,
            "projects_posted": 120,
            "contracts_created": 85,
            "reviews_posted": 65,
            "growth": {
                "messages_growth_pct": 5.2,
                "proposals_growth_pct": 12.0,
                "projects_growth_pct": -3.1
            }
        }
    })
