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

    # Seed open questions and action items as tickets (only if DB is empty)
    async with async_session() as session:
        from sqlalchemy import select, func

        count = (await session.execute(select(func.count(SupportTicket.id)))).scalar() or 0
        if count == 0:
            seed_tickets = [
                # Open questions
                SupportTicket(ticket_type="question", submitted_by="Annora", status="open",
                    message="Are the metrics in this analysis the right targets? Which matter most?"),
                SupportTicket(ticket_type="question", submitted_by="Annora", status="open",
                    message="What's the primary forecasting use case — procurement (buying resin) or capacity (scheduling machines)?"),
                SupportTicket(ticket_type="question", submitted_by="Annora", status="open",
                    message="Does DPC have raw material cost adjustment clauses? (The 15% Hanwha tariff matters)"),
                SupportTicket(ticket_type="question", submitted_by="Annora", status="open",
                    message='Which finished goods are the "vital few"? (~20% of parts drive ~80% of revenue)'),
                SupportTicket(ticket_type="question", submitted_by="Annora", status="open",
                    message="What exactly does the 0.2% number measure? (Annual revenue? Monthly product family?)"),
                SupportTicket(ticket_type="question", submitted_by="Annora", status="open",
                    message="Is the YFAI relationship stable? Which programs flow through consolidating plants?"),
                SupportTicket(ticket_type="question", submitted_by="Annora", status="open",
                    message="What's the status of the Slate Automotive opportunity?"),
                SupportTicket(ticket_type="question", submitted_by="Annora", status="open",
                    message='What does "inverted" mean in your four-algorithm framework? (Standard is smooth/erratic/intermittent/lumpy)'),
                # Action items from Wednesday meeting
                SupportTicket(ticket_type="other", submitted_by="Patrick", status="in_progress",
                    message="[Action Item] Host the application and set up user accounts"),
                SupportTicket(ticket_type="other", submitted_by="Patrick", status="in_progress",
                    message="[Action Item] Send the application access link"),
                SupportTicket(ticket_type="other", submitted_by="Patrick", status="in_progress",
                    message="[Action Item] Integrate the feedback system into the app"),
                SupportTicket(ticket_type="other", submitted_by="Tiffany", status="open",
                    message="[Action Item] Provide the AS400 hardware model and version number"),
                SupportTicket(ticket_type="other", submitted_by="Tiffany & Frank", status="open",
                    message="[Action Item] Review the app and provide feedback"),
            ]
            session.add_all(seed_tickets)
            await session.commit()
