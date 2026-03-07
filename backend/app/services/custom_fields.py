# @AI-HINT: Custom fields service - dynamic field definitions for entities
"""Custom Fields Service - Dynamic Metadata System."""

import uuid
import re
from datetime import datetime, date, timezone
from typing import Dict, List, Any, Optional, Union
from collections import defaultdict


class CustomFieldsService:
    """Service for managing custom field definitions and values."""
    
    # Supported entity types
    ENTITY_TYPES = [
        "project", "user", "freelancer", "client", "contract",
        "proposal", "invoice", "milestone", "team"
    ]
    
    # Field types with validation
    FIELD_TYPES = {
        "text": {"python_type": str, "max_length": 10000},
        "textarea": {"python_type": str, "max_length": 100000},
        "number": {"python_type": (int, float), "min": None, "max": None},
        "integer": {"python_type": int, "min": None, "max": None},
        "decimal": {"python_type": float, "precision": 2},
        "boolean": {"python_type": bool},
        "date": {"python_type": str, "format": "%Y-%m-%d"},
        "datetime": {"python_type": str, "format": "%Y-%m-%dT%H:%M:%S"},
        "email": {"python_type": str, "pattern": r'^[\w\.-]+@[\w\.-]+\.\w+$'},
        "url": {"python_type": str, "pattern": r'^https?://'},
        "phone": {"python_type": str, "pattern": r'^[\d\s\+\-\(\)]+$'},
        "select": {"python_type": str, "options": []},
        "multiselect": {"python_type": list, "options": []},
        "checkbox": {"python_type": bool},
        "radio": {"python_type": str, "options": []},
        "currency": {"python_type": (int, float), "currency": "USD"},
        "percentage": {"python_type": (int, float), "min": 0, "max": 100},
        "json": {"python_type": (dict, list)},
        "file": {"python_type": str, "max_size": 10485760}  # 10MB
    }
    
    def __init__(self):
        # In-memory storage
        self._field_definitions: Dict[str, Dict] = {}  # field_id -> definition
        self._entity_fields: Dict[str, List[str]] = defaultdict(list)  # entity_type -> [field_ids]
        self._field_values: Dict[str, Dict[str, Any]] = defaultdict(dict)  # entity_key -> {field_id: value}
        self._field_groups: Dict[str, Dict] = {}  # group_id -> group
    
    def _entity_key(self, entity_type: str, entity_id: str) -> str:
        """Generate unique key for entity."""
        return f"{entity_type}:{entity_id}"
    
    async def create_field_definition(
        self,
        user_id: str,
        entity_type: str,
        name: str,
        field_type: str,
        label: str,
        description: Optional[str] = None,
        required: bool = False,
        default_value: Any = None,
        validation: Optional[Dict] = None,
        options: Optional[List[str]] = None,
        group_id: Optional[str] = None,
        order: int = 0,
        visible: bool = True,
        editable: bool = True
    ) -> Dict[str, Any]:
        """
        Create a custom field definition.
        
        Args:
            entity_type: Type of entity (project, user, etc.)
            name: Field name (snake_case identifier)
            field_type: Type of field (text, number, select, etc.)
            label: Display label
            description: Help text
            required: Is field required
            default_value: Default value
            validation: Custom validation rules
            options: Options for select/radio/multiselect
            group_id: Field group ID
            order: Display order
            visible: Is visible to users
            editable: Can be edited after creation
        """
        if entity_type not in self.ENTITY_TYPES:
            raise ValueError(f"Invalid entity type. Must be one of: {self.ENTITY_TYPES}")
        
        if field_type not in self.FIELD_TYPES:
            raise ValueError(f"Invalid field type. Must be one of: {list(self.FIELD_TYPES.keys())}")
        
        # Validate name format
        if not re.match(r'^[a-z][a-z0-9_]*$', name):
            raise ValueError("Field name must be lowercase, start with letter, use only a-z, 0-9, _")
        
        # Check for duplicate name
        existing = [f for f in self._entity_fields.get(entity_type, []) 
                    if self._field_definitions.get(f, {}).get("name") == name]
        if existing:
            raise ValueError(f"Field '{name}' already exists for {entity_type}")
        
        # Validate options for select fields
        if field_type in ["select", "multiselect", "radio"] and not options:
            raise ValueError(f"Field type '{field_type}' requires options")
        
        field_id = str(uuid.uuid4())
        
        definition = {
            "id": field_id,
            "entity_type": entity_type,
            "name": name,
            "field_type": field_type,
            "label": label,
            "description": description,
            "required": required,
            "default_value": default_value,
            "validation": validation or {},
            "options": options,
            "group_id": group_id,
            "order": order,
            "visible": visible,
            "editable": editable,
            "created_by": user_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        self._field_definitions[field_id] = definition
        self._entity_fields[entity_type].append(field_id)
        
        return {
            "success": True,
            "field": definition
        }
    
    async def get_field_definitions(
        self,
        entity_type: str,
        include_hidden: bool = False
    ) -> Dict[str, Any]:
        """Get all field definitions for an entity type."""
        if entity_type not in self.ENTITY_TYPES:
            raise ValueError(f"Invalid entity type")
        
        field_ids = self._entity_fields.get(entity_type, [])
        fields = []
        
        for fid in field_ids:
            field = self._field_definitions.get(fid)
            if field:
                if include_hidden or field.get("visible", True):
                    fields.append(field)
        
        # Sort by order
        fields.sort(key=lambda x: x.get("order", 0))
        
        # Group by group_id
        grouped = defaultdict(list)
        ungrouped = []
        for field in fields:
            if field.get("group_id"):
                grouped[field["group_id"]].append(field)
            else:
                ungrouped.append(field)
        
        return {
            "entity_type": entity_type,
            "fields": fields,
            "grouped_fields": dict(grouped),
            "ungrouped_fields": ungrouped,
            "total": len(fields)
        }
    
    async def update_field_definition(
        self,
        user_id: str,
        field_id: str,
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update a field definition."""
        field = self._field_definitions.get(field_id)
        if not field:
            raise ValueError("Field not found")
        
        # Fields that can be updated
        allowed = ["label", "description", "required", "default_value", 
                   "validation", "options", "group_id", "order", "visible", "editable"]
        
        for key, value in updates.items():
            if key in allowed:
                field[key] = value
        
        field["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        return {
            "success": True,
            "field": field
        }
    
    async def delete_field_definition(
        self,
        user_id: str,
        field_id: str
    ) -> Dict[str, Any]:
        """Delete a field definition and all its values."""
        field = self._field_definitions.get(field_id)
        if not field:
            raise ValueError("Field not found")
        
        # Remove from entity fields
        entity_type = field["entity_type"]
        if field_id in self._entity_fields.get(entity_type, []):
            self._entity_fields[entity_type].remove(field_id)
        
        # Remove values
        for entity_key in list(self._field_values.keys()):
            if field_id in self._field_values[entity_key]:
                del self._field_values[entity_key][field_id]
        
        # Remove definition
        del self._field_definitions[field_id]
        
        return {
            "success": True,
            "message": f"Field '{field['name']}' deleted"
        }
    
    def _validate_value(self, field: Dict, value: Any) -> tuple:
        """Validate a value against field definition."""
        field_type = field["field_type"]
        type_config = self.FIELD_TYPES[field_type]
        
        # Check required
        if field.get("required") and value is None:
            return False, f"Field '{field['label']}' is required"
        
        if value is None:
            return True, None
        
        # Type validation
        expected_type = type_config["python_type"]
        if isinstance(expected_type, tuple):
            if not isinstance(value, expected_type):
                return False, f"Expected {expected_type}, got {type(value)}"
        else:
            if not isinstance(value, expected_type):
                return False, f"Expected {expected_type.__name__}, got {type(value).__name__}"
        
        # Pattern validation
        if "pattern" in type_config and isinstance(value, str):
            if not re.match(type_config["pattern"], value):
                return False, f"Value doesn't match expected format for {field_type}"
        
        # Length validation
        if "max_length" in type_config and isinstance(value, str):
            if len(value) > type_config["max_length"]:
                return False, f"Value exceeds maximum length of {type_config['max_length']}"
        
        # Options validation
        if field_type in ["select", "radio"]:
            if value not in (field.get("options") or []):
                return False, f"Invalid option. Must be one of: {field.get('options')}"
        
        if field_type == "multiselect":
            invalid = [v for v in value if v not in (field.get("options") or [])]
            if invalid:
                return False, f"Invalid options: {invalid}"
        
        # Custom validation
        custom = field.get("validation", {})
        if "min" in custom and isinstance(value, (int, float)):
            if value < custom["min"]:
                return False, f"Value must be at least {custom['min']}"
        if "max" in custom and isinstance(value, (int, float)):
            if value > custom["max"]:
                return False, f"Value must be at most {custom['max']}"
        
        return True, None
    
    async def set_field_value(
        self,
        user_id: str,
        entity_type: str,
        entity_id: str,
        field_name: str,
        value: Any
    ) -> Dict[str, Any]:
        """Set a custom field value for an entity."""
        # Find field by name
        field_ids = self._entity_fields.get(entity_type, [])
        field = None
        for fid in field_ids:
            f = self._field_definitions.get(fid)
            if f and f["name"] == field_name:
                field = f
                break
        
        if not field:
            raise ValueError(f"Field '{field_name}' not found for {entity_type}")
        
        # Check if editable
        if not field.get("editable", True):
            raise ValueError(f"Field '{field_name}' is not editable")
        
        # Validate value
        is_valid, error = self._validate_value(field, value)
        if not is_valid:
            raise ValueError(error)
        
        entity_key = self._entity_key(entity_type, entity_id)
        self._field_values[entity_key][field["id"]] = {
            "value": value,
            "updated_by": user_id,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        return {
            "success": True,
            "field_name": field_name,
            "value": value
        }
    
    async def set_multiple_field_values(
        self,
        user_id: str,
        entity_type: str,
        entity_id: str,
        values: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Set multiple custom field values at once."""
        results = {"success": [], "errors": []}
        
        for field_name, value in values.items():
            try:
                await self.set_field_value(
                    db=db,
                    user_id=user_id,
                    entity_type=entity_type,
                    entity_id=entity_id,
                    field_name=field_name,
                    value=value
                )
                results["success"].append(field_name)
            except ValueError as e:
                results["errors"].append({"field": field_name, "error": str(e)})
        
        return {
            "total_processed": len(values),
            "succeeded": len(results["success"]),
            "failed": len(results["errors"]),
            "results": results
        }
    
    async def get_field_values(
        self,
        entity_type: str,
        entity_id: str,
        include_empty: bool = True
    ) -> Dict[str, Any]:
        """Get all custom field values for an entity."""
        entity_key = self._entity_key(entity_type, entity_id)
        stored_values = self._field_values.get(entity_key, {})
        
        # Get field definitions
        field_ids = self._entity_fields.get(entity_type, [])
        
        values = {}
        for fid in field_ids:
            field = self._field_definitions.get(fid)
            if field and field.get("visible", True):
                stored = stored_values.get(fid)
                
                if stored:
                    values[field["name"]] = {
                        "field": {
                            "id": field["id"],
                            "label": field["label"],
                            "field_type": field["field_type"]
                        },
                        "value": stored["value"],
                        "updated_at": stored["updated_at"]
                    }
                elif include_empty:
                    values[field["name"]] = {
                        "field": {
                            "id": field["id"],
                            "label": field["label"],
                            "field_type": field["field_type"]
                        },
                        "value": field.get("default_value"),
                        "updated_at": None
                    }
        
        return {
            "entity_type": entity_type,
            "entity_id": entity_id,
            "values": values,
            "total_fields": len(values)
        }
    
    async def create_field_group(
        self,
        user_id: str,
        entity_type: str,
        name: str,
        label: str,
        description: Optional[str] = None,
        order: int = 0,
        collapsible: bool = True,
        collapsed_by_default: bool = False
    ) -> Dict[str, Any]:
        """Create a field group for organizing fields."""
        group_id = str(uuid.uuid4())
        
        group = {
            "id": group_id,
            "entity_type": entity_type,
            "name": name,
            "label": label,
            "description": description,
            "order": order,
            "collapsible": collapsible,
            "collapsed_by_default": collapsed_by_default,
            "created_by": user_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        self._field_groups[group_id] = group
        
        return {
            "success": True,
            "group": group
        }
    
    async def get_field_groups(
        self,
        entity_type: str
    ) -> Dict[str, Any]:
        """Get all field groups for an entity type."""
        groups = [g for g in self._field_groups.values() if g["entity_type"] == entity_type]
        groups.sort(key=lambda x: x.get("order", 0))
        
        return {
            "groups": groups,
            "total": len(groups)
        }
    
    async def export_field_definitions(
        self,
        entity_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """Export field definitions for backup/transfer."""
        if entity_type:
            field_ids = self._entity_fields.get(entity_type, [])
            fields = [self._field_definitions[fid] for fid in field_ids if fid in self._field_definitions]
            groups = [g for g in self._field_groups.values() if g["entity_type"] == entity_type]
        else:
            fields = list(self._field_definitions.values())
            groups = list(self._field_groups.values())
        
        return {
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "entity_type": entity_type,
            "fields": fields,
            "groups": groups,
            "total_fields": len(fields),
            "total_groups": len(groups)
        }


# Singleton instance
custom_fields_service = CustomFieldsService()
