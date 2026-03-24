"""
@AI-HINT: Production-grade health check endpoints with detailed diagnostics
Provides liveness, readiness, and detailed health status for Kubernetes/Docker
"""

from fastapi import APIRouter, Response
from datetime import datetime, timezone
import logging
import time
import os
import platform
from typing import Dict, Any, Optional
logger = logging.getLogger(__name__)

from app.core.config import get_settings
from app.db.turso_http import get_turso_http

router = APIRouter()


class HealthChecker:
    """Health check utilities for production monitoring"""

    @staticmethod
    def check_database() -> Dict[str, Any]:
        """Check database connectivity and latency"""
        start = time.time()
        try:
            turso = get_turso_http()
            result = turso.execute("SELECT 1", [])
            latency_ms = (time.time() - start) * 1000
            return {
                "status": "healthy",
                "latency_ms": round(latency_ms, 2),
                "type": "turso",
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "type": "turso",
            }

    @staticmethod
    def check_disk_space() -> Dict[str, Any]:
        """Check available disk space"""
        try:
            import shutil
            total, used, free = shutil.disk_usage("/")
            free_percent = (free / total) * 100
            return {
                "status": "healthy" if free_percent > 10 else "warning",
                "total_gb": round(total / (1024**3), 2),
                "used_gb": round(used / (1024**3), 2),
                "free_gb": round(free / (1024**3), 2),
                "free_percent": round(free_percent, 2),
            }
        except Exception as e:
            return {"status": "unknown", "error": str(e)}

    @staticmethod
    def check_memory() -> Dict[str, Any]:
        """Check memory usage"""
        try:
            import psutil
            memory = psutil.virtual_memory()
            return {
                "status": "healthy" if memory.percent < 90 else "warning",
                "total_gb": round(memory.total / (1024**3), 2),
                "available_gb": round(memory.available / (1024**3), 2),
                "used_percent": memory.percent,
            }
        except ImportError:
            return {"status": "unknown", "error": "psutil not installed"}
        except Exception as e:
            return {"status": "unknown", "error": str(e)}

    @staticmethod
    def get_system_info() -> Dict[str, Any]:
        """Get system information"""
        settings = get_settings()
        return {
            "python_version": platform.python_version(),
            "platform": platform.platform(),
            "environment": settings.environment,
            "app_name": settings.app_name,
            "hostname": os.getenv("HOSTNAME", platform.node()),
        }


@router.get("/live")
async def liveness():
    """
    Kubernetes liveness probe endpoint.
    Returns 200 if the application is running.
    """
    return {"status": "alive", "timestamp": datetime.now(timezone.utc).isoformat()}


@router.get("/ready")
async def readiness(response: Response):
    """
    Kubernetes readiness probe endpoint.
    Returns 200 if the application can accept traffic.
    Checks critical dependencies (database).
    """
    db_health = HealthChecker.check_database()
    
    if db_health["status"] != "healthy":
        response.status_code = 503
        return {
            "status": "not_ready",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "checks": {"database": db_health},
        }
    
    return {
        "status": "ready",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "checks": {"database": db_health},
    }


@router.get("/")
async def health_status(response: Response, detailed: bool = False):
    """
    Comprehensive health check endpoint.
    
    Args:
        detailed: Include detailed system information
    
    Returns:
        Health status of all components
    """
    checks = {
        "database": HealthChecker.check_database(),
    }
    
    # Determine overall status
    statuses = [c["status"] for c in checks.values()]
    if all(s == "healthy" for s in statuses):
        overall_status = "healthy"
    elif any(s == "unhealthy" for s in statuses):
        overall_status = "unhealthy"
        response.status_code = 503
    else:
        overall_status = "degraded"
    
    result = {
        "status": overall_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
        "checks": checks,
    }
    
    if detailed:
        result["system"] = HealthChecker.get_system_info()
        result["resources"] = {
            "disk": HealthChecker.check_disk_space(),
            "memory": HealthChecker.check_memory(),
        }
    
    return result


@router.get("/metrics")
async def prometheus_metrics():
    """
    Prometheus-compatible metrics endpoint.
    Returns basic application metrics.
    """
    settings = get_settings()
    
    # Basic metrics in Prometheus format
    metrics = []
    
    # App info
    metrics.append(f'megilance_info{{version="1.0.0",environment="{settings.environment}"}} 1')
    
    # Health status (1 = healthy, 0 = unhealthy)
    db_health = HealthChecker.check_database()
    db_status = 1 if db_health["status"] == "healthy" else 0
    metrics.append(f"megilance_database_healthy {db_status}")
    
    if db_health.get("latency_ms"):
        metrics.append(f"megilance_database_latency_ms {db_health['latency_ms']}")
    
    # Memory (if available)
    memory = HealthChecker.check_memory()
    if memory.get("used_percent"):
        metrics.append(f"megilance_memory_used_percent {memory['used_percent']}")
    
    # Disk (if available)
    disk = HealthChecker.check_disk_space()
    if disk.get("free_percent"):
        metrics.append(f"megilance_disk_free_percent {disk['free_percent']}")
    
    return Response(
        content="\n".join(metrics),
        media_type="text/plain; version=0.0.4",
    )
