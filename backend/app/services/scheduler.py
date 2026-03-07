# @AI-HINT: Scheduled tasks service for background job management
"""Scheduled Tasks Service - Background job management."""

import logging
import asyncio
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any, Callable
from enum import Enum
import secrets
from collections import defaultdict

logger = logging.getLogger(__name__)


class TaskStatus(str, Enum):
    """Task status."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    RETRYING = "retrying"


class TaskPriority(str, Enum):
    """Task priority."""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"


class ScheduleType(str, Enum):
    """Schedule type."""
    ONCE = "once"
    INTERVAL = "interval"
    CRON = "cron"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class ScheduledTasksService:
    """
    Scheduled tasks management service.
    
    Manages background jobs, scheduling, and task execution.
    """
    
    def __init__(self):
        # In-memory task storage
        self._tasks: Dict[str, Dict[str, Any]] = {}
        self._scheduled: Dict[str, Dict[str, Any]] = {}
        self._task_history: List[Dict[str, Any]] = []
        self._handlers: Dict[str, Callable] = {}
        self._running = False
    
    def register_handler(
        self,
        task_type: str,
        handler: Callable
    ) -> None:
        """Register a task handler."""
        self._handlers[task_type] = handler
        logger.info(f"Registered handler for task type: {task_type}")
    
    async def create_task(
        self,
        task_type: str,
        payload: Dict[str, Any],
        priority: TaskPriority = TaskPriority.NORMAL,
        delay_seconds: int = 0,
        max_retries: int = 3,
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Create a one-time task.
        
        Args:
            task_type: Type of task
            payload: Task data
            priority: Task priority
            delay_seconds: Delay before execution
            max_retries: Maximum retry attempts
            user_id: Associated user
            
        Returns:
            Task details
        """
        task_id = f"task_{secrets.token_urlsafe(12)}"
        
        scheduled_at = datetime.now(timezone.utc)
        if delay_seconds > 0:
            scheduled_at += timedelta(seconds=delay_seconds)
        
        task = {
            "id": task_id,
            "type": task_type,
            "payload": payload,
            "priority": priority.value,
            "status": TaskStatus.PENDING.value,
            "scheduled_at": scheduled_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "user_id": user_id,
            "max_retries": max_retries,
            "retry_count": 0,
            "result": None,
            "error": None
        }
        
        self._tasks[task_id] = task
        
        logger.info(f"Created task: {task_id} ({task_type})")
        
        return task
    
    async def schedule_recurring(
        self,
        task_type: str,
        payload: Dict[str, Any],
        schedule_type: ScheduleType,
        interval_minutes: Optional[int] = None,
        cron_expression: Optional[str] = None,
        time_of_day: Optional[str] = None,
        day_of_week: Optional[int] = None,
        day_of_month: Optional[int] = None,
        user_id: Optional[int] = None,
        enabled: bool = True
    ) -> Dict[str, Any]:
        """
        Create a recurring scheduled task.
        
        Args:
            task_type: Type of task
            payload: Task data
            schedule_type: Type of schedule
            interval_minutes: Interval in minutes (for INTERVAL type)
            cron_expression: Cron expression (for CRON type)
            time_of_day: Time of day HH:MM (for DAILY/WEEKLY/MONTHLY)
            day_of_week: Day of week 0-6 (for WEEKLY)
            day_of_month: Day of month 1-31 (for MONTHLY)
            user_id: Associated user
            enabled: Whether schedule is enabled
            
        Returns:
            Schedule details
        """
        schedule_id = f"sched_{secrets.token_urlsafe(12)}"
        
        schedule = {
            "id": schedule_id,
            "task_type": task_type,
            "payload": payload,
            "schedule_type": schedule_type.value,
            "interval_minutes": interval_minutes,
            "cron_expression": cron_expression,
            "time_of_day": time_of_day,
            "day_of_week": day_of_week,
            "day_of_month": day_of_month,
            "user_id": user_id,
            "enabled": enabled,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "last_run": None,
            "next_run": self._calculate_next_run(
                schedule_type, interval_minutes, time_of_day,
                day_of_week, day_of_month
            ),
            "run_count": 0
        }
        
        self._scheduled[schedule_id] = schedule
        
        logger.info(f"Created schedule: {schedule_id} ({task_type})")
        
        return schedule
    
    async def get_task(
        self,
        task_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get task details."""
        return self._tasks.get(task_id)
    
    async def get_schedule(
        self,
        schedule_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get schedule details."""
        return self._scheduled.get(schedule_id)
    
    async def list_tasks(
        self,
        status: Optional[TaskStatus] = None,
        task_type: Optional[str] = None,
        user_id: Optional[int] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """List tasks with optional filters."""
        tasks = list(self._tasks.values())
        
        if status:
            tasks = [t for t in tasks if t["status"] == status.value]
        
        if task_type:
            tasks = [t for t in tasks if t["type"] == task_type]
        
        if user_id:
            tasks = [t for t in tasks if t.get("user_id") == user_id]
        
        # Sort by priority and scheduled time
        priority_order = {
            TaskPriority.CRITICAL.value: 0,
            TaskPriority.HIGH.value: 1,
            TaskPriority.NORMAL.value: 2,
            TaskPriority.LOW.value: 3
        }
        
        tasks.sort(
            key=lambda x: (
                priority_order.get(x["priority"], 2),
                x["scheduled_at"]
            )
        )
        
        return tasks[:limit]
    
    async def list_schedules(
        self,
        user_id: Optional[int] = None,
        enabled_only: bool = False
    ) -> List[Dict[str, Any]]:
        """List scheduled tasks."""
        schedules = list(self._scheduled.values())
        
        if user_id:
            schedules = [s for s in schedules if s.get("user_id") == user_id]
        
        if enabled_only:
            schedules = [s for s in schedules if s["enabled"]]
        
        return schedules
    
    async def cancel_task(
        self,
        task_id: str
    ) -> bool:
        """Cancel a pending task."""
        task = self._tasks.get(task_id)
        
        if not task:
            return False
        
        if task["status"] not in [TaskStatus.PENDING.value, TaskStatus.RETRYING.value]:
            return False
        
        task["status"] = TaskStatus.CANCELLED.value
        task["cancelled_at"] = datetime.now(timezone.utc).isoformat()
        
        return True
    
    async def toggle_schedule(
        self,
        schedule_id: str,
        enabled: bool
    ) -> Optional[Dict[str, Any]]:
        """Enable or disable a schedule."""
        schedule = self._scheduled.get(schedule_id)
        
        if not schedule:
            return None
        
        schedule["enabled"] = enabled
        schedule["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        if enabled:
            schedule["next_run"] = self._calculate_next_run(
                ScheduleType(schedule["schedule_type"]),
                schedule.get("interval_minutes"),
                schedule.get("time_of_day"),
                schedule.get("day_of_week"),
                schedule.get("day_of_month")
            )
        
        return schedule
    
    async def delete_schedule(
        self,
        schedule_id: str
    ) -> bool:
        """Delete a schedule."""
        if schedule_id in self._scheduled:
            del self._scheduled[schedule_id]
            return True
        return False
    
    async def run_task(
        self,
        task_id: str
    ) -> Dict[str, Any]:
        """
        Execute a task immediately.
        
        Returns:
            Task result
        """
        task = self._tasks.get(task_id)
        
        if not task:
            return {"error": "Task not found"}
        
        if task["status"] == TaskStatus.RUNNING.value:
            return {"error": "Task already running"}
        
        task["status"] = TaskStatus.RUNNING.value
        task["started_at"] = datetime.now(timezone.utc).isoformat()
        
        try:
            handler = self._handlers.get(task["type"])
            
            if handler:
                result = await handler(task["payload"])
                task["result"] = result
            else:
                # Simulate task execution
                await asyncio.sleep(0.1)
                task["result"] = {"success": True, "simulated": True}
            
            task["status"] = TaskStatus.COMPLETED.value
            task["completed_at"] = datetime.now(timezone.utc).isoformat()
            
        except Exception as e:
            logger.error(f"Task {task_id} failed: {str(e)}")
            task["error"] = str(e)
            
            if task["retry_count"] < task["max_retries"]:
                task["status"] = TaskStatus.RETRYING.value
                task["retry_count"] += 1
                task["scheduled_at"] = (
                    datetime.now(timezone.utc) + timedelta(minutes=5 * task["retry_count"])
                ).isoformat()
            else:
                task["status"] = TaskStatus.FAILED.value
                task["failed_at"] = datetime.now(timezone.utc).isoformat()
        
        # Log to history
        self._task_history.append({
            "task_id": task_id,
            "type": task["type"],
            "status": task["status"],
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "result": task.get("result"),
            "error": task.get("error")
        })
        
        return task
    
    async def get_task_history(
        self,
        task_type: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get task execution history."""
        history = self._task_history
        
        if task_type:
            history = [h for h in history if h["type"] == task_type]
        
        # Sort by timestamp descending
        history.sort(key=lambda x: x["timestamp"], reverse=True)
        
        return history[:limit]
    
    async def get_statistics(self) -> Dict[str, Any]:
        """Get task statistics."""
        total = len(self._tasks)
        
        by_status = defaultdict(int)
        by_type = defaultdict(int)
        
        for task in self._tasks.values():
            by_status[task["status"]] += 1
            by_type[task["type"]] += 1
        
        schedules_enabled = sum(
            1 for s in self._scheduled.values() if s["enabled"]
        )
        
        return {
            "total_tasks": total,
            "by_status": dict(by_status),
            "by_type": dict(by_type),
            "total_schedules": len(self._scheduled),
            "schedules_enabled": schedules_enabled,
            "history_entries": len(self._task_history)
        }
    
    def _calculate_next_run(
        self,
        schedule_type: ScheduleType,
        interval_minutes: Optional[int],
        time_of_day: Optional[str],
        day_of_week: Optional[int],
        day_of_month: Optional[int]
    ) -> str:
        """Calculate next run time for schedule."""
        now = datetime.now(timezone.utc)
        
        if schedule_type == ScheduleType.INTERVAL and interval_minutes:
            next_run = now + timedelta(minutes=interval_minutes)
        
        elif schedule_type == ScheduleType.DAILY and time_of_day:
            hour, minute = map(int, time_of_day.split(":"))
            next_run = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
            if next_run <= now:
                next_run += timedelta(days=1)
        
        elif schedule_type == ScheduleType.WEEKLY and time_of_day and day_of_week is not None:
            hour, minute = map(int, time_of_day.split(":"))
            next_run = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
            days_ahead = day_of_week - now.weekday()
            if days_ahead <= 0:
                days_ahead += 7
            next_run += timedelta(days=days_ahead)
        
        elif schedule_type == ScheduleType.MONTHLY and time_of_day and day_of_month:
            hour, minute = map(int, time_of_day.split(":"))
            next_run = now.replace(
                day=min(day_of_month, 28),
                hour=hour, minute=minute, second=0, microsecond=0
            )
            if next_run <= now:
                if now.month == 12:
                    next_run = next_run.replace(year=now.year + 1, month=1)
                else:
                    next_run = next_run.replace(month=now.month + 1)
        
        else:
            next_run = now + timedelta(hours=1)
        
        return next_run.isoformat()


# Singleton instance
_scheduler_service: Optional[ScheduledTasksService] = None


def get_scheduler_service() -> ScheduledTasksService:
    """Get or create scheduler service instance."""
    global _scheduler_service
    if _scheduler_service is None:
        _scheduler_service = ScheduledTasksService()
    return _scheduler_service
