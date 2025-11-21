import uuid
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from pydantic import ConfigDict
from sqlmodel import (
    SQLModel,
    Field,
    Relationship,
    UniqueConstraint,
)

if TYPE_CHECKING:
    from .users import User


class Account(SQLModel, table=True):
    """
    Account model for OAuth/Social login providers.

    Attributes:
        id: Unique identifier for the account.
        user_id: Foreign key to users table.
        type: Account type (oauth, email, etc.).
        provider: Provider name (google, github, facebook, etc.).
        provider_account_id: Account ID from the provider.
        refresh_token: OAuth refresh token.
        access_token: OAuth access token.
        expires_at: Token expiration timestamp.
        token_type: Token type (Bearer, etc.).
        scope: OAuth scopes.
        id_token: OpenID Connect ID token.
        session_state: OAuth session state.
        created_at: Account creation timestamp.
        updated_at: Last update timestamp.

        user: Relationship to the User model (1-to-1).
    """

    __tablename__ = "accounts"
    __table_args__ = (
        UniqueConstraint(
            "provider",
            "provider_account_id",
            name="accounts_provider_provider_account_id_key",
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
    type: str = Field(
        nullable=False,
    )
    provider: str = Field(
        nullable=False,
    )
    provider_account_id: str = Field(
        nullable=False,
    )
    refresh_token: Optional[str] = Field(
        default=None,
        nullable=True,
    )
    access_token: Optional[str] = Field(
        default=None,
        nullable=True,
    )
    expires_at: Optional[int] = Field(
        default=None,
        nullable=True,
    )
    token_type: Optional[str] = Field(
        default=None,
        nullable=True,
    )
    scope: Optional[str] = Field(
        default=None,
        nullable=True,
    )
    id_token: Optional[str] = Field(
        default=None,
        nullable=True,
    )
    session_state: Optional[str] = Field(
        default=None,
        nullable=True,
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
        back_populates="account",
        sa_relationship_kwargs={"lazy": "select"},
    )

    def __repr__(self) -> str:
        """Represent the Account model as a string"""
        return f"<Account(provider='{self.provider}', user_id='{self.user_id}')>"

    def to_dict(self) -> dict:
        """Convert model instance to dictionary"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "type": self.type,
            "provider": self.provider,
            "provider_account_id": self.provider_account_id,
            "refresh_token": self.refresh_token,
            "access_token": self.access_token,
            "expires_at": self.expires_at,
            "token_type": self.token_type,
            "scope": self.scope,
            "id_token": self.id_token,
            "session_state": self.session_state,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def __eq__(self, other: object) -> bool:
        """Check equality between two Account instances"""
        if isinstance(other, Account):
            return self.id == other.id
        return False

    model_config = ConfigDict(from_attributes=True)
