"""
Database Package
================

This package handles database connections, session management, and initialization for the backend application.
"""

from .database import (
    engine,
    get_session,
    init_db,
)

__all__ = [
    "engine",
    "get_session",
    "init_db",
]
