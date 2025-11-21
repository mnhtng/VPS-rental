# from fastapi import APIRouter, Depends, HTTPException, status, Query
# from sqlmodel import Session, select
# from typing import List, Dict, Any
# from models.database import (
#     SupportTicket, SupportMessage, FAQ, User, get_session
# )
# from schemas.api import (
#     SupportTicketCreate, SupportTicketResponse,
#     SupportMessageCreate, SupportMessageResponse,
#     FAQResponse, FAQCreate
# )
# from core.auth import get_current_active_user, get_admin_user

# router = APIRouter(prefix="/api/support", tags=["Support"])

# # Support Tickets
# @router.post("/tickets", response_model=SupportTicketResponse)
# async def create_support_ticket(
#     ticket_data: SupportTicketCreate,
#     current_user: User = Depends(get_current_active_user),
#     session: Session = Depends(get_session)
# ):
#     """Create a new support ticket"""
#     ticket = SupportTicket(
#         user_id=current_user.id,
#         subject=ticket_data.subject,
#         description=ticket_data.description,
#         category=ticket_data.category,
#         priority=ticket_data.priority
#     )

#     session.add(ticket)
#     session.commit()
#     session.refresh(ticket)

#     return get_ticket_with_messages(ticket.id, session)

# @router.get("/tickets", response_model=List[SupportTicketResponse])
# async def get_user_tickets(
#     current_user: User = Depends(get_current_active_user),
#     session: Session = Depends(get_session),
#     skip: int = Query(0, ge=0),
#     limit: int = Query(50, ge=1, le=100)
# ):
#     """Get current user's support tickets"""
#     statement = (
#         select(SupportTicket)
#         .where(SupportTicket.user_id == current_user.id)
#         .order_by(SupportTicket.created_at.desc())
#         .offset(skip)
#         .limit(limit)
#     )
#     tickets = session.exec(statement).all()

#     return [get_ticket_with_messages(ticket.id, session) for ticket in tickets]

# @router.get("/tickets/{ticket_id}", response_model=SupportTicketResponse)
# async def get_support_ticket(
#     ticket_id: int,
#     current_user: User = Depends(get_current_active_user),
#     session: Session = Depends(get_session)
# ):
#     """Get a specific support ticket"""
#     ticket = session.get(SupportTicket, ticket_id)
#     if not ticket:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Support ticket not found"
#         )

#     # Check ticket ownership or admin
#     if ticket.user_id != current_user.id and current_user.role != "admin":
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Not authorized to view this ticket"
#         )

#     return get_ticket_with_messages(ticket_id, session)

# @router.post("/tickets/{ticket_id}/messages", response_model=SupportMessageResponse)
# async def add_ticket_message(
#     ticket_id: int,
#     message_data: SupportMessageCreate,
#     current_user: User = Depends(get_current_active_user),
#     session: Session = Depends(get_session)
# ):
#     """Add a message to a support ticket"""
#     ticket = session.get(SupportTicket, ticket_id)
#     if not ticket:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Support ticket not found"
#         )

#     # Check ticket ownership or admin
#     if ticket.user_id != current_user.id and current_user.role != "admin":
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Not authorized to add messages to this ticket"
#         )

#     message = SupportMessage(
#         ticket_id=ticket_id,
#         sender_id=current_user.id,
#         message=message_data.message,
#         is_staff_reply=(current_user.role == "admin")
#     )

#     session.add(message)

#     # Update ticket status if it was resolved and user is replying
#     if ticket.status == "resolved" and current_user.role != "admin":
#         ticket.status = "open"
#         session.add(ticket)

#     session.commit()
#     session.refresh(message)

#     return message

# @router.put("/tickets/{ticket_id}/close")
# async def close_ticket(
#     ticket_id: int,
#     current_user: User = Depends(get_current_active_user),
#     session: Session = Depends(get_session)
# ):
#     """Close a support ticket"""
#     ticket = session.get(SupportTicket, ticket_id)
#     if not ticket:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Support ticket not found"
#         )

#     # Check ticket ownership or admin
#     if ticket.user_id != current_user.id and current_user.role != "admin":
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Not authorized to close this ticket"
#         )

#     ticket.status = "closed"
#     session.add(ticket)
#     session.commit()

#     return {"message": "Ticket closed successfully"}

# # Admin ticket management
# @router.get("/admin/tickets", response_model=List[SupportTicketResponse])
# async def get_all_tickets(
#     admin_user: User = Depends(get_admin_user),
#     session: Session = Depends(get_session),
#     status: str = Query(None),
#     priority: str = Query(None),
#     category: str = Query(None),
#     skip: int = Query(0, ge=0),
#     limit: int = Query(50, ge=1, le=100)
# ):
#     """Get all support tickets (Admin only)"""
#     statement = select(SupportTicket).order_by(SupportTicket.created_at.desc())

#     if status:
#         statement = statement.where(SupportTicket.status == status)
#     if priority:
#         statement = statement.where(SupportTicket.priority == priority)
#     if category:
#         statement = statement.where(SupportTicket.category == category)

#     statement = statement.offset(skip).limit(limit)
#     tickets = session.exec(statement).all()

#     return [get_ticket_with_messages(ticket.id, session) for ticket in tickets]

# @router.put("/admin/tickets/{ticket_id}/status")
# async def update_ticket_status(
#     ticket_id: int,
#     status: str,
#     admin_user: User = Depends(get_admin_user),
#     session: Session = Depends(get_session)
# ):
#     """Update ticket status (Admin only)"""
#     ticket = session.get(SupportTicket, ticket_id)
#     if not ticket:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Support ticket not found"
#         )

#     valid_statuses = ["open", "in_progress", "resolved", "closed"]
#     if status not in valid_statuses:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
#         )

#     ticket.status = status
#     session.add(ticket)
#     session.commit()

#     return {"message": "Ticket status updated successfully"}

# # FAQ Management
# @router.get("/faq", response_model=List[FAQResponse])
# async def get_faqs(
#     session: Session = Depends(get_session),
#     category: str = Query(None)
# ):
#     """Get all FAQs"""
#     statement = select(FAQ).where(FAQ.is_active == True).order_by(FAQ.order_index, FAQ.id)

#     if category:
#         statement = statement.where(FAQ.category == category)

#     faqs = session.exec(statement).all()
#     return faqs

# @router.post("/admin/faq", response_model=FAQResponse)
# async def create_faq(
#     faq_data: FAQCreate,
#     admin_user: User = Depends(get_admin_user),
#     session: Session = Depends(get_session)
# ):
#     """Create a new FAQ (Admin only)"""
#     faq = FAQ(**faq_data.model_dump())
#     session.add(faq)
#     session.commit()
#     session.refresh(faq)
#     return faq

# @router.put("/admin/faq/{faq_id}", response_model=FAQResponse)
# async def update_faq(
#     faq_id: int,
#     faq_data: FAQCreate,
#     admin_user: User = Depends(get_admin_user),
#     session: Session = Depends(get_session)
# ):
#     """Update an FAQ (Admin only)"""
#     faq = session.get(FAQ, faq_id)
#     if not faq:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="FAQ not found"
#         )

#     update_data = faq_data.model_dump()
#     for field, value in update_data.items():
#         setattr(faq, field, value)

#     session.add(faq)
#     session.commit()
#     session.refresh(faq)
#     return faq

# @router.delete("/admin/faq/{faq_id}")
# async def delete_faq(
#     faq_id: int,
#     admin_user: User = Depends(get_admin_user),
#     session: Session = Depends(get_session)
# ):
#     """Delete an FAQ (Admin only)"""
#     faq = session.get(FAQ, faq_id)
#     if not faq:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="FAQ not found"
#         )

#     session.delete(faq)
#     session.commit()
#     return {"message": "FAQ deleted successfully"}

# # Chatbot endpoint
# @router.post("/chatbot")
# async def chatbot_query(
#     query: str,
#     session: Session = Depends(get_session)
# ):
#     """Simple chatbot for answering VPS-related questions"""
#     query_lower = query.lower()

#     # Simple rule-based responses
#     responses = {
#         "pricing": "Our VPS plans start from $5/month for 1 CPU, 1GB RAM, and 20GB SSD storage. Visit our plans page for detailed pricing.",
#         "specs": "We offer VPS with 1-16 CPU cores, 1-64GB RAM, SSD/NVMe storage from 20GB-1TB, and flexible bandwidth options.",
#         "payment": "We accept payments via QR code bank transfer, MoMo wallet, and VNPay. All payments are secure and processed instantly.",
#         "support": "Our support team is available 24/7. You can create a support ticket or chat with us for immediate assistance.",
#         "setup": "VPS setup is automated and typically takes 5-10 minutes after payment confirmation. You'll receive login details via email.",
#         "refund": "We offer a 30-day money-back guarantee for all new customers. Contact support for refund requests.",
#         "uptime": "We guarantee 99.9% uptime with our enterprise-grade infrastructure and 24/7 monitoring.",
#         "backup": "Daily automated backups are included with all plans. You can also create manual backups anytime.",
#         "scaling": "You can upgrade your VPS resources anytime through your control panel. Scaling is instant with zero downtime.",
#         "security": "All VPS include DDoS protection, firewall configuration, and SSL certificates. We also provide security monitoring."
#     }

#     # Find matching response
#     for keyword, response in responses.items():
#         if keyword in query_lower:
#             return {"response": response}

#     # Default response
#     return {
#         "response": "I'm here to help with VPS-related questions. You can ask about pricing, specifications, payment methods, setup process, or technical support. For complex queries, please create a support ticket."
#     }

# def get_ticket_with_messages(ticket_id: int, session: Session) -> SupportTicketResponse:
#     """Helper function to get ticket with all messages"""
#     ticket = session.get(SupportTicket, ticket_id)
#     if not ticket:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Support ticket not found"
#         )

#     # Get messages
#     statement = select(SupportMessage).where(SupportMessage.ticket_id == ticket_id).order_by(SupportMessage.created_at)
#     messages = session.exec(statement).all()

#     return SupportTicketResponse(
#         id=ticket.id,
#         subject=ticket.subject,
#         description=ticket.description,
#         status=ticket.status,
#         priority=ticket.priority,
#         category=ticket.category,
#         created_at=ticket.created_at,
#         updated_at=ticket.updated_at,
#         messages=[SupportMessageResponse(
#             id=msg.id,
#             message=msg.message,
#             is_staff_reply=msg.is_staff_reply,
#             created_at=msg.created_at
#         ) for msg in messages]
#     )
