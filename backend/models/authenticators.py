import uuid
from typing import Optional, TYPE_CHECKING
from pydantic import ConfigDict
from sqlmodel import (
    PrimaryKeyConstraint,
    SQLModel,
    Field,
    Relationship,
)

if TYPE_CHECKING:
    from .users import User


class Authenticator(SQLModel, table=True):
    """
    Authenticator model for storing user authenticator details.

    Attributes:
        id: Unique identifier for the authenticator.
        name: Name of the authenticator.
        user_id: Foreign key to users table.
        provider_account_id: Account ID from the provider.
        credential_public_key: Public key of the credential.
        counter: Counter for the authenticator.
        credential_device_type: Type of device for the credential.
        credential_backed_up: Indicates if the credential is backed up.
        transports: Optional transports information.

        user: Relationship to the User model (1-to-N).
    """

    __tablename__ = "authenticators"
    __table_args__ = (
        PrimaryKeyConstraint(
            "user_id",
            "credential_id",
            name="authenticators_pkey",
        ),
    )

    credential_id: str = Field(
        unique=True,
        nullable=False,
    )
    user_id: uuid.UUID = Field(
        foreign_key="users.id",
        ondelete="CASCADE",
    )
    provider_account_id: str = Field(
        nullable=False,
    )
    credential_public_key: str = Field(
        nullable=False,
    )
    counter: int = Field(
        nullable=False,
    )
    credential_device_type: str = Field(
        nullable=False,
    )
    credential_backed_up: bool = Field(
        nullable=False,
    )
    transports: Optional[str] = Field(
        default=None,
        nullable=True,
    )

    user: Optional["User"] = Relationship(
        back_populates="authenticators",
        sa_relationship_kwargs={"lazy": "select"},
    )

    def __repr__(self) -> str:
        """Represent the Authenticator model as a string"""
        return f"<Authenticator(credential_id='{self.credential_id}', user_id='{self.user_id}')>"

    def to_dict(self) -> dict:
        """Convert model instance to dictionary"""
        return {
            "credential_id": self.credential_id,
            "user_id": str(self.user_id),
            "provider_account_id": self.provider_account_id,
            "credential_public_key": self.credential_public_key,
            "counter": self.counter,
            "credential_device_type": self.credential_device_type,
            "credential_backed_up": self.credential_backed_up,
            "transports": self.transports,
        }

    def __eq__(self, other: object) -> bool:
        """Check equality between two Authenticator instances"""
        if isinstance(other, Authenticator):
            return (self.credential_id, self.user_id) == (
                other.credential_id,
                other.user_id,
            )
        return False

    model_config = ConfigDict(from_attributes=True)
