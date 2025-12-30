import uuid
from datetime import datetime, timezone
from typing import List, Optional, TYPE_CHECKING
from pydantic import ConfigDict
from sqlmodel import (
    SQLModel,
    Field,
    Relationship,
    CheckConstraint,
)

if TYPE_CHECKING:
    from .users import User
    from .support_ticket_replies import SupportTicketReply


class SupportTicket(SQLModel, table=True):
    """
    SupportTicket model for storing support ticket details.

    Attributes:
        id: Unique identifier for the support ticket.
        user_id: Identifier for the user who created the ticket.
        subject: Subject of the support ticket.
        description: Detailed description of the issue.
        category: Category of the support ticket (e.g., technical_support, payment, server_issue, performance, security, other).
        priority: Priority level of the ticket (e.g., low, medium, high, urgent).
        status: Current status of the ticket (e.g., open, in_progress, resolved, closed).
        email: Email address of the user.
        phone: Phone number of the user.
        created_at: Timestamp when the ticket was created.
        updated_at: Timestamp when the ticket was last updated.

        user: Relationship to the User model (1-to-N).
        replies: Relationship to the SupportTicketReply model (1-to-N).
    """

    __tablename__ = "support_tickets"
    __table_args__ = (
        CheckConstraint(
            "status IN ('open', 'in_progress', 'resolved', 'closed')",
            name="support_tickets_status_check",
        ),
        CheckConstraint(
            "priority IN ('low', 'medium', 'high', 'urgent')",
            name="support_tickets_priority_check",
        ),
        CheckConstraint(
            "category IN ('technical_support', 'payment', 'server_issue', 'performance', 'security', 'other')",
            name="support_tickets_category_check",
        ),
    )

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False,
    )
    user_id: uuid.UUID = Field(
        index=True,
        foreign_key="users.id",
        ondelete="CASCADE",
    )
    subject: str = Field(
        nullable=False,
        max_length=255,
    )
    description: str = Field(
        nullable=False,
    )
    category: str = Field(
        nullable=False,
        max_length=100,
    )
    priority: str = Field(
        default="low",
        nullable=False,
        max_length=20,
    )
    status: str = Field(
        default="open",
        nullable=False,
        max_length=20,
    )
    email: str = Field(
        nullable=False,
    )
    phone: str = Field(
        nullable=False,
        max_length=20,
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
        sa_column_kwargs={
            "onupdate": lambda: datetime.now(timezone.utc),
        },
    )

    user: Optional["User"] = Relationship(
        back_populates="support_tickets",
        sa_relationship_kwargs={"lazy": "select"},
    )
    replies: List["SupportTicketReply"] = Relationship(
        back_populates="support_ticket",
        passive_deletes="all",
        sa_relationship_kwargs={"lazy": "select"},
    )

    def __repr__(self) -> str:
        """Representation the SupportTicket instance as a string"""
        return (
            f"SupportTicket(id={self.id}, user_id={self.user_id}, "
            f"subject={self.subject}, status={self.status}, "
            f"created_at={self.created_at}, updated_at={self.updated_at})"
        )

    def to_dict(self) -> dict:
        """Convert model instance to a dictionary"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "subject": self.subject,
            "description": self.description,
            "category": self.category,
            "priority": self.priority,
            "status": self.status,
            "email": self.email,
            "phone": self.phone,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __eq__(self, other: object) -> bool:
        """Check equality between two SupportTicket instances"""
        if isinstance(other, SupportTicket):
            return self.id == other.id
        return False

    model_config = ConfigDict(from_attributes=True)
