import uuid
from datetime import datetime
from pydantic import ConfigDict
from sqlmodel import SQLModel, Field


class VerificationToken(SQLModel, table=True):
    """
    VerificationToken model for storing verification tokens.

    Attributes:
        id: Unique identifier for the verification token.
        identifier: Identifier associated with the token (e.g., email).
        token: The verification token string.
        expires: Expiration timestamp of the token.
    """

    __tablename__ = "verification_tokens"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False,
    )
    identifier: str = Field(
        index=True,
        nullable=False,
    )
    token: str = Field(
        unique=True,
        nullable=False,
    )
    expires: datetime = Field(
        nullable=False,
    )

    def __repr__(self) -> str:
        """Represent the VerificationToken model as a string"""
        return (
            f"<VerificationToken(identifier='{self.identifier}', token='{self.token}', "
            f"expires='{self.expires}')>"
        )

    def to_dict(self) -> dict:
        """Convert model instance to dictionary"""
        return {
            "id": str(self.id),
            "identifier": self.identifier,
            "token": self.token,
            "expires": self.expires,
        }

    def __eq__(self, other: object) -> bool:
        """Check equality between two VerificationToken instances"""
        if isinstance(other, VerificationToken):
            return self.id == other.id
        return False

    model_config = ConfigDict(from_attributes=True)
