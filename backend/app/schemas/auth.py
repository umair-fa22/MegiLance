# @AI-HINT: Pydantic schemas for authentication - tokens, login, registration requests/responses
from typing import Optional

from pydantic import BaseModel, EmailStr, Field

from app.schemas.user import UserRead


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class RefreshTokenRequest(BaseModel):
    refresh_token: Optional[str] = Field(default=None, min_length=10)
    # refresh_token can come from request body OR httpOnly cookie


class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
    type: Optional[str] = None
    iat: Optional[int] = None
    nbf: Optional[int] = None
    jti: Optional[str] = None


class AuthResponse(Token):
    user: UserRead
    message: Optional[str] = None
