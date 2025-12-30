import logging
from typing import Dict, List, Optional
from sqlmodel import Session, select
from openai import AsyncOpenAI

from backend.core import settings
from backend.models import VPSPlan


logger = logging.getLogger("__name__")


class ChatbotService:
    """Service for intelligent chatbot interactions with VPS customers"""

    OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
    MODEL = "google/gemini-2.0-flash-exp:free"

    INTENT_KEYWORDS = {
        "greeting": ["xin chào", "chào", "hello", "hi", "hey", "chao"],
        "support": [
            "hỗ trợ",
            "support",
            "giúp đỡ",
            "help",
            "liên hệ",
            "contact",
            "ho tro",
            "giup do",
            "lien he",
        ],
    }

    # Keywords that indicate AI is refusing to answer (out of scope)
    OUT_OF_SCOPE_KEYWORDS = [
        "xin lỗi",
        "sorry",
        "chỉ có thể tư vấn",
        "only consult",
        "ngoài phạm vi",
        "outside scope",
        "không thể giúp",
        "cannot help",
    ]

    def __init__(self, session: Session):
        """Initialize chatbot service with database session and OpenRouter API"""
        self.session = session
        self.api_key = settings.OPENROUTER_API_KEY
        
        if self.api_key:
            self.client = AsyncOpenAI(
                base_url=self.OPENROUTER_BASE_URL,
                api_key=self.api_key,
            )
        else:
            self.client = None
            logger.warning(">>> OPENROUTER API KEY not found")

    def detect_language(self, message: str) -> str:
        """
        Detect language of user message

        Args:
            message: User message text

        Returns:
            Language code ('vi' for Vietnamese, 'en' for English)
        """
        vietnamese_chars = [
            "à", "á", "ạ", "ả", "ã", "â", "ầ", "ấ", "ậ", "ẩ", "ẫ",
            "ă", "ằ", "ắ", "ặ", "ẳ", "ẵ", "è", "é", "ẹ", "ẻ", "ẽ",
            "ê", "ề", "ế", "ệ", "ể", "ễ", "ì", "í", "ị", "ỉ", "ĩ",
            "ò", "ó", "ọ", "ỏ", "õ", "ô", "ồ", "ố", "ộ", "ổ", "ỗ",
            "ơ", "ờ", "ớ", "ợ", "ở", "ỡ", "ù", "ú", "ụ", "ủ", "ũ",
            "ư", "ừ", "ứ", "ự", "ử", "ữ", "ỳ", "ý", "ỵ", "ỷ", "ỹ", "đ",
        ]

        message_lower = message.lower()
        vn_char_count = sum(1 for char in message_lower if char in vietnamese_chars)

        if vn_char_count > 0:
            return "vi"

        return "en"

    def detect_intent(self, message: str) -> str:
        """
        Detect user intent from message

        Args:
            message: User message text

        Returns:
            Detected intent:
            - "greeting": User is greeting the bot
            - "support": User is seeking support information
            - "consultation": User is asking for VPS consultation (price, plan recommendation, etc.)
        """
        message_lower = message.lower()

        for keyword in self.INTENT_KEYWORDS["greeting"]:
            if keyword in message_lower:
                return "greeting"

        for keyword in self.INTENT_KEYWORDS["support"]:
            if keyword in message_lower:
                return "support"

        return "consultation"

    def get_all_plans(self) -> List[VPSPlan]:
        """
        Get all VPS plans from database

        Returns:
            List of VPS plans
        """
        try:
            statement = select(VPSPlan)
            plans = self.session.exec(statement).all()
            return plans
        except Exception as e:
            logger.error(f">>> Error fetching VPS plans: {e}")
            return []

    def _format_plans_for_ai(self, plans: List[VPSPlan]) -> str:
        """
        Format VPS plans data for AI

        Args:
            plans: List of VPS plans

        Returns:
            Formatted string with plan details
        """
        if not plans:
            return "No VPS plans available"

        plans_info = []
        for plan in plans:
            use_case = (
                ", ".join(plan.use_case) if plan.use_case else "Multiple use cases"
            )
            plans_info.append(
                f"- {plan.name} ({plan.category}): "
                f"{plan.vcpu} vCPU, {plan.ram_gb}GB RAM, "
                f"{plan.storage_gb}GB {plan.storage_type}, "
                f"{plan.bandwidth_mbps}Mbps, "
                f"{int(plan.monthly_price):,}đ/month,"
                f"Suitable for: {use_case}"
            )

        return "\n".join(plans_info)

    def _create_system_prompt(self, plans_data: str, language: str) -> str:
        """
        Create system prompt for AI consultation

        Args:
            plans_data: Formatted VPS plans data
            language: Language code ('vi' or 'en')

        Returns:
            System prompt for AI
        """
        if language == "vi":
            return f"""Bạn là trợ lý tư vấn VPS chuyên nghiệp của PCloud. Nhiệm vụ của bạn:

QUAN TRỌNG:
- CHỈ trả lời về VPS và Private Cloud
- KHÔNG đưa thông tin ngoài lề về các chủ đề khác
- Trả lời NGẮN GỌN, không lan man
- Dùng ngôn từ thân thiện, tự nhiên
- TRẢ LỜI BẰNG TIẾNG VIỆT

DANH SÁCH GÓI VPS HIỆN CÓ:
{plans_data}

HƯỚNG DẪN TRẢ LỜI:
1. Phân tích yêu cầu của khách hàng (mục đích sử dụng, ngân sách, tài nguyên cần)
2. Đề xuất 1-3 gói phù hợp nhất từ danh sách trên
3. Giải thích ngắn gọn TẠI SAO phù hợp
4. Format: tên gói, cấu hình chính, giá, lý do

NẾU khách hỏi ngoài phạm vi VPS/Private Cloud:
"Xin lỗi, tôi chỉ có thể tư vấn về VPS và Private Cloud. Bạn có câu hỏi nào về dịch vụ VPS không?"

Trả lời ngắn gọn (2-4 câu), tập trung vào giá trị."""
        else:
            return f"""You are a professional VPS consulting assistant for PCloud.

IMPORTANT:
- ONLY answer about VPS and Private Cloud
- DO NOT provide off-topic information
- Answer CONCISELY and BRIEFLY, don't ramble
- Use friendly and natural language
- RESPOND IN ENGLISH

AVAILABLE VPS PLANS:
{plans_data}

RESPONSE GUIDELINES:
1. Analyze customer requirements (use case, budget, resource needs)
2. Recommend 1-3 most suitable plans from the list above
3. Briefly explain WHY they are suitable
4. Format: plan name, main specs, price, reason

IF customer asks outside VPS/Private Cloud scope:
"Sorry, I can only consult about VPS and Private Cloud. Do you have any questions about VPS services?"

Respond concisely (2-4 sentences), focus on value."""

    def _is_out_of_scope_response(self, ai_response: str) -> bool:
        """
        Check if AI response indicates an out-of-scope question

        Args:
            ai_response: Response from AI

        Returns:
            True if the response is refusing to answer (out of scope)
        """
        response_lower = ai_response.lower()
        return any(keyword in response_lower for keyword in self.OUT_OF_SCOPE_KEYWORDS)

    def _parse_ai_response_for_plans(
        self, ai_response: str, all_plans: List[VPSPlan]
    ) -> List[Dict]:
        """
        Parse AI response to extract recommended plan IDs

        Args:
            ai_response: Response from AI
            all_plans: All available VPS plans

        Returns:
            List of recommended plans as dictionaries
        """
        if self._is_out_of_scope_response(ai_response):
            return []

        recommended_plans = []
        response_lower = ai_response.lower()

        sorted_plans = sorted(all_plans, key=lambda x: len(x.name), reverse=True)

        matched_positions = set()

        #! Find exactly matched plan names in the AI response
        for plan in sorted_plans:
            plan_name_lower = plan.name.lower()
            
            start = 0
            while True:
                pos = response_lower.find(plan_name_lower, start)
                if pos == -1:
                    break
                    
                end_pos = pos + len(plan_name_lower)
                
                # Check if this position is already covered by a longer match
                if any(p in range(pos, end_pos) for p in matched_positions):
                    start = end_pos
                    continue
                
                # Check word boundary: char before and after should not be alphanumeric
                char_before = response_lower[pos - 1] if pos > 0 else ' '
                char_after = response_lower[end_pos] if end_pos < len(response_lower) else ' '
                
                is_word_boundary = (
                    not char_before.isalnum() and char_before != '-' and
                    not char_after.isalnum() and char_after != '-'
                )
                
                if is_word_boundary:
                    # Mark these positions as matched
                    for p in range(pos, end_pos):
                        matched_positions.add(p)
                    
                    # Add plan if not already added
                    plan_dict = plan.to_dict()
                    if plan_dict not in recommended_plans:
                        recommended_plans.append(plan_dict)
                    break
                
                start = end_pos

        return recommended_plans

    async def _call_openrouter_api(self, system_prompt: str, user_message: str) -> Optional[str]:
        """
        Call OpenRouter API with system prompt and user message

        Args:
            system_prompt: The system instructions for the AI
            user_message: The user's question/message

        Returns:
            AI response text or None if failed
        """
        if not self.client:
            return None

        try:
            completion = await self.client.chat.completions.create(
                extra_headers={
                    "HTTP-Referer": "https://ptitcloud.io.vn",
                    "X-Title": "PCloud VPS Assistant",
                },
                model=self.MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt,
                    },
                    {
                        "role": "user",
                        "content": user_message,
                    }
                ],
            )
            return completion.choices[0].message.content
        except Exception as e:
            logger.error(f">>> Error calling OpenRouter API: {e}")
            return None

    async def consult_with_ai(self, user_message: str) -> Dict:
        """
        Use OpenRouter AI to provide VPS consultation

        Args:
            user_message: User's question or request

        Returns:
            Dictionary with AI response and recommended plans
        """
        language = self.detect_language(user_message)
        plans = self.get_all_plans()

        if not plans:
            if language == "vi":
                message = (
                    "Hiện tại hệ thống đang cập nhật thông tin gói VPS. "
                    "Vui lòng liên hệ hotline +84 789 318 158 để được tư vấn trực tiếp."
                )
            else:
                message = (
                    "The system is currently updating VPS plan information. "
                    "Please contact hotline +84 789 318 158 for direct consultation."
                )

            return {
                "message": message,
                "intent": "consultation",
                "recommended_plans": [],
            }

        if not self.client:
            # Fallback: simple recommendation logic
            return self._fallback_response(plans, language)

        plans_data = self._format_plans_for_ai(plans)
        system_prompt = self._create_system_prompt(plans_data, language)
        
        ai_response = await self._call_openrouter_api(system_prompt, user_message)

        if ai_response:
            recommended_plans = self._parse_ai_response_for_plans(ai_response, plans)
            return {
                "message": ai_response,
                "intent": "consultation",
                "recommended_plans": recommended_plans,
            }
        else:
            # Fallback response on API error
            return self._fallback_response(plans, language, error=True)

    def _fallback_response(self, plans: List[VPSPlan], language: str, error: bool = False) -> Dict:
        """
        Generate fallback response when AI is unavailable

        Args:
            plans: List of VPS plans
            language: Language code
            error: Whether this is due to an error

        Returns:
            Dictionary with fallback response
        """
        sorted_plans = sorted(plans, key=lambda x: x.monthly_price)
        top_plans = sorted_plans[:3]

        if language == "vi":
            if error:
                response_parts = ["Tôi có thể giới thiệu các gói phổ biến:\n"]
            else:
                response_parts = ["Dựa trên nhu cầu của bạn, tôi đề xuất:\n"]
            
            for i, plan in enumerate(top_plans, 1):
                price_vnd = f"{int(plan.monthly_price):,}đ"
                response_parts.append(
                    f"\n{i}. **{plan.name}**: {price_vnd}/tháng - "
                    f"{plan.vcpu} vCPU, {plan.ram_gb}GB RAM, {plan.storage_gb}GB {plan.storage_type}"
                )
            
            if error:
                response_parts.append("\n\nBạn muốn biết thêm chi tiết về gói nào?")
        else:
            if error:
                response_parts = ["I can introduce popular plans:\n"]
            else:
                response_parts = ["Based on your needs, I recommend:\n"]
            
            for i, plan in enumerate(top_plans, 1):
                price_vnd = f"{int(plan.monthly_price):,}đ"
                response_parts.append(
                    f"\n{i}. **{plan.name}**: {price_vnd}/month - "
                    f"{plan.vcpu} vCPU, {plan.ram_gb}GB RAM, {plan.storage_gb}GB {plan.storage_type}"
                )
            
            if error:
                response_parts.append("\n\nWould you like more details about any plan?")

        return {
            "message": "".join(response_parts),
            "intent": "consultation",
            "recommended_plans": [p.to_dict() for p in top_plans],
        }

    async def generate_response(self, message: str, user_id: Optional[str] = None) -> Dict:
        """
        Generate intelligent response for user message

        Args:
            message: User message
            user_id: Optional user identifier

        Returns:
            Dictionary with response message and metadata
        """
        language = self.detect_language(message)
        intent = self.detect_intent(message)

        if intent == "greeting":
            if language == "vi":
                greeting_msg = (
                    "Xin chào! Tôi là trợ lý AI của **PCloud**.\n\n"
                    "Tôi có thể giúp bạn:\n"
                    "- Tư vấn chọn gói VPS phù hợp\n"
                    "- Thông tin giá cả và cấu hình\n"
                    "- Hỗ trợ kỹ thuật\n\n"
                    "Bạn cần tư vấn về gói VPS nào?"
                )
            else:
                greeting_msg = (
                    "Hello! I'm the AI assistant of **PCloud**.\n\n"
                    "I can help you with:\n"
                    "- Recommend suitable VPS plans\n"
                    "- Pricing and configuration info\n"
                    "- Technical support\n\n"
                    "What VPS plan do you need advice on?"
                )

            return {"message": greeting_msg, "intent": "greeting"}

        if intent == "support":
            if language == "vi":
                support_msg = (
                    "**Hỗ trợ khách hàng 24/7**\n\n"
                    "- Email: support@ptitcloud.io.vn\n"
                    "- Hotline: +84 789 318 158\n"
                    "- Live Chat: Ngay tại đây!\n\n"
                    "Bạn cần hỗ trợ về vấn đề gì? Bạn có thể liên hệ với chúng tôi hoặc gửi phiếu yêu cầu hỗ trợ."
                )
            else:
                support_msg = (
                    "**24/7 Customer Support**\n\n"
                    "- Email: support@ptitcloud.io.vn\n"
                    "- Hotline: +84 789 318 158\n"
                    "- Live Chat: Right here!\n\n"
                    "What do you need help with? You can contact us or submit a support ticket request."
                )

            return {"message": support_msg, "intent": "support"}

        return await self.consult_with_ai(message)
