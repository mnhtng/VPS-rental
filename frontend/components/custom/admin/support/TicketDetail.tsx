"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    Headset,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    MessageSquare,
    Send,
    Loader,
    Mail,
    Phone,
    Calendar,
    User,
    Tag,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/utils/string"
import { SupportTicket, TicketReply } from "@/types/types"

export const TicketDetailSheet = ({
    ticket,
    isOpen,
    onClose,
    onStatusUpdate,
    onReply,
    isUpdatingStatus,
    isSendingReply,
}: {
    ticket: SupportTicket | null
    isOpen: boolean
    onClose: () => void
    onStatusUpdate: (ticketId: string, status: 'open' | 'in_progress' | 'resolved' | 'closed') => void
    onReply: (ticketId: string, message: string) => void
    isUpdatingStatus: boolean
    isSendingReply: boolean
}) => {
    const [replyMessage, setReplyMessage] = useState('')

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { icon: typeof AlertCircle; color: string; label: string }> = {
            open: { icon: AlertCircle, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', label: 'Open' },
            in_progress: { icon: Clock, color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', label: 'In Progress' },
            resolved: { icon: CheckCircle2, color: 'bg-green-500/10 text-green-500 border-green-500/20', label: 'Resolved' },
            closed: { icon: XCircle, color: 'bg-gray-500/10 text-gray-500 border-gray-500/20', label: 'Closed' },
        }
        return configs[status] || configs.open
    }

    const getPriorityConfig = (priority: string) => {
        const configs: Record<string, { color: string; label: string }> = {
            low: { color: 'bg-gray-500/10 text-gray-600 border-gray-500/20', label: 'Low' },
            medium: { color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', label: 'Medium' },
            high: { color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', label: 'High' },
            urgent: { color: 'bg-red-500/10 text-red-600 border-red-500/20', label: 'Urgent' },
        }
        return configs[priority] || configs.medium
    }

    const formatCategory = (category: string) => {
        const categories: Record<string, string> = {
            technical_support: 'Technical Support',
            payment: 'Payment',
            server_issue: 'Server Issue',
            performance: 'Performance',
            security: 'Security',
            other: 'Other',
        }
        return categories[category] || category
    }

    const handleSendReply = () => {
        if (!ticket || !replyMessage.trim()) return
        onReply(ticket.id, replyMessage)
        setReplyMessage('')
    }

    if (!ticket) return null

    const statusConfig = getStatusConfig(ticket.status)
    const StatusIcon = statusConfig.icon
    const priorityConfig = getPriorityConfig(ticket.priority)

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent
                side="right"
                onInteractOutside={e => {
                    e.preventDefault()
                }}
                className="w-full sm:max-w-2xl overflow-y-auto p-0"
            >
                {/* Header with gradient background */}
                <div className="bg-linear-to-br from-cyan-500/20 via-cyan-500/10 to-background p-6 pb-8">
                    <SheetHeader className="text-left">
                        <SheetTitle className="text-xl flex items-center gap-2">
                            <Headset className="h-5 w-5 text-cyan-500" />
                            Ticket Details
                        </SheetTitle>
                        <SheetDescription>
                            View and respond to support requests
                        </SheetDescription>
                    </SheetHeader>
                </div>

                {/* Ticket Info Card */}
                <div className="px-6 -mt-6">
                    <div className="bg-card border rounded-xl p-4 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="space-y-3">
                            <h3 className="text-lg font-semibold line-clamp-2">{ticket.subject}</h3>
                            <div className="flex flex-wrap gap-2">
                                <Badge className={`${statusConfig.color} flex items-center gap-1 border`}>
                                    <StatusIcon className="h-3 w-3" />
                                    {statusConfig.label}
                                </Badge>
                                <Badge className={`${priorityConfig.color} border`}>
                                    {priorityConfig.label}
                                </Badge>
                                <Badge variant="outline">
                                    {formatCategory(ticket.category)}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground font-mono">
                                ID: {ticket.id}
                            </p>
                        </div>
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-6 space-y-6">
                        {/* User & Contact Info */}
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '50ms' }}>
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Sender Information</h4>
                            <div className="grid gap-3 bg-muted/50 rounded-lg p-4">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                                        <User className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <span>{ticket.user?.name || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                        <Mail className="h-4 w-4 text-green-500" />
                                    </div>
                                    <span className="truncate">{ticket.email}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                                        <Phone className="h-4 w-4 text-purple-500" />
                                    </div>
                                    <span>{ticket.phone}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                                        <Calendar className="h-4 w-4 text-orange-500" />
                                    </div>
                                    <span>{formatDateTime(new Date(ticket.created_at))}</span>
                                </div>
                            </div>
                        </div>

                        {/* Status Update */}
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '100ms' }}>
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <Tag className="h-4 w-4" />
                                Update Status
                            </h4>
                            <Select
                                value={ticket.status}
                                onValueChange={(value) => onStatusUpdate(ticket.id, value as 'open' | 'in_progress' | 'resolved' | 'closed')}
                                disabled={isUpdatingStatus}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="open">
                                        <span className="flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-blue-500" />
                                            Open
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="in_progress">
                                        <span className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-yellow-500" />
                                            In Progress
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="resolved">
                                        <span className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            Resolved
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="closed">
                                        <span className="flex items-center gap-2">
                                            <XCircle className="h-4 w-4 text-gray-500" />
                                            Closed
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Conversation */}
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '150ms' }}>
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Conversation ({(ticket.replies?.length || 0) + 1} messages)
                            </h4>
                            <div className="border rounded-lg p-4 bg-muted/30 max-h-80 overflow-y-auto space-y-4">
                                {/* Initial message from user */}
                                <div className=" w-[85%] flex gap-3 flex-row-reverse ml-auto">
                                    <Avatar className="h-8 w-8 shrink-0">
                                        <AvatarFallback className="bg-muted">
                                            {ticket.user?.name?.charAt(0) || ticket.email?.charAt(0) || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 rounded-lg p-3 bg-muted ml-8">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium">
                                                {ticket.user?.name || ticket.email}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDateTime(new Date(ticket.created_at))}
                                            </span>
                                        </div>
                                        <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
                                    </div>
                                </div>

                                {/* Replies */}
                                {ticket.replies && ticket.replies.length > 0 && (
                                    <>
                                        {ticket.replies.map((reply: TicketReply) => {
                                            const isAdmin = reply.message.sender.role === 'ADMIN'
                                            return (
                                                <div
                                                    key={reply.id}
                                                    className={cn(
                                                        'w-[85%] flex gap-3',
                                                        isAdmin ? 'flex-row mr-auto' : 'flex-row-reverse ml-auto'
                                                    )}
                                                >
                                                    <Avatar className="h-8 w-8 shrink-0">
                                                        <AvatarFallback
                                                            className={cn(
                                                                isAdmin
                                                                    ? 'bg-cyan-500 text-white'
                                                                    : 'bg-muted'
                                                            )}
                                                        >
                                                            {isAdmin ? 'S' : reply.message.sender.name?.charAt(0) || 'U'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div
                                                        className={cn(
                                                            'flex-1 rounded-lg p-3',
                                                            isAdmin
                                                                ? 'bg-cyan-500/10 mr-8'
                                                                : 'bg-muted ml-8'
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-sm font-medium">
                                                                {isAdmin ? 'Support Team' : reply.message.sender.name}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {formatDateTime(new Date(reply.created_at))}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm whitespace-pre-wrap">{reply.message.content.text}</p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Reply Input */}
                        {ticket.status !== 'closed' && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '200ms' }}>
                                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                    Reply
                                </h4>
                                <Textarea
                                    placeholder="Enter your reply..."
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    className="resize-none"
                                    rows={3}
                                />
                                <Button
                                    onClick={handleSendReply}
                                    disabled={!replyMessage.trim() || isSendingReply}
                                    className="w-full bg-cyan-600 hover:bg-cyan-700"
                                >
                                    {isSendingReply ? (
                                        <>
                                            <Loader className="h-4 w-4 animate-spin mr-2" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4 mr-2" />
                                            Send Reply
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <SheetFooter className="px-6 pb-6">
                    <SheetClose asChild>
                        <Button variant="outline" className="w-full">Close</Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
