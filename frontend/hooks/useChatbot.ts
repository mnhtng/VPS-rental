import { ApiResponse, ChatResponse } from "@/types/types";
import { apiPattern } from "@/utils/pattern";

const useChatbot = () => {
    const sendMessage = async (
        message: string,
        signal?: AbortSignal
    ): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/chatbot/chat`, {
                method: 'POST',
                signal,
                body: JSON.stringify({
                    message,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: 'Chatbot request failed',
                    error: {
                        code: 'CHATBOT_ERROR',
                        detail: result.detail || 'Failed to get response from chatbot',
                    }
                };
            }

            return {
                message: 'Success',
                data: result as ChatResponse,
            };
        } catch (error) {
            return {
                message: "Chatbot request failed",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'CHATBOT_ERROR',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? "No access token available"
                        : "An error occurred while communicating with the chatbot",
                }
            };
        }
    };

    return {
        sendMessage,
    };
};

export default useChatbot;
