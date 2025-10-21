import uuid
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship


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
        sa_column_kwargs={"type_": "TEXT"},
    )
    token: str = Field(
        unique=True,
        nullable=False,
        sa_column_kwargs={"type_": "TEXT"},
    )
    expires: datetime = Field(
        nullable=False,
        sa_column_kwargs={
            "type_": "TIMESTAMP(3)",
        },
    )

    def __repr__(self) -> str:
        """Represent the VerificationToken model as a string"""
        return (
            f"<VerificationToken(identifier='{self.identifier}', token='{self.token}', "
            f"expires='{self.expires}')>"
        )

    def __str__(self) -> str:
        """String representation of the VerificationToken model"""
        return f"VerificationToken(identifier={self.identifier}, token={self.token})"

    def to_dict(self) -> dict:
        """Convert model instance to dictionary"""
        return {
            "id": str(self.id),
            "identifier": self.identifier,
            "token": self.token,
            "expires": self.expires,
        }

    def __eq__(self, other) -> bool:
        """Check equality based on id"""
        if isinstance(other, VerificationToken):
            return self.id == other.id
        return False

    def __hash__(self) -> int:
        """Hash based on id"""
        return hash(self.id)

    class Config:
        """Pydantic model configuration"""

        orm_mode = True
        json_encoders = {
            uuid.UUID: lambda v: str(v),
            datetime: lambda v: v.isoformat() if v else None,
        }
