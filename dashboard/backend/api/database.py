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
    """Create all tables (idempotent) and seed initial tickets."""
    from backend.api.models import Base, SupportTicket

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed open questions and action items (skip any that already exist by message)
    seed_tickets = [
        # Open questions
        {"ticket_type": "question", "submitted_by": "Annora", "status": "open",
            "message": "[Open Question] Are the metrics in this analysis the right targets? Which matter most?"},
        {"ticket_type": "question", "submitted_by": "Annora", "status": "open",
            "message": "[Open Question] What's the primary forecasting use case — procurement (buying resin) or capacity (scheduling machines)?"},
        {"ticket_type": "question", "submitted_by": "Annora", "status": "open",
            "message": "[Open Question] Does DPC have raw material cost adjustment clauses? (The 15% Hanwha tariff matters)"},
        {"ticket_type": "question", "submitted_by": "Annora", "status": "open",
            "message": '[Open Question] Which finished goods are the "vital few"? (~20% of parts drive ~80% of revenue)'},
        {"ticket_type": "question", "submitted_by": "Annora", "status": "open",
            "message": '[Open Question] What does "inverted" mean in your four-algorithm framework? (Standard is smooth/erratic/intermittent/lumpy)'},
        # Action items from Wednesday meeting
        {"ticket_type": "other", "submitted_by": "Patrick", "status": "in_progress",
            "message": "[Action Item] Host the application and set up user accounts"},
        {"ticket_type": "other", "submitted_by": "Patrick", "status": "in_progress",
            "message": "[Action Item] Send the application access link"},
        {"ticket_type": "other", "submitted_by": "Patrick", "status": "in_progress",
            "message": "[Action Item] Integrate the feedback system into the app"},
        {"ticket_type": "other", "submitted_by": "Tiffany", "status": "open",
            "message": "[Action Item] Provide the AS400 hardware model and version number"},
        {"ticket_type": "other", "submitted_by": "Tiffany & Frank", "status": "open",
            "message": "[Action Item] Review the app and provide feedback"},
    ]

    async with async_session() as session:
        from sqlalchemy import select

        for ticket_data in seed_tickets:
            exists = (await session.execute(
                select(SupportTicket.id).where(SupportTicket.message == ticket_data["message"])
            )).scalar()
            if not exists:
                session.add(SupportTicket(**ticket_data))
        await session.commit()
