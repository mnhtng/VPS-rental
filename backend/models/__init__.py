"""
Models Package
==============

Database models representing the core entities of the application.
Defines SQLModel models for database tables.
"""

import logging
from typing import Type, Union
from .roles import Role
from .users import User

# Package metadata
__version__ = "1.0.0"
__author__ = "MnhTng"

# Setup logging
logger = logging.getLogger(__name__)


# Public API
__all__ = [
    # Metadata
    "__version__",
    "__author__",
    # Models
    "Role",
    "User",
    # Type aliases
    "ModelType",
    "ModelInstance",
]


# Type aliases for better type hints
ModelType = Union[Type[Role], Type[User]]
ModelInstance = Union[Role, User]

logger.info("Backend models package initialized.")
