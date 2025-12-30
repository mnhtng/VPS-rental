import json
import os
from typing import Optional
from functools import lru_cache
from fastapi import Request


SUPPORTED_LANGUAGES = ["en", "vi"]
DEFAULT_LANGUAGE = "vi"

LOCALE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "locales")


@lru_cache(maxsize=10)
def load_translations(lang: str) -> dict:
    """
    Load translations for a specific language.
    Results are cached for performance.

    Args:
        lang: Language code (e.g., 'en', 'vi')

    Returns:
        Dictionary containing translations
    """
    lang = lang if lang in SUPPORTED_LANGUAGES else DEFAULT_LANGUAGE
    file_path = os.path.join(LOCALE_DIR, f"{lang}.json")

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        with open(
            os.path.join(LOCALE_DIR, f"{DEFAULT_LANGUAGE}.json"), "r", encoding="utf-8"
        ) as f:
            return json.load(f)


def get_language_from_request(request: Request) -> str:
    """
    Extract language preference from request headers.

    Priority:
    1. X-Language header (custom header from frontend)
    2. Accept-Language header
    3. Default language

    Args:
        request: FastAPI Request object

    Returns:
        Language code (en/vi)
    """
    x_language = request.headers.get("X-Language")
    if x_language and x_language in SUPPORTED_LANGUAGES:
        return x_language

    accept_language = request.headers.get("Accept-Language", "")

    for lang in accept_language.split(","):
        lang_code = lang.split(";")[0].strip().split("-")[0]
        if lang_code in SUPPORTED_LANGUAGES:
            return lang_code

    return DEFAULT_LANGUAGE


def t(key: str, lang: str = DEFAULT_LANGUAGE, **kwargs) -> str:
    """
    Translate a key to the specified language.

    Args:
        key: Translation key in dot notation (e.g., 'auth.login_success')
        lang: Language code
        **kwargs: Variables for string interpolation (dynamic messages)

    Returns:
        Translated string or the key if not found
    """
    translations = load_translations(lang)

    keys = key.split(".")
    value = translations

    for k in keys:
        if isinstance(value, dict) and k in value:
            value = value[k]
        else:
            return key

    if kwargs and isinstance(value, str):
        try:
            return value.format(**kwargs)
        except KeyError:
            return value

    return value if isinstance(value, str) else key


class Translator:
    """
    Translator class for request-scoped translations.

    Usage:
        translator = Translator(request)
        message = translator.t("auth.login_success")
    """

    def __init__(self, request: Request):
        self.lang = get_language_from_request(request)
        self._translations = load_translations(self.lang)

    def t(self, key: str, **kwargs) -> str:
        """Translate a key using detected language."""
        return t(key, self.lang, **kwargs)

    @property
    def language(self) -> str:
        """Get current language code."""
        return self.lang


def get_translator(request: Request) -> Translator:
    """
    Dependency function to get translator for a request.

    Usage in route:
        @router.get("/example")
        async def example(translator: Translator = Depends(get_translator)):
            return {"message": translator.t("auth.login_success")}
    """
    return Translator(request)
