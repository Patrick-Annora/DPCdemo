from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.database import get_session
from backend.api.models import SupportTicket, TicketComment
from backend.api.schemas import (
    CommentCreate,
    CommentResponse,
    TicketList,
    TicketOut,
    TicketStatus,
    TicketStatusUpdate,
    TicketType,
)

router = APIRouter()

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "/data/uploads"))
MAX_UPLOAD_SIZE = int(os.getenv("MAX_UPLOAD_SIZE", "10485760"))  # 10 MB

ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".pdf", ".txt", ".csv"}


def _build_ticket_out(ticket: SupportTicket) -> TicketOut:
    """Convert a SupportTicket ORM instance to a TicketOut response."""
    return TicketOut(
        id=ticket.id,
        ticket_type=TicketType(ticket.ticket_type),
        message=ticket.message,
        submitted_by=ticket.submitted_by,
        tagged_email=ticket.tagged_email,
        page_url=ticket.page_url,
        browser_info=ticket.browser_info,
        status=TicketStatus(ticket.status),
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
        screenshot_url=(
            f"/api/support/uploads/{ticket.screenshot_path}"
            if ticket.screenshot_path
            else None
        ),
        attachment_url=(
            f"/api/support/uploads/{ticket.attachment_path}"
            if ticket.attachment_path
            else None
        ),
    )


async def _save_upload(file: UploadFile, ticket_id: int, prefix: str) -> str:
    """Save an uploaded file to disk. Returns the filename (not full path)."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Upload has no filename")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    # Read file content and check size
    content = await file.read()
    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({len(content)} bytes). Maximum: {MAX_UPLOAD_SIZE} bytes",
        )

    # Generate a unique filename: {ticket_id}_{prefix}_{uuid_8chars}.{ext}
    safe_name = f"{ticket_id}_{prefix}_{uuid.uuid4().hex[:8]}{ext}"
    dest = UPLOAD_DIR / safe_name
    dest.write_bytes(content)

    return safe_name


# -- POST /api/support --


@router.post("", response_model=TicketOut, status_code=201)
async def create_ticket(
    ticket_type: TicketType = Form(...),
    message: str = Form(..., min_length=1, max_length=5000),
    submitted_by: str = Form(..., min_length=1, max_length=255),
    tagged_email: Optional[str] = Form(None),
    page_url: Optional[str] = Form(None),
    browser_info: Optional[str] = Form(None),
    screenshot: Optional[UploadFile] = File(None),
    attachment: Optional[UploadFile] = File(None),
    session: AsyncSession = Depends(get_session),
) -> TicketOut:
    """Create a new support ticket with optional file uploads."""
    # Create the ticket record (without file paths initially)
    ticket = SupportTicket(
        ticket_type=ticket_type.value,
        message=message,
        submitted_by=submitted_by,
        tagged_email=tagged_email if tagged_email else None,
        page_url=page_url if page_url else None,
        browser_info=browser_info if browser_info else None,
        status="open",
    )
    session.add(ticket)
    await session.flush()  # Get the auto-generated ID

    # Save uploaded files (now that we have a ticket ID)
    if screenshot and screenshot.filename:
        ticket.screenshot_path = await _save_upload(screenshot, ticket.id, "screenshot")

    if attachment and attachment.filename:
        ticket.attachment_path = await _save_upload(attachment, ticket.id, "attachment")

    await session.commit()
    await session.refresh(ticket)

    return _build_ticket_out(ticket)


# -- GET /api/support --


@router.get("", response_model=TicketList)
async def list_tickets(
    ticket_type: Optional[TicketType] = None,
    status: Optional[TicketStatus] = None,
    limit: int = 50,
    offset: int = 0,
    session: AsyncSession = Depends(get_session),
) -> TicketList:
    """List all tickets with optional filters, sorted by created_at descending."""
    query = select(SupportTicket)
    count_query = select(func.count(SupportTicket.id))

    if ticket_type:
        query = query.where(SupportTicket.ticket_type == ticket_type.value)
        count_query = count_query.where(SupportTicket.ticket_type == ticket_type.value)

    if status:
        query = query.where(SupportTicket.status == status.value)
        count_query = count_query.where(SupportTicket.status == status.value)

    query = query.order_by(SupportTicket.created_at.desc()).limit(limit).offset(offset)

    result = await session.execute(query)
    tickets = list(result.scalars().all())

    total_result = await session.execute(count_query)
    total = total_result.scalar() or 0

    return TicketList(
        tickets=[_build_ticket_out(t) for t in tickets],
        total=total,
        limit=limit,
        offset=offset,
    )


# -- GET /api/support/{id} --


@router.get("/{ticket_id}", response_model=TicketOut)
async def get_ticket(
    ticket_id: int,
    session: AsyncSession = Depends(get_session),
) -> TicketOut:
    """Get a single ticket by ID."""
    result = await session.execute(
        select(SupportTicket).where(SupportTicket.id == ticket_id)
    )
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")

    return _build_ticket_out(ticket)


# -- PATCH /api/support/{id} --


@router.patch("/{ticket_id}", response_model=TicketOut)
async def update_ticket_status(
    ticket_id: int,
    body: TicketStatusUpdate,
    session: AsyncSession = Depends(get_session),
) -> TicketOut:
    """Update the status of an existing ticket."""
    result = await session.execute(
        select(SupportTicket).where(SupportTicket.id == ticket_id)
    )
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")

    ticket.status = body.status.value
    # Set updated_at explicitly since SQLite + aiosqlite may not trigger onupdate
    ticket.updated_at = datetime.now(timezone.utc)

    await session.commit()
    await session.refresh(ticket)

    return _build_ticket_out(ticket)


# -- POST /api/support/{id}/comments --


@router.post("/{ticket_id}/comments", response_model=CommentResponse, status_code=201)
async def add_comment(
    ticket_id: int,
    body: CommentCreate,
    session: AsyncSession = Depends(get_session),
) -> CommentResponse:
    """Add a comment to an existing ticket."""
    result = await session.execute(
        select(SupportTicket).where(SupportTicket.id == ticket_id)
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")

    comment = TicketComment(ticket_id=ticket_id, text=body.text)
    session.add(comment)

    # Bump ticket updated_at
    ticket.updated_at = datetime.now(timezone.utc)

    await session.commit()
    await session.refresh(comment)
    return CommentResponse.model_validate(comment)


# -- GET /api/support/{id}/comments --


@router.get("/{ticket_id}/comments", response_model=list[CommentResponse])
async def list_comments(
    ticket_id: int,
    session: AsyncSession = Depends(get_session),
) -> list[CommentResponse]:
    """List all comments for a ticket."""
    result = await session.execute(
        select(TicketComment)
        .where(TicketComment.ticket_id == ticket_id)
        .order_by(TicketComment.created_at.asc())
    )
    comments = list(result.scalars().all())
    return [CommentResponse.model_validate(c) for c in comments]
