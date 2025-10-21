import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship, UniqueConstraint

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

        user: Relationship to the User model.
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
        foreign_key="users.id",
        nullable=False,
        index=True,
        ondelete="CASCADE",
        sa_column_kwargs={
            "onupdate": "CASCADE",
        },
    )
    type: str = Field(
        nullable=False,
        sa_column_kwargs={"type_": "TEXT"},
    )
    provider: str = Field(
        nullable=False,
        sa_column_kwargs={"type_": "TEXT"},
    )
    provider_account_id: str = Field(
        nullable=False,
        sa_column_kwargs={"type_": "TEXT"},
    )
    refresh_token: Optional[str] = Field(
        default=None,
        nullable=True,
        sa_column_kwargs={"type_": "TEXT"},
    )
    access_token: Optional[str] = Field(
        default=None,
        nullable=True,
        sa_column_kwargs={"type_": "TEXT"},
    )
    expires_at: Optional[int] = Field(
        default=None,
        nullable=True,
    )
    token_type: Optional[str] = Field(
        default=None,
        nullable=True,
        sa_column_kwargs={"type_": "TEXT"},
    )
    scope: Optional[str] = Field(
        default=None,
        nullable=True,
        sa_column_kwargs={"type_": "TEXT"},
    )
    id_token: Optional[str] = Field(
        default=None,
        nullable=True,
        sa_column_kwargs={"type_": "TEXT"},
    )
    session_state: Optional[str] = Field(
        default=None,
        nullable=True,
        sa_column_kwargs={"type_": "TEXT"},
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        sa_column_kwargs={
            "type_": "TIMESTAMP(3)",
        },
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        nullable=False,
        sa_column_kwargs={
            "type_": "TIMESTAMP(3)",
            "onupdate": datetime.utcnow,
        },
    )

    user: Optional["User"] = Relationship(
        back_populates="account",
        sa_relationship_kwargs={"lazy": "select"},
    )

    def __repr__(self) -> str:
        """Represent the Account model as a string"""
        return f"<Account(provider='{self.provider}', user_id='{self.user_id}')>"

    def __str__(self) -> str:
        """String representation of the Account model"""
        return f"{self.provider}:{self.provider_account_id}"

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
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    def __eq__(self, other) -> bool:
        """Check equality based on id"""
        if isinstance(other, Account):
            return self.id == other.id
        return False

    def __hash__(self) -> int:
        """Hash based on id"""
        return hash(self.id)

    class Config:
        """Pydantic model configuration"""

        orm_mode = True  # Help smooth conversion between ORM and Pydantic models
        json_encoders = {
            # Help JSON serialization of complex types (when use in FastAPI responses or typecasts to dict/json)
            uuid.UUID: lambda v: str(v),
            datetime: lambda v: v.isoformat() if v else None,
        }
