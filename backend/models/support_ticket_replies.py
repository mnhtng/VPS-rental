import uuid
from datetime import datetime, timezone
from typing import Dict, Optional, TYPE_CHECKING
from pydantic import ConfigDict
from sqlmodel import (
    SQLModel,
    Field,
    Relationship,
    Column,
)
from sqlalchemy.dialects.postgresql import JSONB

if TYPE_CHECKING:
    from .support_tickets import SupportTicket


class SupportTicketReply(SQLModel, table=True):
    """
    SupportTicketReply model for storing support ticket reply details.

    Attributes:
        id: Unique identifier for the support ticket reply.
        ticket_id: Identifier for the associated support ticket.
        message: Reply message in JSONB format.
            VD: message: {
                "content": {
                    "text": "Chào bạn, gói VPS đã được kích hoạt.",
                    "format": "markdown" (html/markdown/plain)
                },
                "sender": {
                    "role": "admin", (user/admin)
                    "id": "admin_01J8RZ3",
                    "name": "Nguyen Van A"
                },
                "attachments": [
                    {
                    "id": "att_01J8RZ3",
                    "name": "invoice.pdf",
                    "url": "https://cdn.ptitcloud.io/invoice.pdf",
                    "size": 245781,
                    "mime": "application/pdf"
                    }
                ],
            }
        created_at: Timestamp when the reply was created.
        updated_at: Timestamp when the reply was last updated.

        support_ticket: Relationship to the SupportTicket model (1-to-N).
    """

    __tablename__ = "support_ticket_replies"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False,
    )
    ticket_id: uuid.UUID = Field(
        index=True,
        foreign_key="support_tickets.id",
        ondelete="CASCADE",
    )
    message: Dict = Field(
        sa_column=Column(JSONB),
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

    support_ticket: Optional["SupportTicket"] = Relationship(
        back_populates="replies",
        sa_relationship_kwargs={"lazy": "select"},
    )

    def __repr__(self) -> str:
        """Representation the SupportTicketReply instance as a string"""
        return (
            f"SupportTicketReply(id={self.id}, "
            f"ticket_id={self.ticket_id}, "
            f"created_at={self.created_at}, "
            f"updated_at={self.updated_at})"
        )

    def to_dict(self) -> dict:
        """Convert model instance to a dictionary"""
        return {
            "id": str(self.id),
            "ticket_id": str(self.ticket_id),
            "message": self.message,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __eq__(self, other: object) -> bool:
        """Check equality between two SupportTicketReply instances"""
        if isinstance(other, SupportTicketReply):
            return self.id == other.id
        return False

    model_config = ConfigDict(from_attributes=True)
