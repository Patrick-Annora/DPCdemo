from __future__ import annotations

from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator
from pathlib import Path
from typing import Dict
import os

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from backend.api.database import create_tables
from backend.api.routes.auth import router as auth_router, validate_token
from backend.api.routes.support import router as support_router

# Environment
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "/data/uploads"))
STATIC_DIR = Path(os.getenv("STATIC_DIR", "static"))

# Prefixes that don't require auth
PUBLIC_PREFIXES = ("/api/health", "/api/auth/")


class AuthMiddleware(BaseHTTPMiddleware):
    """Require a valid token for all /api/* routes except public ones."""

    async def dispatch(self, request: Request, call_next):  # type: ignore[override]
        path = request.url.path
        # Only gate /api/* routes (not static files)
        if path.startswith("/api/") and not any(path.startswith(p) for p in PUBLIC_PREFIXES):
            token = request.headers.get("Authorization", "").removeprefix("Bearer ").strip()
            if not token or not await validate_token(token):
                return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
        return await call_next(request)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    """Create database tables and upload directory on startup."""
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    await create_tables()
    yield


app = FastAPI(
    title="DPC Dashboard API",
    version="1.0.0",
    lifespan=lifespan,
)

# 1. CORS middleware -- must be added before auth middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Auth middleware -- must be added after CORS
app.add_middleware(AuthMiddleware)


# Health check
@app.get("/api/health")
async def health_check() -> Dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}


# 3. API routes
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(support_router, prefix="/api/support", tags=["support"])

# 5. Serve uploaded files at /api/support/uploads/{filename}
# Ensure upload dir exists at module level so the mount is registered
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount(
    "/api/support/uploads",
    StaticFiles(directory=str(UPLOAD_DIR)),
    name="uploads",
)

# 6. Serve SPA build -- MUST be last (catches all non-API routes for SPA routing)
if STATIC_DIR.exists():
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")
