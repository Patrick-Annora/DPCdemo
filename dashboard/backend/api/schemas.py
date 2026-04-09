from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class TicketType(str, Enum):
    BUG = "bug"
    IMPROVEMENT = "improvement"
    QUESTION = "question"
    OTHER = "other"


class TicketStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TicketCreate(BaseModel):
    """Request schema for creating a support ticket."""

    ticket_type: TicketType
    message: str
    submitted_by: str
    tagged_email: Optional[str] = None
    page_url: Optional[str] = None
    browser_info: Optional[str] = None


class TicketResponse(BaseModel):
    """Response schema for a support ticket."""

    id: int
    ticket_type: TicketType
    message: str
    submitted_by: str
    tagged_email: Optional[str] = None
    page_url: Optional[str] = None
    browser_info: Optional[str] = None
    status: TicketStatus
    created_at: datetime
    updated_at: datetime
    screenshot_url: Optional[str] = None
    attachment_url: Optional[str] = None

    model_config = {"from_attributes": True}


# Alias for route compatibility
TicketOut = TicketResponse


class TicketListResponse(BaseModel):
    """Paginated list of tickets."""

    tickets: list[TicketResponse]
    total: int
    limit: int
    offset: int


# Alias for route compatibility
TicketList = TicketListResponse


class TicketStatusUpdate(BaseModel):
    """Request body for updating ticket status."""

    status: TicketStatus = Field(..., description="New status for the ticket")


class CommentCreate(BaseModel):
    """Request body for adding a comment to a ticket."""

    text: str = Field(..., min_length=1, max_length=5000)


class CommentResponse(BaseModel):
    """Response schema for a ticket comment."""

    id: int
    ticket_id: int
    text: str
    created_at: datetime

    model_config = {"from_attributes": True}
