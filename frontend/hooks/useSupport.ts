import { apiPattern } from "@/utils/pattern"
import { SupportTicket, CreateTicketData, TicketStatistics, ApiResponse } from "@/types/types";

const useSupport = () => {
    const getTickets = async (
        options?: {
            status?: string;
            priority?: string;
            limit?: number;
            offset?: number;
        },
        signal?: AbortSignal
    ): Promise<ApiResponse> => {
        try {
            const params = new URLSearchParams();
            if (options?.status && options.status !== 'all') params.append('status', options.status);
            if (options?.priority && options.priority !== 'all') params.append('priority', options.priority);
            if (options?.limit) params.append('limit', options.limit.toString());
            if (options?.offset) params.append('offset', options.offset.toString());

            const queryString = params.toString();
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/support/tickets${queryString ? `?${queryString}` : ''}`, {
                method: 'GET',
                signal,
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: 'Get tickets failed',
                    error: {
                        code: 'TICKETS_FETCH_ERROR',
                        detail: result.detail,
                    }
                };
            }

            return {
                message: 'Tickets fetched successfully',
                data: result as SupportTicket[] || [],
            };
        } catch (error) {
            return {
                message: 'Get tickets failed',
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'TICKETS_FETCH_ERROR',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'No access token available'
                        : 'An unexpected error occurred while fetching tickets',
                }
            };
        }
    };

    const getTicketStatistics = async (signal?: AbortSignal): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/support/tickets/statistics`, {
                method: 'GET',
                signal,
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: 'Get ticket statistics failed',
                    error: {
                        code: 'TICKET_STATS_FETCH_ERROR',
                        detail: result.detail,
                    }
                };
            }

            return {
                message: 'Ticket statistics fetched successfully',
                data: result as TicketStatistics || null,
            };
        } catch (error) {
            return {
                message: 'Get ticket statistics failed',
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'TICKET_STATS_FETCH_ERROR',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'No access token available'
                        : 'An unexpected error occurred while fetching ticket statistics',
                }
            };
        }
    };

    const createTicket = async (data: CreateTicketData): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/support/tickets`, {
                method: 'POST',
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: "Create ticket failed",
                    error: {
                        code: 'TICKET_CREATE_ERROR',
                        detail: result.detail,
                    }
                };
            }

            return {
                message: "Ticket created successfully",
                data: result as SupportTicket,
            }
        } catch (error) {
            return {
                message: "Create ticket failed",
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'TICKET_CREATE_ERROR',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'No access token available'
                        : 'An unexpected error occurred while creating the ticket',
                }
            };
        }
    };

    const updateTicket = async (
        ticketId: string,
        data: Partial<SupportTicket>,
    ): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/support/tickets/${ticketId}`, {
                method: 'PUT',
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: 'Update ticket failed',
                    error: {
                        code: 'TICKET_UPDATE_ERROR',
                        detail: result.detail,
                    }
                };
            }

            return {
                message: 'Ticket updated successfully',
                data: result as SupportTicket || null,
            };
        } catch (error) {
            return {
                message: 'Update ticket failed',
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'TICKET_UPDATE_ERROR',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'No access token available'
                        : 'An unexpected error occurred while updating the ticket',
                }
            };
        }
    };

    const addReply = async (
        ticketId: string,
        message: string,
    ): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/support/tickets/${ticketId}/replies`, {
                method: 'POST',
                body: JSON.stringify({ message }),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: 'Add reply failed',
                    error: {
                        code: 'REPLY_ADD_ERROR',
                        detail: result.detail,
                    }
                };
            }

            return {
                message: 'Reply added successfully',
                data: result as SupportTicket || null,
            };
        } catch (error) {
            return {
                message: 'Add reply failed',
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'REPLY_ADD_ERROR',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'No access token available'
                        : 'An unexpected error occurred while adding the reply',
                }
            };
        }
    };

    const adminGetAllTickets = async (
        options?: {
            status?: string;
            priority?: string;
        },
        signal?: AbortSignal
    ): Promise<ApiResponse> => {
        try {
            const params = new URLSearchParams();
            if (options?.status && options.status !== 'all') params.append('status', options.status);
            if (options?.priority && options.priority !== 'all') params.append('priority', options.priority);
            const queryString = params.toString();

            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/support/admin/tickets${queryString ? `?${queryString}` : ''}`, {
                method: 'GET',
                signal,
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: 'Get all tickets failed',
                    error: {
                        code: 'ADMIN_TICKETS_FETCH_ERROR',
                        detail: result.detail,
                    }
                };
            }

            return {
                message: 'All tickets fetched successfully',
                data: result as SupportTicket[] || [],
            };
        } catch (error) {
            return {
                message: 'Get all tickets failed',
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'ADMIN_TICKETS_FETCH_ERROR',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'No access token available'
                        : 'An unexpected error occurred while fetching all tickets',
                }
            };
        }
    };

    const adminGetTicketStatistics = async (signal?: AbortSignal): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/support/admin/tickets/statistics`, {
                method: 'GET',
                signal,
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: 'Get ticket statistics failed',
                    error: {
                        code: 'ADMIN_TICKET_STATS_FETCH_ERROR',
                        detail: result.detail,
                    }
                };
            }

            return {
                message: 'Ticket statistics fetched successfully',
                data: result as TicketStatistics || null,
            };
        } catch (error) {
            return {
                message: 'Get ticket statistics failed',
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'ADMIN_TICKET_STATS_FETCH_ERROR',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'No access token available'
                        : 'An unexpected error occurred while fetching ticket statistics',
                }
            };
        }
    };

    const adminUpdateTicketStatus = async (
        ticketId: string,
        status: 'open' | 'in_progress' | 'resolved' | 'closed',
    ): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/support/admin/tickets/${ticketId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status }),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: 'Update ticket status failed',
                    error: {
                        code: 'ADMIN_TICKET_STATUS_UPDATE_ERROR',
                        detail: result.detail,
                    }
                };
            }

            return {
                message: 'Ticket status updated successfully',
                data: result as SupportTicket || null,
            };
        } catch (error) {
            return {
                message: 'Update ticket status failed',
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'ADMIN_TICKET_STATUS_UPDATE_ERROR',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'No access token available'
                        : 'An unexpected error occurred while updating ticket status',
                }
            };
        }
    };

    const adminAddReply = async (
        ticketId: string,
        message: string,
    ): Promise<ApiResponse> => {
        try {
            const response = await apiPattern(`${process.env.NEXT_PUBLIC_API_URL}/support/admin/tickets/${ticketId}/replies`, {
                method: 'POST',
                body: JSON.stringify({ message }),
            });

            const result = await response.json();

            if (!response.ok) {
                return {
                    message: 'Add reply failed',
                    error: {
                        code: 'ADMIN_REPLY_ADD_ERROR',
                        detail: result.detail,
                    }
                };
            }

            return {
                message: 'Reply added successfully',
                data: result as SupportTicket || null,
            };
        } catch (error) {
            return {
                message: 'Add reply failed',
                error: {
                    code: error instanceof Error && error.message === 'NO_ACCESS_TOKEN' ? 'NO_ACCESS_TOKEN' : 'ADMIN_REPLY_ADD_ERROR',
                    detail: error instanceof Error && error.message === 'NO_ACCESS_TOKEN'
                        ? 'No access token available'
                        : 'An unexpected error occurred while adding the reply',
                }
            };
        }
    };

    return {
        getTickets,
        getTicketStatistics,
        createTicket,
        updateTicket,
        addReply,
        adminGetAllTickets,
        adminGetTicketStatistics,
        adminUpdateTicketStatus,
        adminAddReply,
    };
};

export default useSupport;
