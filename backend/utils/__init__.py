"""
Utility Functions Package
=========================

This package contains various utility functions and helpers used across the backend application.
"""

from .auth_utils import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
    verify_token,
    generate_verification_token,
    get_current_user,
    get_admin_user,
)
from .string_utils import normalize_hostname, generate_order_number
from .i18n import (
    t,
    Translator,
    get_translator,
    get_language_from_request,
    load_translations,
)

__all__ = [
    # String utilities
    "normalize_hostname",
    "generate_order_number",
    # Authentication utilities
    "hash_password",
    "verify_password",
    "create_access_token",
    "create_refresh_token",
    "verify_refresh_token",
    "verify_token",
    "generate_verification_token",
    "get_current_user",
    "get_admin_user",
    # i18n utilities
    "t",
    "Translator",
    "get_translator",
    "get_language_from_request",
    "load_translations",
]
