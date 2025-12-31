from datetime import datetime, timezone
import logging
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy.orm import selectinload
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
from backend.utils import get_current_user, get_admin_user, Translator, get_translator


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
    translator: Translator = Depends(get_translator),
):
    """
    Get all tickets for the current user.

    Args:
        status_filter: Filter by status
        priority_filter: Filter by priority
        session: Database session
        current_user: The authenticated user
        translator: Translator for i18n messages

    Raises:
        HTTPException: 401 if not authenticated
        HTTPException: 500 if fetching tickets fails

    Returns:
        List of tickets
    """
    try:
        statement = (
            select(SupportTicket)
            .where(SupportTicket.user_id == current_user.id)
            .options(
                selectinload(SupportTicket.replies),
            )
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
            detail=translator.t("errors.internal_server"),
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
    translator: Translator = Depends(get_translator),
):
    """
    Get ticket statistics for the current user.

    Args:
        session: Database session
        current_user: The authenticated user
        translator: Translator for i18n messages

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
            detail=translator.t("errors.internal_server"),
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
    translator: Translator = Depends(get_translator),
):
    """
    Create a new support ticket.

    Args:
        ticket_data: The ticket creation data
        session: Database session
        current_user: The authenticated user
        translator: Translator for i18n messages

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
            detail=translator.t("errors.internal_server"),
        )


@router.put(
    "/tickets/{ticket_id}",
    response_model=SupportTicketResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a ticket",
    description="Update an existing support ticket",
)
async def update_ticket(
    ticket_data: SupportTicketUpdate,
    ticket_id: uuid.UUID = Path(..., description="The ticket UUID"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    translator: Translator = Depends(get_translator),
):
    """
    Update an existing ticket.

    Args:
        ticket_id: The ticket UUID
        ticket_data: The update data
        session: Database session
        current_user: The authenticated user
        translator: Translator for i18n messages

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
                detail=translator.t("support.ticket_not_found"),
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
            detail=translator.t("errors.internal_server"),
        )


@router.post(
    "/tickets/{ticket_id}/replies",
    response_model=SupportTicketResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add reply to ticket",
    description="Add a reply to an existing support ticket",
)
async def add_reply_to_ticket(
    reply_data: AddReplyRequest,
    ticket_id: uuid.UUID = Path(..., description="The ticket UUID"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    translator: Translator = Depends(get_translator),
):
    """
    Add a reply to an existing ticket.

    Args:
        ticket_id: The ticket UUID
        reply_data: The reply data
        session: Database session
        current_user: The authenticated user
        translator: Translator for i18n messages

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
                detail=translator.t("support.ticket_not_found"),
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
            detail=translator.t("errors.internal_server"),
        )


# ========================================================================
# Admin Routes
# ========================================================================


@router.get(
    "/admin/tickets",
    response_model=List[SupportTicketResponse],
    status_code=status.HTTP_200_OK,
    summary="[Admin] Get all tickets",
    description="Get all support tickets from all users (admin only)",
)
async def admin_get_all_tickets(
    status_filter: Optional[str] = Query(None, alias="status"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_admin_user),
    translator: Translator = Depends(get_translator),
):
    """
    Get all tickets for admin management.

    Args:
        status_filter: Filter by status
        priority_filter: Filter by priority
        session: Database session
        admin_user: The authenticated admin user
        translator: Translator for i18n messages

    Raises:
        HTTPException: 401 if not authenticated
        HTTPException: 403 if not admin
        HTTPException: 500 if fetching tickets fails

    Returns:
        List of all tickets
    """
    try:
        statement = (
            select(SupportTicket)
            .options(
                selectinload(SupportTicket.user),
                selectinload(SupportTicket.replies),
            )
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
        logger.error(f">>> Error fetching all tickets: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=translator.t("errors.internal_server"),
        )


@router.get(
    "/admin/tickets/statistics",
    response_model=TicketStatisticsResponse,
    status_code=status.HTTP_200_OK,
    summary="[Admin] Get all ticket statistics",
    description="Get ticket statistics for all users (admin only)",
)
async def admin_get_ticket_statistics(
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_admin_user),
    translator: Translator = Depends(get_translator),
):
    """
    Get ticket statistics for all tickets (admin only).

    Args:
        session: Database session
        admin_user: The authenticated admin user
        translator: Translator for i18n messages

    Raises:
        HTTPException: 401 if not authenticated
        HTTPException: 403 if not admin
        HTTPException: 500 if fetching statistics fails

    Returns:
        Ticket statistics
    """
    try:
        statement = select(SupportTicket)
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
            detail=translator.t("errors.internal_server"),
        )


@router.put(
    "/admin/tickets/{ticket_id}/status",
    response_model=SupportTicketResponse,
    status_code=status.HTTP_200_OK,
    summary="[Admin] Update ticket status",
    description="Update the status of any ticket (admin only)",
)
async def admin_update_ticket_status(
    status_data: UpdateTicketStatusRequest,
    ticket_id: uuid.UUID = Path(..., description="The ticket UUID"),
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_admin_user),
    translator: Translator = Depends(get_translator),
):
    """
    Update ticket status (admin only).

    Args:
        ticket_id: The ticket UUID
        status_data: The new status
        session: Database session
        admin_user: The authenticated admin user
        translator: Translator for i18n messages

    Returns:
        The updated ticket
    """
    try:
        ticket = session.get(SupportTicket, ticket_id)

        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=translator.t("support.ticket_not_found"),
            )

        ticket.status = status_data.status
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
            detail=translator.t("errors.internal_server"),
        )


@router.post(
    "/admin/tickets/{ticket_id}/replies",
    response_model=SupportTicketResponse,
    status_code=status.HTTP_201_CREATED,
    summary="[Admin] Add reply to ticket",
    description="Add an admin reply to any support ticket",
)
async def admin_add_reply_to_ticket(
    reply_data: AddReplyRequest,
    ticket_id: uuid.UUID = Path(..., description="The ticket UUID"),
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_admin_user),
    translator: Translator = Depends(get_translator),
):
    """
    Add an admin reply to any ticket.

    Args:
        ticket_id: The ticket UUID
        reply_data: The reply data
        session: Database session
        admin_user: The authenticated admin user
        translator: Translator for i18n messages

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
                detail=translator.t("support.ticket_not_found"),
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
            detail=translator.t("errors.internal_server"),
        )
