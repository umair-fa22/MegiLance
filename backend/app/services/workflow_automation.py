# @AI-HINT: Workflow automation service for triggers, actions, and automated processes (Turso DB-backed)
"""Workflow Automation Service."""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta, timezone
from enum import Enum
import logging
import uuid
import json

from app.db.turso_http import execute_query, parse_rows

logger = logging.getLogger(__name__)

_workflow_tables_ensured = False

def _ensure_workflow_tables():
    global _workflow_tables_ensured
    if _workflow_tables_ensured:
        return
    execute_query("""
        CREATE TABLE IF NOT EXISTS workflows (
            id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'draft',
            trigger_config TEXT,
            conditions TEXT,
            actions TEXT,
            execution_count INTEGER DEFAULT 0,
            last_executed_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """, [])
    execute_query("CREATE INDEX IF NOT EXISTS idx_wf_user ON workflows(user_id)", [])
    execute_query("CREATE INDEX IF NOT EXISTS idx_wf_status ON workflows(status)", [])
    execute_query("""
        CREATE TABLE IF NOT EXISTS workflow_executions (
            id TEXT PRIMARY KEY,
            workflow_id TEXT NOT NULL,
            user_id INTEGER NOT NULL,
            status TEXT DEFAULT 'pending',
            trigger_type TEXT,
            trigger_data TEXT,
            results TEXT,
            error TEXT,
            started_at TEXT NOT NULL,
            completed_at TEXT
        )
    """, [])
    execute_query("CREATE INDEX IF NOT EXISTS idx_wfx_workflow ON workflow_executions(workflow_id)", [])
    _workflow_tables_ensured = True


class TriggerType(str, Enum):
    # Project Triggers
    PROJECT_CREATED = "project_created"
    PROJECT_PUBLISHED = "project_published"
    PROJECT_COMPLETED = "project_completed"
    PROJECT_CANCELLED = "project_cancelled"
    
    # Proposal Triggers
    PROPOSAL_RECEIVED = "proposal_received"
    PROPOSAL_ACCEPTED = "proposal_accepted"
    PROPOSAL_REJECTED = "proposal_rejected"
    
    # Contract Triggers
    CONTRACT_STARTED = "contract_started"
    CONTRACT_COMPLETED = "contract_completed"
    CONTRACT_CANCELLED = "contract_cancelled"
    MILESTONE_COMPLETED = "milestone_completed"
    MILESTONE_APPROVED = "milestone_approved"
    
    # Payment Triggers
    PAYMENT_RECEIVED = "payment_received"
    PAYMENT_SENT = "payment_sent"
    PAYMENT_FAILED = "payment_failed"
    
    # Message Triggers
    MESSAGE_RECEIVED = "message_received"
    
    # Review Triggers
    REVIEW_RECEIVED = "review_received"
    
    # Time-based Triggers
    SCHEDULE = "schedule"
    DEADLINE_APPROACHING = "deadline_approaching"
    
    # User Triggers
    USER_REGISTERED = "user_registered"
    USER_VERIFIED = "user_verified"


class ActionType(str, Enum):
    # Notification Actions
    SEND_EMAIL = "send_email"
    SEND_PUSH = "send_push"
    SEND_SMS = "send_sms"
    SEND_IN_APP = "send_in_app"
    
    # Task Actions
    CREATE_TASK = "create_task"
    UPDATE_TASK = "update_task"
    ASSIGN_TASK = "assign_task"
    
    # Communication Actions
    SEND_MESSAGE = "send_message"
    CREATE_TEMPLATE_RESPONSE = "create_template_response"
    
    # Status Actions
    UPDATE_STATUS = "update_status"
    ADD_TAG = "add_tag"
    REMOVE_TAG = "remove_tag"
    
    # Integration Actions
    WEBHOOK = "webhook"
    SLACK_MESSAGE = "slack_message"
    DISCORD_MESSAGE = "discord_message"
    
    # Workflow Actions
    DELAY = "delay"
    CONDITION = "condition"
    BRANCH = "branch"
    
    # Data Actions
    UPDATE_FIELD = "update_field"
    LOG_ACTIVITY = "log_activity"


class ConditionOperator(str, Enum):
    EQUALS = "equals"
    NOT_EQUALS = "not_equals"
    GREATER_THAN = "greater_than"
    LESS_THAN = "less_than"
    CONTAINS = "contains"
    NOT_CONTAINS = "not_contains"
    IS_EMPTY = "is_empty"
    IS_NOT_EMPTY = "is_not_empty"
    IN_LIST = "in_list"
    NOT_IN_LIST = "not_in_list"


class WorkflowStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    ARCHIVED = "archived"


class ExecutionStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


# Pre-built workflow templates
WORKFLOW_TEMPLATES = [
    {
        "id": "tpl-1",
        "name": "Welcome New Users",
        "description": "Send welcome email when a new user registers",
        "category": "Onboarding",
        "trigger": {"type": TriggerType.USER_REGISTERED},
        "actions": [
            {
                "type": ActionType.SEND_EMAIL,
                "config": {
                    "template": "welcome_email",
                    "delay_minutes": 0
                }
            },
            {
                "type": ActionType.DELAY,
                "config": {"minutes": 1440}  # 24 hours
            },
            {
                "type": ActionType.SEND_EMAIL,
                "config": {
                    "template": "complete_profile_reminder"
                }
            }
        ]
    },
    {
        "id": "tpl-2",
        "name": "New Proposal Alert",
        "description": "Notify client when new proposal is received",
        "category": "Proposals",
        "trigger": {"type": TriggerType.PROPOSAL_RECEIVED},
        "actions": [
            {
                "type": ActionType.SEND_EMAIL,
                "config": {
                    "template": "new_proposal_notification"
                }
            },
            {
                "type": ActionType.SEND_PUSH,
                "config": {
                    "title": "New Proposal Received",
                    "body": "{{freelancer_name}} submitted a proposal for {{project_title}}"
                }
            }
        ]
    },
    {
        "id": "tpl-3",
        "name": "Milestone Completed Notification",
        "description": "Notify client when milestone is completed",
        "category": "Contracts",
        "trigger": {"type": TriggerType.MILESTONE_COMPLETED},
        "actions": [
            {
                "type": ActionType.SEND_EMAIL,
                "config": {"template": "milestone_completed"}
            },
            {
                "type": ActionType.CREATE_TASK,
                "config": {
                    "title": "Review milestone: {{milestone_name}}",
                    "due_hours": 48
                }
            }
        ]
    },
    {
        "id": "tpl-4",
        "name": "Payment Confirmation",
        "description": "Send confirmation when payment is received",
        "category": "Payments",
        "trigger": {"type": TriggerType.PAYMENT_RECEIVED},
        "actions": [
            {
                "type": ActionType.SEND_EMAIL,
                "config": {"template": "payment_received"}
            },
            {
                "type": ActionType.LOG_ACTIVITY,
                "config": {
                    "message": "Payment of {{amount}} received for {{project_title}}"
                }
            }
        ]
    },
    {
        "id": "tpl-5",
        "name": "Deadline Reminder",
        "description": "Remind about upcoming deadlines",
        "category": "Reminders",
        "trigger": {
            "type": TriggerType.DEADLINE_APPROACHING,
            "config": {"days_before": 2}
        },
        "actions": [
            {
                "type": ActionType.SEND_EMAIL,
                "config": {"template": "deadline_reminder"}
            },
            {
                "type": ActionType.SEND_PUSH,
                "config": {
                    "title": "Deadline Approaching",
                    "body": "{{milestone_name}} is due in {{days_remaining}} days"
                }
            }
        ]
    }
]


class WorkflowAutomationService:
    """Service for workflow automation with Turso DB persistence"""
    
    def __init__(self, db=None):
        _ensure_workflow_tables()
    
    # Workflow Templates
    async def get_templates(
        self,
        category: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        templates = WORKFLOW_TEMPLATES.copy()
        if category:
            templates = [t for t in templates if t.get("category") == category]
        return templates
    
    async def get_template(self, template_id: str) -> Optional[Dict[str, Any]]:
        for template in WORKFLOW_TEMPLATES:
            if template["id"] == template_id:
                return template
        return None
    
    async def get_template_categories(self) -> List[str]:
        categories = set()
        for template in WORKFLOW_TEMPLATES:
            categories.add(template.get("category", "Other"))
        return sorted(list(categories))
    
    # Workflow Management
    async def create_workflow(
        self,
        user_id: int,
        name: str,
        description: Optional[str],
        trigger: Dict[str, Any],
        conditions: List[Dict[str, Any]],
        actions: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        workflow_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        execute_query(
            """INSERT INTO workflows (id, user_id, name, description, status,
               trigger_config, conditions, actions, execution_count, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)""",
            [workflow_id, user_id, name, description, WorkflowStatus.DRAFT.value,
             json.dumps(trigger), json.dumps(conditions), json.dumps(actions), now, now]
        )
        
        workflow = {
            "id": workflow_id,
            "user_id": user_id,
            "name": name,
            "description": description,
            "status": WorkflowStatus.DRAFT.value,
            "trigger": trigger,
            "conditions": conditions,
            "actions": actions,
            "created_at": now,
            "updated_at": now,
            "execution_count": 0,
            "last_executed_at": None
        }
        return {"workflow": workflow}
    
    async def create_from_template(
        self,
        user_id: int,
        template_id: str,
        name: Optional[str] = None,
        customizations: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        template = await self.get_template(template_id)
        if not template:
            return {"error": "Template not found"}
        
        workflow_name = name or f"{template['name']} (Copy)"
        return await self.create_workflow(
            user_id=user_id,
            name=workflow_name,
            description=template.get("description"),
            trigger=template.get("trigger", {}),
            conditions=customizations.get("conditions", []) if customizations else [],
            actions=template.get("actions", [])
        )
    
    def _parse_workflow_row(self, row: Dict) -> Dict[str, Any]:
        """Parse a workflow DB row into a proper dict."""
        for field in ("trigger_config", "conditions", "actions"):
            if row.get(field):
                try:
                    row[field] = json.loads(row[field])
                except (json.JSONDecodeError, ValueError):
                    row[field] = {} if field == "trigger_config" else []
            else:
                row[field] = {} if field == "trigger_config" else []
        # Rename trigger_config to trigger for API consistency
        row["trigger"] = row.pop("trigger_config", {})
        return row
    
    async def get_user_workflows(
        self,
        user_id: int,
        status_filter: Optional[WorkflowStatus] = None,
        limit: int = 50
    ) -> Dict[str, Any]:
        where = "user_id = ?"
        params: list = [user_id]
        if status_filter:
            where += " AND status = ?"
            params.append(status_filter.value)
        
        count_result = execute_query(
            f"SELECT COUNT(*) as total FROM workflows WHERE {where}", list(params)
        )
        total = 0
        if count_result and count_result.get("rows"):
            rows = parse_rows(count_result)
            if rows:
                total = rows[0].get("total", 0)
        
        params.append(limit)
        result = execute_query(
            f"""SELECT id, user_id, name, description, status, trigger_config,
                conditions, actions, execution_count, last_executed_at,
                created_at, updated_at FROM workflows
                WHERE {where} ORDER BY updated_at DESC LIMIT ?""",
            params
        )
        
        workflows = []
        if result and result.get("rows"):
            workflows = [self._parse_workflow_row(r) for r in parse_rows(result)]
        
        return {"workflows": workflows, "total": total}
    
    async def get_workflow(
        self,
        user_id: int,
        workflow_id: str
    ) -> Optional[Dict[str, Any]]:
        result = execute_query(
            """SELECT id, user_id, name, description, status, trigger_config,
               conditions, actions, execution_count, last_executed_at,
               created_at, updated_at FROM workflows WHERE id = ? AND user_id = ?""",
            [workflow_id, user_id]
        )
        if not result or not result.get("rows"):
            return {"error": "Workflow not found"}
        rows = parse_rows(result)
        if not rows:
            return {"error": "Workflow not found"}
        return self._parse_workflow_row(rows[0])
    
    async def update_workflow(
        self,
        user_id: int,
        workflow_id: str,
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        allowed = {"name", "description", "trigger", "conditions", "actions"}
        set_parts = ["updated_at = ?"]
        params: list = [datetime.now(timezone.utc).isoformat()]
        
        for key, val in updates.items():
            if key not in allowed:
                continue
            col = "trigger_config" if key == "trigger" else key
            if key in ("trigger", "conditions", "actions"):
                val = json.dumps(val)
            set_parts.append(f"{col} = ?")
            params.append(val)
        
        params.extend([workflow_id, user_id])
        execute_query(
            f"UPDATE workflows SET {', '.join(set_parts)} WHERE id = ? AND user_id = ?",
            params
        )
        return {"message": "Workflow updated", "workflow_id": workflow_id}
    
    async def delete_workflow(
        self,
        user_id: int,
        workflow_id: str
    ) -> Dict[str, Any]:
        execute_query(
            "DELETE FROM workflow_executions WHERE workflow_id = ? AND user_id = ?",
            [workflow_id, user_id]
        )
        execute_query(
            "DELETE FROM workflows WHERE id = ? AND user_id = ?",
            [workflow_id, user_id]
        )
        return {"message": "Workflow deleted", "workflow_id": workflow_id}
    
    async def activate_workflow(
        self,
        user_id: int,
        workflow_id: str
    ) -> Dict[str, Any]:
        now = datetime.now(timezone.utc).isoformat()
        execute_query(
            "UPDATE workflows SET status = ?, updated_at = ? WHERE id = ? AND user_id = ?",
            [WorkflowStatus.ACTIVE.value, now, workflow_id, user_id]
        )
        return {
            "message": "Workflow activated",
            "workflow_id": workflow_id,
            "status": WorkflowStatus.ACTIVE.value
        }
    
    async def pause_workflow(
        self,
        user_id: int,
        workflow_id: str
    ) -> Dict[str, Any]:
        now = datetime.now(timezone.utc).isoformat()
        execute_query(
            "UPDATE workflows SET status = ?, updated_at = ? WHERE id = ? AND user_id = ?",
            [WorkflowStatus.PAUSED.value, now, workflow_id, user_id]
        )
        return {
            "message": "Workflow paused",
            "workflow_id": workflow_id,
            "status": WorkflowStatus.PAUSED.value
        }
    
    # Trigger Handling
    async def process_trigger(
        self,
        trigger_type: TriggerType,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Process a trigger event — find active workflows matching this trigger and execute them."""
        result = execute_query(
            "SELECT id, user_id, trigger_config, conditions, actions FROM workflows WHERE status = ?",
            [WorkflowStatus.ACTIVE.value]
        )
        
        matched = 0
        executed = 0
        if result and result.get("rows"):
            rows = parse_rows(result)
            for row in rows:
                trigger_cfg = {}
                try:
                    trigger_cfg = json.loads(row.get("trigger_config", "{}"))
                except (json.JSONDecodeError, ValueError):
                    pass
                if trigger_cfg.get("type") == trigger_type.value:
                    matched += 1
                    exec_result = await self._execute_actions(
                        row["id"], row["user_id"],
                        json.loads(row.get("actions", "[]")),
                        json.loads(row.get("conditions", "[]")),
                        context, trigger_type
                    )
                    if exec_result.get("status") == ExecutionStatus.COMPLETED.value:
                        executed += 1
        
        return {
            "trigger_type": trigger_type.value,
            "workflows_matched": matched,
            "workflows_executed": executed
        }
    
    async def _execute_actions(
        self,
        workflow_id: str,
        user_id: int,
        actions: List[Dict],
        conditions: List[Dict],
        context: Dict[str, Any],
        trigger_type: TriggerType
    ) -> Dict[str, Any]:
        """Execute workflow actions and record execution."""
        exec_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        execute_query(
            """INSERT INTO workflow_executions (id, workflow_id, user_id, status,
               trigger_type, trigger_data, started_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            [exec_id, workflow_id, user_id, ExecutionStatus.RUNNING.value,
             trigger_type.value, json.dumps(context), now]
        )
        
        results = []
        status = ExecutionStatus.COMPLETED.value
        error_msg = None
        
        try:
            for action in actions:
                action_type = action.get("type", "")
                config = action.get("config", {})
                
                if action_type == ActionType.SEND_IN_APP.value:
                    from app.services.notifications_service import send_notification
                    send_notification(
                        user_id=user_id,
                        notification_type="workflow",
                        title=config.get("title", "Workflow Notification"),
                        content=config.get("body", ""),
                        data={"workflow_id": workflow_id, "context": context}
                    )
                    results.append({"action": action_type, "status": "completed"})
                elif action_type == ActionType.LOG_ACTIVITY.value:
                    results.append({"action": action_type, "status": "completed",
                                    "message": config.get("message", "")})
                elif action_type == ActionType.DELAY.value:
                    results.append({"action": action_type, "status": "completed",
                                    "delay_minutes": config.get("minutes", 0)})
                else:
                    # For other actions (email, push, webhook, etc.), log as pending
                    results.append({"action": action_type, "status": "pending",
                                    "note": "Action type requires external integration"})
        except Exception as e:
            status = ExecutionStatus.FAILED.value
            error_msg = str(e)
            logger.error(f"Workflow {workflow_id} execution failed: {e}")
        
        completed_at = datetime.now(timezone.utc).isoformat()
        execute_query(
            """UPDATE workflow_executions SET status = ?, results = ?, error = ?,
               completed_at = ? WHERE id = ?""",
            [status, json.dumps(results), error_msg, completed_at, exec_id]
        )
        
        # Update workflow execution count
        execute_query(
            """UPDATE workflows SET execution_count = execution_count + 1,
               last_executed_at = ?, updated_at = ? WHERE id = ?""",
            [completed_at, completed_at, workflow_id]
        )
        
        return {
            "execution_id": exec_id,
            "workflow_id": workflow_id,
            "status": status,
            "results": results,
            "error": error_msg
        }
    
    # Execution History
    async def get_execution_history(
        self,
        user_id: int,
        workflow_id: Optional[str] = None,
        limit: int = 50
    ) -> Dict[str, Any]:
        where = "user_id = ?"
        params: list = [user_id]
        if workflow_id:
            where += " AND workflow_id = ?"
            params.append(workflow_id)
        
        count_result = execute_query(
            f"SELECT COUNT(*) as total FROM workflow_executions WHERE {where}", list(params)
        )
        total = 0
        if count_result and count_result.get("rows"):
            rows = parse_rows(count_result)
            if rows:
                total = rows[0].get("total", 0)
        
        params.append(limit)
        result = execute_query(
            f"""SELECT id, workflow_id, user_id, status, trigger_type, trigger_data,
                results, error, started_at, completed_at
                FROM workflow_executions WHERE {where}
                ORDER BY started_at DESC LIMIT ?""",
            params
        )
        
        executions = []
        if result and result.get("rows"):
            executions = parse_rows(result)
            for ex in executions:
                for field in ("trigger_data", "results"):
                    if ex.get(field):
                        try:
                            ex[field] = json.loads(ex[field])
                        except (json.JSONDecodeError, ValueError):
                            ex[field] = {}
        
        return {"executions": executions, "total": total}
    
    async def get_execution_details(
        self,
        user_id: int,
        execution_id: str
    ) -> Optional[Dict[str, Any]]:
        result = execute_query(
            """SELECT id, workflow_id, user_id, status, trigger_type, trigger_data,
               results, error, started_at, completed_at
               FROM workflow_executions WHERE id = ? AND user_id = ?""",
            [execution_id, user_id]
        )
        if not result or not result.get("rows"):
            return {"error": "Execution not found"}
        rows = parse_rows(result)
        if not rows:
            return {"error": "Execution not found"}
        ex = rows[0]
        for field in ("trigger_data", "results"):
            if ex.get(field):
                try:
                    ex[field] = json.loads(ex[field])
                except (json.JSONDecodeError, ValueError):
                    ex[field] = {}
        return ex
    
    # Manual Execution
    async def execute_workflow(
        self,
        user_id: int,
        workflow_id: str,
        test_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        wf = await self.get_workflow(user_id, workflow_id)
        if not wf or wf.get("error"):
            return {"error": "Workflow not found"}
        
        context = test_data or {}
        trigger_type_str = wf.get("trigger", {}).get("type", TriggerType.SCHEDULE.value)
        try:
            trigger_type = TriggerType(trigger_type_str)
        except ValueError:
            trigger_type = TriggerType.SCHEDULE
        
        return await self._execute_actions(
            workflow_id, user_id,
            wf.get("actions", []),
            wf.get("conditions", []),
            context, trigger_type
        )
    
    # Trigger Types
    async def get_available_triggers(self) -> List[Dict[str, Any]]:
        """Get available trigger types"""
        triggers = []
        for trigger in TriggerType:
            triggers.append({
                "type": trigger.value,
                "name": trigger.value.replace("_", " ").title(),
                "category": self._get_trigger_category(trigger)
            })
        return triggers
    
    # Action Types
    async def get_available_actions(self) -> List[Dict[str, Any]]:
        """Get available action types"""
        actions = []
        for action in ActionType:
            actions.append({
                "type": action.value,
                "name": action.value.replace("_", " ").title(),
                "category": self._get_action_category(action)
            })
        return actions
    
    # Condition Operators
    async def get_condition_operators(self) -> List[Dict[str, Any]]:
        """Get available condition operators"""
        return [
            {"operator": op.value, "name": op.value.replace("_", " ").title()}
            for op in ConditionOperator
        ]
    
    # Helper Methods
    def _get_trigger_category(self, trigger: TriggerType) -> str:
        """Get category for a trigger type"""
        if "PROJECT" in trigger.value:
            return "Projects"
        elif "PROPOSAL" in trigger.value:
            return "Proposals"
        elif "CONTRACT" in trigger.value or "MILESTONE" in trigger.value:
            return "Contracts"
        elif "PAYMENT" in trigger.value:
            return "Payments"
        elif "MESSAGE" in trigger.value:
            return "Messages"
        elif "REVIEW" in trigger.value:
            return "Reviews"
        elif "USER" in trigger.value:
            return "Users"
        else:
            return "General"
    
    def _get_action_category(self, action: ActionType) -> str:
        """Get category for an action type"""
        if "SEND" in action.value:
            return "Notifications"
        elif "TASK" in action.value:
            return "Tasks"
        elif action.value in ["WEBHOOK", "SLACK_MESSAGE", "DISCORD_MESSAGE"]:
            return "Integrations"
        elif action.value in ["DELAY", "CONDITION", "BRANCH"]:
            return "Flow Control"
        else:
            return "General"
    
    # Statistics
    async def get_workflow_stats(
        self,
        user_id: int,
        period_days: int = 30
    ) -> Dict[str, Any]:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=period_days)).isoformat()
        
        wf_result = execute_query(
            "SELECT COUNT(*) as total FROM workflows WHERE user_id = ?", [user_id]
        )
        total_wf = 0
        if wf_result and wf_result.get("rows"):
            rows = parse_rows(wf_result)
            if rows:
                total_wf = int(rows[0].get("total", 0))
        
        active_result = execute_query(
            "SELECT COUNT(*) as total FROM workflows WHERE user_id = ? AND status = ?",
            [user_id, WorkflowStatus.ACTIVE.value]
        )
        active_wf = 0
        if active_result and active_result.get("rows"):
            rows = parse_rows(active_result)
            if rows:
                active_wf = int(rows[0].get("total", 0))
        
        exec_result = execute_query(
            """SELECT
                 COUNT(*) as total,
                 SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as success,
                 SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as failed
               FROM workflow_executions
               WHERE user_id = ? AND started_at >= ?""",
            [ExecutionStatus.COMPLETED.value, ExecutionStatus.FAILED.value, user_id, cutoff]
        )
        total_exec = 0
        successful = 0
        failed = 0
        if exec_result and exec_result.get("rows"):
            rows = parse_rows(exec_result)
            if rows:
                total_exec = int(rows[0].get("total", 0))
                successful = int(rows[0].get("success", 0) or 0)
                failed = int(rows[0].get("failed", 0) or 0)
        
        return {
            "period_days": period_days,
            "total_workflows": total_wf,
            "active_workflows": active_wf,
            "total_executions": total_exec,
            "successful_executions": successful,
            "failed_executions": failed,
            "actions_performed": total_exec,
            "time_saved_hours": round(total_exec * 0.25, 1)
        }


def get_workflow_automation_service(db=None) -> WorkflowAutomationService:
    """Get workflow automation service instance"""
    return WorkflowAutomationService()
