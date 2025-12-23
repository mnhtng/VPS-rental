from datetime import datetime, timezone
import logging
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from backend.db import get_session
from backend.models import User, SupportTicket, SupportTicketReply
from backend.schemas import (
    SupportTicketUpdate,
    SupportTicketReplyResponse,
    CreateTicketRequest,
    AddReplyRequest,
    UpdateTicketStatusRequest,
    TicketStatisticsResponse,
    SupportTicketResponse,
)
from backend.utils import get_current_user, get_admin_user


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/support", tags=["Support"])


@router.get(
    "/tickets",
    response_model=List[SupportTicketResponse],
    status_code=status.HTTP_200_OK,
    summary="Get user's tickets",
    description="Get all support tickets for the authenticated user",
)
async def get_user_tickets(
    status_filter: Optional[str] = Query(None, alias="status"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get all tickets for the current user.

    Args:
        status_filter: Filter by status
        priority_filter: Filter by priority
        session: Database session
        current_user: The authenticated user

    Raises:
        HTTPException: 401 if not authenticated
        HTTPException: 500 if fetching tickets fails

    Returns:
        List of tickets
    """
    try:
        statement = select(SupportTicket).where(
            SupportTicket.user_id == current_user.id
        )

        if status_filter and status_filter != "all":
            statement = statement.where(SupportTicket.status == status_filter)
        if priority_filter and priority_filter != "all":
            statement = statement.where(SupportTicket.priority == priority_filter)

        statement = statement.order_by(SupportTicket.created_at.desc())

        tickets = session.exec(statement).all()

        return tickets
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Error fetching user tickets: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user tickets",
        )


@router.get(
    "/tickets/statistics",
    response_model=TicketStatisticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get ticket statistics",
    description="Get ticket statistics for the authenticated user",
)
async def get_ticket_statistics(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get ticket statistics for the current user.

    Args:
        session: Database session
        current_user: The authenticated user

    Raises:
        HTTPException: 401 if not authenticated
        HTTPException: 500 if fetching tickets fails

    Returns:
        Ticket statistics
    """
    try:
        statement = select(SupportTicket).where(
            SupportTicket.user_id == current_user.id
        )
        tickets = session.exec(statement).all()

        stats = {
            "total": len(tickets),
            "open": len([t for t in tickets if t.status == "open"]),
            "in_progress": len([t for t in tickets if t.status == "in_progress"]),
            "resolved": len([t for t in tickets if t.status == "resolved"]),
            "closed": len([t for t in tickets if t.status == "closed"]),
        }

        return stats
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Error fetching ticket statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve statistics",
        )


@router.post(
    "/tickets",
    response_model=SupportTicketResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new support ticket",
    description="Create a new support ticket for the authenticated user",
)
async def create_ticket(
    ticket_data: CreateTicketRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new support ticket.

    Args:
        ticket_data: The ticket creation data
        session: Database session
        current_user: The authenticated user

    Raises:
        HTTPException: 401 if not authenticated
        HTTPException: 500 if ticket creation fails

    Returns:
        The created ticket
    """
    try:
        ticket = SupportTicket(
            user_id=current_user.id,
            subject=ticket_data.subject,
            description=ticket_data.description,
            category=ticket_data.category,
            priority=ticket_data.priority,
            email=current_user.email,
            phone=ticket_data.phone,
        )

        session.add(ticket)
        session.commit()
        session.refresh(ticket)

        return ticket
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> Error creating support ticket: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create support ticket",
        )


@router.put(
    "/tickets/{ticket_id}",
    response_model=SupportTicketResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a ticket",
    description="Update an existing support ticket",
)
async def update_ticket(
    ticket_id: uuid.UUID,
    ticket_data: SupportTicketUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Update an existing ticket.

    Args:
        ticket_id: The ticket UUID
        ticket_data: The update data
        session: Database session
        current_user: The authenticated user

    Raises:
        HTTPException: 401 if not authenticated
        HTTPException: 404 if ticket not found
        HTTPException: 500 if ticket update fails

    Returns:
        The updated ticket
    """
    try:
        ticket = session.get(SupportTicket, ticket_id)

        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found",
            )

        update_data = ticket_data.model_dump(exclude_unset=True, exclude_none=True)
        for field, value in update_data.items():
            setattr(ticket, field, value)

        session.add(ticket)
        session.commit()
        session.refresh(ticket)

        return ticket
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> Error updating ticket {ticket_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update ticket",
        )


@router.post(
    "/tickets/{ticket_id}/replies",
    response_model=SupportTicketResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add reply to ticket",
    description="Add a reply to an existing support ticket",
)
async def add_reply_to_ticket(
    ticket_id: uuid.UUID,
    reply_data: AddReplyRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Add a reply to an existing ticket.

    Args:
        ticket_id: The ticket UUID
        reply_data: The reply data
        session: Database session
        current_user: The authenticated user

    Raises:
        HTTPException: 401 if not authenticated
        HTTPException: 404 if ticket not found
        HTTPException: 500 if adding reply fails

    Returns:
        The created reply
    """
    try:
        ticket = session.get(SupportTicket, ticket_id)

        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found",
            )

        reply = SupportTicketReply(
            ticket_id=ticket_id,
            message={
                "content": {
                    "text": reply_data.message,
                    "format": "markdown",
                },
                "sender": {
                    "role": current_user.role,
                    "id": str(current_user.id),
                    "name": current_user.name,
                },
                "attachments": [],
            },
        )

        session.add(reply)
        ticket.updated_at = datetime.now(timezone.utc)
        session.add(ticket)
        session.commit()
        session.refresh(reply)
        session.refresh(ticket)

        return ticket
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> Error adding reply to ticket {ticket_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add reply",
        )


# ========================================================================
# Admin Routes
# ========================================================================


@router.put(
    "/admin/tickets/{ticket_id}/status",
    response_model=SupportTicketResponse,
    status_code=status.HTTP_200_OK,
    summary="[Admin] Update ticket status",
    description="Update the status of any ticket (admin only)",
)
async def admin_update_ticket_status(
    ticket_id: uuid.UUID,
    status_data: UpdateTicketStatusRequest,
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_admin_user),
):
    """
    Update ticket status (admin only).

    Args:
        ticket_id: The ticket UUID
        status_data: The new status
        session: Database session
        admin_user: The authenticated admin user

    Returns:
        The updated ticket
    """
    try:
        ticket = session.get(SupportTicket, ticket_id)

        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found",
            )

        ticket.status = status_data.status
        ticket.updated_at = datetime.now(timezone.utc)
        session.add(ticket)
        session.commit()
        session.refresh(ticket)

        return ticket
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> Error updating ticket status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update ticket status",
        )


@router.post(
    "/admin/tickets/{ticket_id}/replies",
    response_model=SupportTicketReplyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Add reply to ticket",
    description="Add an admin reply to any support ticket",
)
async def admin_add_reply_to_ticket(
    ticket_id: uuid.UUID,
    reply_data: AddReplyRequest,
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_admin_user),
):
    """
    Add an admin reply to any ticket.

    Args:
        ticket_id: The ticket UUID
        reply_data: The reply data
        session: Database session
        admin_user: The authenticated admin user

    Raises:
        HTTPException: 401 if not authenticated
        HTTPException: 403 if not admin
        HTTPException: 404 if ticket not found
        HTTPException: 500 if adding reply fails

    Returns:
        The created reply
    """
    try:
        ticket = session.get(SupportTicket, ticket_id)

        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found",
            )

        reply = SupportTicketReply(
            ticket_id=ticket_id,
            message={
                "content": {
                    "text": reply_data.message,
                    "format": "markdown",
                },
                "sender": {
                    "role": admin_user.role,
                    "id": str(admin_user.id),
                    "name": admin_user.name,
                },
                "attachments": [],
            },
        )

        session.add(reply)
        ticket.updated_at = datetime.now(timezone.utc)
        session.add(ticket)
        session.commit()
        session.refresh(reply)

        return reply
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f">>> Error adding reply to ticket {ticket_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add reply",
        )
