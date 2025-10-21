import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import (
    Text,
    SQLModel,
    Field,
    CheckConstraint,
    DECIMAL,
    TIMESTAMP,
)
from pydantic import ConfigDict


class VPSPlan(SQLModel, table=True):
    """
    VPSPlan model for storing VPS plan details.

    Attributes:
        id: Unique identifier for the VPS plan.
        name: Name of the VPS plan.
        description: Optional description of the VPS plan.
        vcpu: Number of virtual CPUs.
        ram_gb: Amount of RAM in GB.
        storage_type: Type of storage (e.g., SSD, NVMe).
        storage_gb: Amount of storage in GB.
        bandwidth_mb: Bandwidth limit in MB.
        operating_system: Operating system provided with the VPS.
        monthly_price: Monthly price of the VPS plan.
        setup_fee: One-time setup fee for the VPS plan.
        created_at: Timestamp when the VPS plan was created.
        updated_at: Timestamp when the VPS plan was last updated.
    """

    __tablename__ = "vps_plans"
    __table_args__ = (
        CheckConstraint(
            "storage_type IN ('SSD', 'NVMe')",
            name="vps_plans_storage_type_check",
        ),
    )

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False,
    )
    name: str = Field(
        nullable=False,
        max_length=100,
    )
    description: Optional[str] = Field(
        default=None,
        nullable=True,
        sa_column_kwargs={"type_": Text},
    )
    vcpu: int = Field(
        nullable=False,
    )
    ram_gb: int = Field(
        nullable=False,
    )
    storage_type: str = Field(
        nullable=False,
        max_length=20,
    )
    storage_gb: int = Field(
        nullable=False,
    )
    bandwidth_mb: int = Field(
        nullable=False,
    )
    operating_system: str = Field(
        nullable=False,
        max_length=100,
    )
    monthly_price: float = Field(
        nullable=False,
        sa_column_kwargs={"type_": DECIMAL(10, 2)},
    )
    setup_fee: float = Field(
        default=0.0,
        nullable=False,
        sa_column_kwargs={"type_": DECIMAL(10, 2)},
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
        sa_column_kwargs={
            "type_": TIMESTAMP(timezone=True),
        },
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
        sa_column_kwargs={
            "type_": TIMESTAMP(timezone=True),
            "onupdate": lambda: datetime.now(timezone.utc),
        },
    )

    def __repr__(self) -> str:
        """Represent the VPSPlan model as a string"""
        return f"<VPSPlan(name='{self.name}', monthly_price='{self.monthly_price}')>"

    def __str__(self) -> str:
        """String representation of the VPSPlan model"""
        return f"VPSPlan(name={self.name}, price_per_month={self.monthly_price})"

    def to_dict(self) -> dict:
        """Convert the VPSPlan model to a dictionary"""
        return {
            "id": str(self.id),
            "name": self.name,
            "description": self.description,
            "vcpu": self.vcpu,
            "ram_gb": self.ram_gb,
            "storage_type": self.storage_type,
            "storage_gb": self.storage_gb,
            "bandwidth_mb": self.bandwidth_mb,
            "operating_system": self.operating_system,
            "monthly_price": float(self.monthly_price),
            "setup_fee": float(self.setup_fee),
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    def __eq__(self, other) -> bool:
        """Check equality between two VPSPlan instances"""
        if not isinstance(other, VPSPlan):
            return NotImplemented
        return self.id == other.id

    def __hash__(self) -> int:
        """Hash based on VPSPlan ID"""
        return hash(self.id)

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={
            uuid.UUID: lambda v: str(v),
            datetime: lambda v: v.isoformat() if v else None,
        },
    )
