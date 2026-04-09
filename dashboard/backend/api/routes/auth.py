from __future__ import annotations

import os
import secrets
import time
from typing import Dict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import select

from backend.api.database import async_session
from backend.api.models import AuthToken

router = APIRouter()

TOKEN_TTL = 60 * 60 * 24 * 7  # 7 days


def _get_password() -> str:
    pw = os.getenv("DEMO_PASSWORD")
    if not pw:
        raise RuntimeError("DEMO_PASSWORD environment variable must be set")
    return pw


async def create_token() -> str:
    """Create a new auth token and persist it to the database."""
    token = secrets.token_urlsafe(32)
    expires_at = time.time() + TOKEN_TTL
    async with async_session() as session:
        session.add(AuthToken(token=token, expires_at=expires_at))
        await session.commit()
    return token


async def validate_token(token: str) -> bool:
    """Check if a token is valid and not expired."""
    async with async_session() as session:
        row = await session.get(AuthToken, token)
        if row is None:
            return False
        if time.time() > row.expires_at:
            await session.delete(row)
            await session.commit()
            return False
        return True


class LoginRequest(BaseModel):
    password: str


class LoginResponse(BaseModel):
    token: str


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest) -> LoginResponse:
    """Validate the demo password and return a session token."""
    expected = _get_password()
    # Constant-time comparison
    if not secrets.compare_digest(body.password, expected):
        raise HTTPException(status_code=401, detail="Invalid password")
    token = await create_token()
    return LoginResponse(token=token)


@router.post("/verify")
async def verify_token_endpoint(token: str = "") -> Dict[str, bool]:
    """Check if a token is still valid."""
    return {"valid": await validate_token(token)}
