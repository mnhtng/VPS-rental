"""
Core Package
============

This package contains the core configurations and settings for the backend application.
"""

from .settings import settings
from .exception_handlers import register_exception_handlers

__all__ = [
    "settings",
    "register_exception_handlers",
]
