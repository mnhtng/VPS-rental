import uuid
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlmodel import (
    SQLModel,
    Field,
    Relationship,
    TEXT,
    TIMESTAMP,
)

if TYPE_CHECKING:
    from .users import User


class Role(SQLModel, table=True):
    """
    Role model for defining user roles and permissions.

    Attributes:
        id: Unique identifier for the role.
        name: Name of the role.
        description: Optional description of the role.
        created_at: Timestamp when the role was created.
        updated_at: Timestamp when the role was last updated.

        users: List of users with this role.
    """

    __tablename__ = "roles"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False,
    )
    name: str = Field(
        nullable=False,
        unique=True,
        sa_column_kwargs={"type_": TEXT},
    )
    description: Optional[str] = Field(
        default=None,
        nullable=True,
        sa_column_kwargs={"type_": TEXT},
    )
    created_at: datetime = Field(
        default_factory=datetime.now(),
        nullable=False,
        sa_column_kwargs={"type_": TIMESTAMP(precision=3)},
    )
    updated_at: datetime = Field(
        default_factory=datetime.now,
        nullable=False,
        sa_column_kwargs={
            "type_": TIMESTAMP(precision=3),
            "onupdate": datetime.utcnow,
        },
    )

    users: List["User"] = Relationship(
        back_populates="role",
        sa_relationship_kwargs={"lazy": "select"},
    )

    def __repr__(self) -> str:
        """Represent the Role model as a string"""
        return f"<Role(name='{self.name}', description='{self.description}')>"

    def to_dict(self) -> dict:
        """Convert model instance to dictionary"""
        return {
            "id": str(self.id),
            "name": self.name,
            "description": self.description,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    def __eq__(self, other) -> bool:
        """Check equality between two Role instances"""
        if isinstance(other, Role):
            return self.id == other.id
        return False

    class Config:
        """Pydantic model configuration"""

        orm_mode = True
        json_encoders = {
            uuid.UUID: lambda v: str(v),
            datetime: lambda v: v.isoformat() if v else None,
        }
