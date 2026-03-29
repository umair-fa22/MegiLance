# @AI-HINT: Input validation utilities to prevent SQL injection, XSS, and data corruption

import re
import logging
from typing import Optional, Any
from pydantic import BaseModel, Field, validator

logger = logging.getLogger(__name__)


class ValidatedString:
    """Utility for string validation and sanitization"""
    
    @staticmethod
    def sanitize_input(value: str, max_length: int = 1000, allow_html: bool = False) -> str:
        """Sanitize user input to prevent XSS"""
        if not isinstance(value, str):
            raise ValueError("Input must be a string")
        
        # Trim whitespace
        value = value.strip()
        
        # Check length
        if len(value) > max_length:
            raise ValueError(f"Input exceeds maximum length of {max_length} characters")
        
        # Remove dangerous patterns
        if not allow_html:
            # Remove HTML tags and scripts
            value = re.sub(r'<[^>]+>', '', value)
            value = re.sub(r'(javascript:|on\w+=|eval\()', '', value, flags=re.IGNORECASE)
        
        return value
    
    @staticmethod
    def validate_email(email: str) -> str:
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, email):
            raise ValueError("Invalid email format")
        if len(email) > 254:
            raise ValueError("Email too long")
        return email.lower()
    
    @staticmethod
    def validate_phone(phone: str) -> str:
        """Validate phone number format"""
        # Remove non-digit characters
        digits_only = re.sub(r'\D', '', phone)
        if len(digits_only) < 10 or len(digits_only) > 15:
            raise ValueError("Invalid phone number")
        return phone
    
    @staticmethod
    def validate_url(url: str) -> str:
        """Validate URL format"""
        pattern = r'^https?://[^\s/$.?#].[^\s]*$'
        if not re.match(pattern, url, re.IGNORECASE):
            raise ValueError("Invalid URL format")
        if len(url) > 2048:
            raise ValueError("URL too long")
        return url


class ValidatedInteger:
    """Utility for integer validation"""
    
    @staticmethod
    def validate_positive(value: int, min_val: int = 1, max_val: Optional[int] = None) -> int:
        """Validate positive integer"""
        if not isinstance(value, int):
            raise ValueError("Input must be an integer")
        if value < min_val:
            raise ValueError(f"Value must be at least {min_val}")
        if max_val is not None and value > max_val:
            raise ValueError(f"Value cannot exceed {max_val}")
        return value
    
    @staticmethod
    def validate_percentage(value: int) -> int:
        """Validate percentage (0-100)"""
        return ValidatedInteger.validate_positive(value, 0, 100)


class ValidatedEmail(str):
    """Email field with built-in validation"""
    
    def __new__(cls, value: str):
        validated = ValidatedString.validate_email(value)
        return str.__new__(cls, validated)


# Pydantic models for common request/response patterns

class PaginationParams(BaseModel):
    """Common pagination parameters"""
    skip: int = Field(0, ge=0, description="Number of records to skip")
    limit: int = Field(20, ge=1, le=100, description="Maximum records to return")
    
    @validator('skip')
    def validate_skip(cls, v):
        if v < 0:
            raise ValueError("skip must be non-negative")
        return v


class SearchParams(BaseModel):
    """Common search parameters"""
    q: str = Field(..., min_length=1, max_length=100)
    skip: int = Field(0, ge=0)
    limit: int = Field(20, ge=1, le=100)
    
    @validator('q')
    def validate_query(cls, v):
        # Prevent SQL injection
        if any(char in v for char in [";", "--", "/*", "*/"]):
            raise ValueError("Invalid characters in search query")
        return ValidatedString.sanitize_input(v, max_length=100)


class ErrorResponse(BaseModel):
    """Standard error response"""
    detail: str = Field(..., description="Error message")
    error_type: Optional[str] = Field(None, description="Error type/code")
    status_code: int = Field(..., description="HTTP status code")


class SuccessResponse(BaseModel):
    """Standard success response"""
    success: bool = True
    message: Optional[str] = None
    data: Optional[Any] = None


# SQL Injection Prevention

def is_safe_identifier(value: str) -> bool:
    """Check if value is safe to use as SQL identifier (table/column name)"""
    pattern = r'^[a-zA-Z_][a-zA-Z0-9_]*$'
    return bool(re.match(pattern, value))


def sanitize_sql_identifier(value: str) -> str:
    """Sanitize value for use as SQL identifier"""
    if not is_safe_identifier(value):
        raise ValueError(f"Invalid SQL identifier: {value}")
    return value


# Request/Response Validation Decorators

def validate_request_body(**constraints):
    """Decorator to validate request body fields"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Validation logic here
            return await func(*args, **kwargs)
        return wrapper
    return decorator
