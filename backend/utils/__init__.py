"""
Utility Functions Package
=========================

This package contains various utility functions and helpers used across the backend application.
"""

from .auth_utils import (
    hash_password,
    verify_password,
)

__all__ = [
    # Authentication utilities
    "hash_password",
    "verify_password",
]
