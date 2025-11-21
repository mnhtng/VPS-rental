from __future__ import annotations
import uuid
import re
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from pydantic import (
    BaseModel,
    Field,
    ConfigDict,
    ValidationInfo,
    field_validator,
)
from enum import Enum

if TYPE_CHECKING:
    from .users import UserPublic
    from .support_ticket_replies import SupportTicketReplyPublic


class TicketStatus(str, Enum):
    """Ticket status choices"""

    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TicketPriority(str, Enum):
    """Ticket priority choices"""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TicketCategory(str, Enum):
    """Ticket category choices"""

    TECHNICAL_SUPPORT = "technical_support"
    PAYMENT = "payment"
    SERVER_ISSUE = "server_issue"
    PERFORMANCE = "performance"
    SECURITY = "security"
    OTHER = "other"


class SupportTicketBase(BaseModel):
    """Base schema for support tickets"""

    subject: str = Field(..., description="Ticket subject")
    description: str = Field(..., description="Detailed description")
    category: TicketCategory = Field(..., description="Ticket category")
    priority: TicketPriority = Field(
        default=TicketPriority.LOW, description="Priority level"
    )
    status: TicketStatus = Field(
        default=TicketStatus.OPEN, description="Current status of the ticket"
    )
    email: str = Field(..., description="Contact email")
    phone: str = Field(..., description="Contact phone")

    @field_validator("subject", "description")
    @classmethod
    def validate_subject(cls, v: str, info: ValidationInfo) -> str:
        field_name = info.field_name.replace("_", " ").capitalize()

        if not v:
            raise ValueError(f"{field_name} must not be empty")

        v = v.strip()
        if len(v) == 0:
            raise ValueError(f"{field_name} must be at least 5 characters long")
        if info.field_name == "subject" and len(v) > 255:
            raise ValueError(f"{field_name} must not exceed 255 characters")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not v:
            raise ValueError("Email must not be empty")

        v = v.strip()
        if len(v) == 0:
            raise ValueError("Email must not be empty")

        local_part = v.split("@")[0] if "@" in v else ""
        domain_part = v.split("@")[-1] if "@" in v else ""
        domain_part = domain_part.lower()
        v = local_part + "@" + domain_part

        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(email_pattern, v) or v.count("@") != 1:
            raise ValueError("Email is not in valid format")

        if len(local_part) < 1:
            raise ValueError("The part before @ must not be empty")
        if len(local_part) > 64:
            raise ValueError("The part before @ must not exceed 64 characters")
        if local_part.startswith(".") or local_part.endswith("."):
            raise ValueError("Email cannot start or end with a dot")
        if ".." in local_part:
            raise ValueError("Email cannot contain consecutive dots")

        if len(domain_part) < 3:
            raise ValueError("Email domain must be at least 3 characters")
        if len(domain_part) > 255:
            raise ValueError("Email domain must not exceed 255 characters")
        if "." not in domain_part:
            raise ValueError("Email domain must contain a dot")

        # Block temporary/disposable email providers
        blocked_domains = [
            "tempmail.com",
            "throwaway.email",
            "guerrillamail.com",
            "10minutemail.com",
            "mailinator.com",
            "yopmail.com",
            "temp-mail.org",
            "fakeinbox.com",
        ]

        if domain_part in blocked_domains:
            raise ValueError("Email domain is not allowed")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        if not v:
            raise ValueError("Phone number must not be empty")

        v = v.strip()
        if len(v) == 0:
            raise ValueError("Phone number must not be empty")

        phone_pattern = r"^[\d]+$"
        if not re.match(phone_pattern, v):
            raise ValueError("Invalid phone number format")
        if len(v) < 10:
            raise ValueError("Phone number must be at least 10 digits")
        if len(v) > 20:
            raise ValueError("Phone number must not exceed 20 digits")
        return v

    @field_validator("category", mode="before")
    @classmethod
    def validate_category(cls, v: str) -> str:
        if not v:
            raise ValueError("Ticket category must not be empty")

        v = str(v).strip().lower()
        if len(v) == 0:
            raise ValueError("Ticket category must not be empty")
        if len(v) > 100:
            raise ValueError("Ticket category must not exceed 100 characters")

        valid_categories = [item.value for item in TicketCategory]
        if v not in valid_categories:
            raise ValueError("Invalid ticket category")
        return v

    @field_validator("priority", mode="before")
    @classmethod
    def validate_priority(cls, v: str) -> str:
        if not v:
            raise ValueError("Ticket priority must not be empty")

        v = str(v).strip().lower()
        if len(v) == 0:
            raise ValueError("Ticket priority must not be empty")
        if len(v) > 20:
            raise ValueError("Ticket priority must not exceed 20 characters")

        valid_priorities = [item.value for item in TicketPriority]
        if v not in valid_priorities:
            raise ValueError("Invalid ticket priority")
        return v

    @field_validator("status", mode="before")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if not v:
            raise ValueError("Ticket status must not be empty")

        v = str(v).strip().lower()
        if len(v) == 0:
            raise ValueError("Ticket status must not be empty")
        if len(v) > 20:
            raise ValueError("Ticket status must not exceed 20 characters")

        valid_statuses = [item.value for item in TicketStatus]
        if v not in valid_statuses:
            raise ValueError("Invalid ticket status")
        return v


class SupportTicketCreate(SupportTicketBase):
    """Schema to create a new support ticket"""

    user_id: uuid.UUID = Field(..., description="User ID")


class SupportTicketUpdate(BaseModel):
    """Schema to update an existing support ticket"""

    subject: Optional[str] = Field(None, description="Ticket subject")
    description: Optional[str] = Field(None, description="Detailed description")
    category: Optional[TicketCategory] = Field(None, description="Ticket category")
    priority: Optional[TicketPriority] = Field(None, description="Priority level")
    status: Optional[TicketStatus] = Field(
        None, description="Current status of the ticket"
    )
    email: Optional[str] = Field(None, description="Contact email")
    phone: Optional[str] = Field(None, description="Contact phone")

    @field_validator("subject", "description")
    @classmethod
    def validate_subject(cls, v: Optional[str], info: ValidationInfo) -> Optional[str]:
        field_name = info.field_name.replace("_", " ").capitalize()

        if v is None:
            return v

        v = v.strip()
        if len(v) == 0:
            return None
        if info.field_name == "subject" and len(v) > 255:
            raise ValueError(f"{field_name} must not exceed 255 characters")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = v.strip()
        if len(v) == 0:
            return None

        local_part = v.split("@")[0] if "@" in v else ""
        domain_part = v.split("@")[-1] if "@" in v else ""
        domain_part = domain_part.lower()
        v = local_part + "@" + domain_part

        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(email_pattern, v) or v.count("@") != 1:
            raise ValueError("Email is not in valid format")

        if len(local_part) < 1:
            raise ValueError("The part before @ must not be empty")
        if len(local_part) > 64:
            raise ValueError("The part before @ must not exceed 64 characters")
        if local_part.startswith(".") or local_part.endswith("."):
            raise ValueError("Email cannot start or end with a dot")
        if ".." in local_part:
            raise ValueError("Email cannot contain consecutive dots")

        if len(domain_part) < 3:
            raise ValueError("Email domain must be at least 3 characters")
        if len(domain_part) > 255:
            raise ValueError("Email domain must not exceed 255 characters")
        if "." not in domain_part:
            raise ValueError("Email domain must contain a dot")

        # Block temporary/disposable email providers
        blocked_domains = [
            "tempmail.com",
            "throwaway.email",
            "guerrillamail.com",
            "10minutemail.com",
            "mailinator.com",
            "yopmail.com",
            "temp-mail.org",
            "fakeinbox.com",
        ]

        if domain_part in blocked_domains:
            raise ValueError("Email domain is not allowed")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = v.strip()
        if len(v) == 0:
            return None

        phone_pattern = r"^[\d]+$"
        if not re.match(phone_pattern, v):
            raise ValueError("Invalid phone number format")
        if len(v) < 10:
            raise ValueError("Phone number must be at least 10 digits")
        if len(v) > 20:
            raise ValueError("Phone number must not exceed 20 digits")
        return v

    @field_validator("category", mode="before")
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = str(v).strip().lower()
        if len(v) == 0:
            return None
        if len(v) > 100:
            raise ValueError("Ticket category must not exceed 100 characters")

        valid_categories = [item.value for item in TicketCategory]
        if v not in valid_categories:
            raise ValueError("Invalid ticket category")
        return v

    @field_validator("priority", mode="before")
    @classmethod
    def validate_priority(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = str(v).strip().lower()
        if len(v) == 0:
            return None
        if len(v) > 20:
            raise ValueError("Ticket priority must not exceed 20 characters")

        valid_priorities = [item.value for item in TicketPriority]
        if v not in valid_priorities:
            raise ValueError("Invalid ticket priority")
        return v

    @field_validator("status", mode="before")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v

        v = str(v).strip().lower()
        if len(v) == 0:
            return None
        if len(v) > 20:
            raise ValueError("Ticket status must not exceed 20 characters")

        valid_statuses = [item.value for item in TicketStatus]
        if v not in valid_statuses:
            raise ValueError("Invalid ticket status")
        return v


class SupportTicketPublic(SupportTicketBase):
    """Schema representing support ticket data in the database"""

    id: uuid.UUID = Field(..., description="Support Ticket ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    model_config = ConfigDict(from_attributes=True)


class SupportTicketResponse(SupportTicketPublic):
    """Schema for support ticket data returned in API responses"""

    user: Optional[UserPublic] = Field(None, description="Associated user details")
    ticket_replies: Optional[list[SupportTicketReplyPublic]] = Field(
        None, description="List of replies associated with the ticket"
    )

    model_config = ConfigDict(from_attributes=True)
