# @AI-HINT: Report generation service for PDF/Excel exports — DB-backed via Turso
"""Report Generation Service - Generate PDF and Excel reports."""

import logging
import io
import csv
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from enum import Enum
import secrets
import json

from app.db.turso_http import execute_query, parse_rows

logger = logging.getLogger(__name__)


class ReportFormat(str, Enum):
    """Report output formats."""
    PDF = "pdf"
    EXCEL = "excel"
    CSV = "csv"
    JSON = "json"


class ReportType(str, Enum):
    """Report types."""
    # User reports
    USER_ACTIVITY = "user_activity"
    USER_EARNINGS = "user_earnings"
    USER_PROJECTS = "user_projects"
    
    # Project reports
    PROJECT_SUMMARY = "project_summary"
    PROJECT_TIMELINE = "project_timeline"
    PROJECT_FINANCIALS = "project_financials"
    
    # Financial reports
    EARNINGS_SUMMARY = "earnings_summary"
    PAYMENT_HISTORY = "payment_history"
    TAX_SUMMARY = "tax_summary"
    INVOICE_REPORT = "invoice_report"
    
    # Analytics reports
    PERFORMANCE_METRICS = "performance_metrics"
    ENGAGEMENT_ANALYTICS = "engagement_analytics"
    CONVERSION_FUNNEL = "conversion_funnel"
    
    # Admin reports
    PLATFORM_OVERVIEW = "platform_overview"
    USER_STATISTICS = "user_statistics"
    REVENUE_REPORT = "revenue_report"
    FRAUD_REPORT = "fraud_report"


class ReportStatus(str, Enum):
    """Report generation status."""
    PENDING = "pending"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"


class ReportGenerationService:
    """
    Report generation service.
    
    Generates PDF and Excel reports for various data.
    """
    
    # TODO: migrate in-memory stores to database for persistence and scalability
    _MAX_REPORTS = 2000
    _MAX_SCHEDULED = 500

    def __init__(self):
        self._templates: Dict[str, Dict[str, Any]] = {}
        self._init_templates()
    
    def _init_templates(self) -> None:
        """Initialize default report templates."""
        self._templates = {
            ReportType.USER_EARNINGS.value: {
                "title": "Earnings Report",
                "sections": ["summary", "details", "chart"],
                "columns": ["date", "project", "amount", "status"]
            },
            ReportType.PROJECT_SUMMARY.value: {
                "title": "Project Summary Report",
                "sections": ["overview", "milestones", "payments", "timeline"],
                "columns": ["project_name", "status", "budget", "spent", "completion"]
            },
            ReportType.TAX_SUMMARY.value: {
                "title": "Tax Summary Report",
                "sections": ["income", "deductions", "summary"],
                "columns": ["category", "amount", "tax_rate", "tax_amount"]
            },
            ReportType.PLATFORM_OVERVIEW.value: {
                "title": "Platform Overview Report",
                "sections": ["users", "projects", "revenue", "growth"],
                "columns": ["metric", "value", "change", "trend"]
            }
        }
    
    async def generate_report(
        self,
        report_type: ReportType,
        user_id: int,
        format: ReportFormat = ReportFormat.PDF,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate a report.
        
        Args:
            report_type: Type of report
            user_id: Requesting user
            format: Output format
            date_from: Start date
            date_to: End date
            filters: Additional filters
            
        Returns:
            Report generation result
        """
        report_id = f"report_{secrets.token_urlsafe(12)}"
        
        if not date_to:
            date_to = datetime.now(timezone.utc)
        if not date_from:
            date_from = date_to - timedelta(days=30)
        
        now = datetime.now(timezone.utc).isoformat()
        
        execute_query(
            """INSERT INTO generated_reports
               (id, report_type, format, user_id, status, date_from, date_to, filters, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            [report_id, report_type.value, format.value, user_id,
             ReportStatus.PENDING.value, date_from.isoformat(), date_to.isoformat(),
             json.dumps(filters or {}), now]
        )
        
        try:
            execute_query(
                "UPDATE generated_reports SET status = ? WHERE id = ?",
                [ReportStatus.GENERATING.value, report_id]
            )
            
            data = await self._generate_report_data(
                report_type, user_id, date_from, date_to, filters
            )
            
            if format == ReportFormat.CSV:
                output = self._format_csv(data, report_type)
            elif format == ReportFormat.JSON:
                output = self._format_json(data, report_type)
            elif format == ReportFormat.EXCEL:
                output = self._format_excel(data, report_type)
            else:
                output = self._format_pdf(data, report_type)
            
            completed_at = datetime.now(timezone.utc).isoformat()
            file_url = f"/api/v1/reports/download/{report_id}"
            file_size = len(str(output))
            
            execute_query(
                """UPDATE generated_reports
                   SET status = ?, data = ?, completed_at = ?, file_url = ?, file_size = ?
                   WHERE id = ?""",
                [ReportStatus.COMPLETED.value, json.dumps(output, default=str),
                 completed_at, file_url, file_size, report_id]
            )
            
        except Exception as e:
            logger.error(f"Report generation failed: {str(e)}")
            execute_query(
                "UPDATE generated_reports SET status = ?, error = ? WHERE id = ?",
                [ReportStatus.FAILED.value, str(e), report_id]
            )
        
        result = execute_query("SELECT * FROM generated_reports WHERE id = ?", [report_id])
        rows = parse_rows(result)
        return self._row_to_report(rows[0]) if rows else {"id": report_id, "status": "failed"}
    
    def _row_to_report(self, row: Dict) -> Dict[str, Any]:
        """Convert a DB row to a report dict."""
        r = dict(row)
        r["filters"] = json.loads(r.get("filters") or "{}")
        if r.get("data"):
            try:
                r["data"] = json.loads(r["data"])
            except (json.JSONDecodeError, TypeError):
                pass
        r["file_size"] = int(r["file_size"]) if r.get("file_size") else None
        return r

    async def get_report(
        self,
        report_id: str,
        user_id: int
    ) -> Optional[Dict[str, Any]]:
        """Get report details."""
        result = execute_query(
            "SELECT * FROM generated_reports WHERE id = ? AND user_id = ?",
            [report_id, user_id]
        )
        rows = parse_rows(result)
        return self._row_to_report(rows[0]) if rows else None
    
    async def list_reports(
        self,
        user_id: int,
        report_type: Optional[ReportType] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """List user's reports."""
        sql = "SELECT id, report_type, format, user_id, status, date_from, date_to, filters, file_url, file_size, error, created_at, completed_at FROM generated_reports WHERE user_id = ?"
        params: list = [user_id]
        if report_type:
            sql += " AND report_type = ?"
            params.append(report_type.value)
        sql += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)

        result = execute_query(sql, params)
        rows = parse_rows(result)
        return [self._row_to_report(r) for r in rows]
    
    async def schedule_report(
        self,
        report_type: ReportType,
        user_id: int,
        format: ReportFormat,
        schedule: str,
        email_to: Optional[str] = None,
        filters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Schedule recurring report generation."""
        schedule_id = f"sched_{secrets.token_urlsafe(12)}"
        now = datetime.now(timezone.utc).isoformat()
        next_run = self._calculate_next_run(schedule)

        execute_query(
            """INSERT INTO scheduled_reports
               (id, report_type, format, user_id, schedule, email_to, filters,
                enabled, created_at, next_run, run_count)
               VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, 0)""",
            [schedule_id, report_type.value, format.value, user_id,
             schedule, email_to, json.dumps(filters or {}), now, next_run]
        )

        result = execute_query("SELECT * FROM scheduled_reports WHERE id = ?", [schedule_id])
        rows = parse_rows(result)
        return self._row_to_scheduled(rows[0]) if rows else {"id": schedule_id}

    def _row_to_scheduled(self, row: Dict) -> Dict[str, Any]:
        r = dict(row)
        r["filters"] = json.loads(r.get("filters") or "{}")
        r["enabled"] = bool(int(r.get("enabled", 0)))
        r["run_count"] = int(r.get("run_count", 0))
        return r

    async def list_scheduled_reports(
        self,
        user_id: int
    ) -> List[Dict[str, Any]]:
        """List user's scheduled reports."""
        result = execute_query(
            "SELECT * FROM scheduled_reports WHERE user_id = ? ORDER BY created_at DESC",
            [user_id]
        )
        return [self._row_to_scheduled(r) for r in parse_rows(result)]
    
    async def cancel_scheduled_report(
        self,
        schedule_id: str,
        user_id: int
    ) -> bool:
        """Cancel a scheduled report."""
        result = execute_query(
            "SELECT id FROM scheduled_reports WHERE id = ? AND user_id = ?",
            [schedule_id, user_id]
        )
        rows = parse_rows(result)
        if not rows:
            return False
        execute_query("DELETE FROM scheduled_reports WHERE id = ?", [schedule_id])
        return True
    
    async def get_available_reports(
        self,
        user_role: str = "user"
    ) -> List[Dict[str, Any]]:
        """Get list of available report types."""
        user_reports = [
            ReportType.USER_ACTIVITY,
            ReportType.USER_EARNINGS,
            ReportType.USER_PROJECTS,
            ReportType.PROJECT_SUMMARY,
            ReportType.PROJECT_TIMELINE,
            ReportType.PROJECT_FINANCIALS,
            ReportType.EARNINGS_SUMMARY,
            ReportType.PAYMENT_HISTORY,
            ReportType.TAX_SUMMARY,
            ReportType.INVOICE_REPORT
        ]
        
        admin_reports = [
            ReportType.PLATFORM_OVERVIEW,
            ReportType.USER_STATISTICS,
            ReportType.REVENUE_REPORT,
            ReportType.FRAUD_REPORT
        ]
        
        reports = user_reports
        if user_role == "admin":
            reports.extend(admin_reports)
        
        return [
            {
                "type": r.value,
                "name": r.value.replace("_", " ").title(),
                "formats": [f.value for f in ReportFormat]
            }
            for r in reports
        ]
    
    async def _generate_report_data(
        self,
        report_type: ReportType,
        user_id: int,
        date_from: datetime,
        date_to: datetime,
        filters: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate report data based on type by querying the database."""
        df = date_from.isoformat() if isinstance(date_from, datetime) else str(date_from)
        dt = date_to.isoformat() if isinstance(date_to, datetime) else str(date_to)

        if report_type == ReportType.USER_EARNINGS:
            rows = parse_rows(execute_query(
                """SELECT p.title as project, t.amount, t.status, t.created_at as date
                   FROM transactions t LEFT JOIN projects p ON t.project_id = p.id
                   WHERE t.user_id = ? AND t.created_at >= ? AND t.created_at <= ?
                   ORDER BY t.created_at DESC""",
                [str(user_id), df, dt]
            ))
            total = sum(float(r.get("amount", 0)) for r in rows)
            return {
                "summary": {
                    "total_earned": total,
                    "total_transactions": len(rows),
                    "average_per_transaction": round(total / max(len(rows), 1), 2),
                    "period": f"{date_from.date()} to {date_to.date()}"
                },
                "items": rows
            }

        elif report_type == ReportType.USER_PROJECTS:
            rows = parse_rows(execute_query(
                """SELECT title, status, budget_min, budget_max, created_at
                   FROM projects WHERE client_id = ? AND created_at >= ? AND created_at <= ?
                   ORDER BY created_at DESC""",
                [str(user_id), df, dt]
            ))
            return {"total_projects": len(rows), "projects": rows}

        elif report_type == ReportType.PROJECT_SUMMARY:
            rows = parse_rows(execute_query(
                """SELECT title as name, status, budget_min as budget, budget_max as budget_max,
                          created_at FROM projects
                   WHERE (client_id = ? OR id IN (SELECT project_id FROM proposals WHERE freelancer_id = ?))
                   AND created_at >= ? AND created_at <= ?""",
                [str(user_id), str(user_id), df, dt]
            ))
            active = len([r for r in rows if r.get("status") in ("open", "in_progress")])
            completed = len([r for r in rows if r.get("status") == "completed"])
            cancelled = len([r for r in rows if r.get("status") == "cancelled"])
            return {
                "overview": {"total_projects": len(rows), "active": active,
                             "completed": completed, "cancelled": cancelled},
                "projects": rows
            }

        elif report_type == ReportType.PAYMENT_HISTORY:
            rows = parse_rows(execute_query(
                """SELECT id, amount, status, payment_method, created_at
                   FROM transactions WHERE user_id = ? AND created_at >= ? AND created_at <= ?
                   ORDER BY created_at DESC""",
                [str(user_id), df, dt]
            ))
            return {"total_payments": len(rows), "payments": rows}

        elif report_type == ReportType.TAX_SUMMARY:
            rows = parse_rows(execute_query(
                """SELECT amount, status, transaction_type FROM transactions
                   WHERE user_id = ? AND created_at >= ? AND created_at <= ?""",
                [str(user_id), df, dt]
            ))
            gross = sum(float(r.get("amount", 0)) for r in rows if r.get("status") == "completed")
            fee_rate = 0.10
            fees = round(gross * fee_rate, 2)
            net = round(gross - fees, 2)
            return {
                "income": {"gross_earnings": gross, "platform_fees": fees, "net_income": net},
                "summary": {"taxable_income": net, "estimated_tax": round(net * 0.22, 2)}
            }

        elif report_type == ReportType.PLATFORM_OVERVIEW:
            users = parse_rows(execute_query("SELECT COUNT(*) as cnt FROM users", []))
            projects = parse_rows(execute_query("SELECT COUNT(*) as cnt FROM projects", []))
            txns = parse_rows(execute_query(
                "SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE status = 'completed'", []
            ))
            return {
                "metrics": {
                    "total_users": int(users[0]["cnt"]) if users else 0,
                    "total_projects": int(projects[0]["cnt"]) if projects else 0,
                    "total_revenue": float(txns[0]["total"]) if txns else 0,
                    "period": f"{date_from.date()} to {date_to.date()}"
                }
            }

        elif report_type == ReportType.USER_STATISTICS:
            rows = parse_rows(execute_query(
                """SELECT role, COUNT(*) as cnt, MAX(created_at) as latest
                   FROM users GROUP BY role""", []
            ))
            return {"statistics": rows}

        else:
            return {
                "report_type": report_type.value,
                "period": f"{date_from.date()} to {date_to.date()}",
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
    
    def _format_csv(
        self,
        data: Dict[str, Any],
        report_type: ReportType
    ) -> str:
        """Format data as CSV."""
        output = io.StringIO()
        
        items = data.get("items") or data.get("projects") or []
        
        if items:
            writer = csv.DictWriter(output, fieldnames=items[0].keys())
            writer.writeheader()
            writer.writerows(items)
        
        return output.getvalue()
    
    def _format_json(
        self,
        data: Dict[str, Any],
        report_type: ReportType
    ) -> str:
        """Format data as JSON."""
        return json.dumps(data, indent=2, default=str)
    
    def _format_excel(
        self,
        data: Dict[str, Any],
        report_type: ReportType
    ) -> Dict[str, Any]:
        """Format data for Excel (would use openpyxl in production)."""
        return {
            "format": "excel",
            "sheets": [
                {"name": "Summary", "data": data.get("summary", {})},
                {"name": "Details", "data": data.get("items", data.get("projects", []))}
            ]
        }
    
    def _format_pdf(
        self,
        data: Dict[str, Any],
        report_type: ReportType
    ) -> Dict[str, Any]:
        """Format data for PDF (would use reportlab in production)."""
        template = self._templates.get(report_type.value, {})
        
        return {
            "format": "pdf",
            "title": template.get("title", report_type.value.replace("_", " ").title()),
            "sections": template.get("sections", ["data"]),
            "data": data
        }
    
    def _calculate_next_run(self, schedule: str) -> str:
        """Calculate next run time for schedule."""
        now = datetime.now(timezone.utc)
        
        if schedule == "daily":
            next_run = now.replace(hour=6, minute=0, second=0, microsecond=0)
            if next_run <= now:
                next_run += timedelta(days=1)
        elif schedule == "weekly":
            next_run = now.replace(hour=6, minute=0, second=0, microsecond=0)
            days_until_monday = (7 - now.weekday()) % 7
            if days_until_monday == 0 and next_run <= now:
                days_until_monday = 7
            next_run += timedelta(days=days_until_monday)
        elif schedule == "monthly":
            next_run = now.replace(day=1, hour=6, minute=0, second=0, microsecond=0)
            if now.month == 12:
                next_run = next_run.replace(year=now.year + 1, month=1)
            else:
                next_run = next_run.replace(month=now.month + 1)
        else:
            next_run = now + timedelta(days=1)
        
        return next_run.isoformat()


# Singleton instance
_report_service: Optional[ReportGenerationService] = None


def get_report_service() -> ReportGenerationService:
    """Get or create report service instance."""
    global _report_service
    if _report_service is None:
        _report_service = ReportGenerationService()
    return _report_service
