from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
import logging

from backend.db import get_session
from backend.models import User
from backend.schemas import ChatRequest, ChatResponse
from backend.services import ChatbotService
from backend.utils import get_current_user, Translator, get_translator


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chatbot", tags=["Chatbot"])


@router.post(
    "/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Chat with VPS Assistant",
    description="Interact with the intelligent VPS assistant for support and recommendations.",
)
async def chat(
    request: ChatRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    translator: Translator = Depends(get_translator),
) -> ChatResponse:
    """
    Chat with the intelligent VPS assistant

    This endpoint provides:
    - Automatic responses for common questions
    - VPS plan recommendations based on user requirements
    - Technical support information
    - Limited to VPS and private cloud topics only

    Args:
        request: Chat request with user message
        session: Database session
        current_user: Authenticated user
        translator: Translator for i18n messages

    Raises:
        HTTPException: 401 Unauthorized if user is not authenticated
        HTTPException: 500 Internal Server Error if processing fails

    Returns:
        ChatResponse with bot message and metadata
    """
    try:
        chatbot_service = ChatbotService(session)
        response = await chatbot_service.generate_response(
            message=request.message, user_id=current_user.id
        )

        return ChatResponse(
            message=response["message"],
            intent=response["intent"],
            recommended_plans=response.get("recommended_plans"),
            category=response.get("category"),
        )
    except Exception as e:
        logger.error(f">>> Chatbot error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=translator.t("errors.internal_server"),
        )
