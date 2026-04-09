from __future__ import annotations

import os

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:////data/support.db")

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_session() -> AsyncSession:  # type: ignore[misc]
    """FastAPI dependency -- yields an async SQLAlchemy session."""
    async with async_session() as session:
        yield session


# Alias for FastAPI Depends() usage
get_db = get_session


async def create_tables() -> None:
    """Create all tables (idempotent)."""
    from backend.api.models import Base

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
