"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    Search,
    Headset,
    RefreshCw,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import debounce from "@/utils/performanceUtil/debounce"
import { formatDate, normalizeString } from "@/utils/string"
import useSupport from "@/hooks/useSupport"
import { SupportTicket, TicketStatistics } from "@/types/types"
import Pagination from "@/components/ui/pagination"
import { TicketDetailSheet } from "@/components/custom/admin/support/TicketDetail"
import { useTranslations } from "next-intl"

export default function AdminSupportPage() {
    const tCommon = useTranslations('common')
    const t = useTranslations('admin.support')
    const {
        adminGetAllTickets,
        adminGetTicketStatistics,
        adminUpdateTicketStatus,
        adminAddReply,
    } = useSupport()

    const [tickets, setTickets] = useState<SupportTicket[]>([])
    const [filteredTickets, setFilteredTickets] = useState<SupportTicket[]>([])
    const [statistics, setStatistics] = useState<TicketStatistics | null>(null)
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)

    const [isLoading, setIsLoading] = useState(true)
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
    const [isSendingReply, setIsSendingReply] = useState(false)

    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [filterPriority, setFilterPriority] = useState<string>('all')

    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    const fetchAdminSupport = async (signal?: AbortSignal) => {
        try {
            setIsLoading(true)

            const [ticketsRes, statsRes] = await Promise.all([
                adminGetAllTickets({
                    status: filterStatus !== 'all' ? filterStatus : undefined,
                    priority: filterPriority !== 'all' ? filterPriority : undefined,
                }, signal),
                adminGetTicketStatistics(signal),
            ])

            if (signal?.aborted) return

            if (ticketsRes.error || statsRes.error) {
                toast.error(ticketsRes?.message || statsRes?.message, {
                    description: ticketsRes?.error?.detail || statsRes?.error?.detail,
                })
            } else {
                setTickets(ticketsRes.data || [])
                setFilteredTickets(ticketsRes.data || [])
                setStatistics(statsRes.data || null)
            }
            setIsLoading(false)
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') return

            toast.error(t('toast.fetch_failed'), {
                description: t('toast.fetch_failed'),
            })
            setIsLoading(false)
        }
    }

    useEffect(() => {
        const controller = new AbortController()

        fetchAdminSupport(controller.signal)

        return () => {
            controller.abort()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterStatus, filterPriority])

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { icon: typeof AlertCircle; color: string; label: string }> = {
            open: { icon: AlertCircle, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', label: t('status.open') },
            in_progress: { icon: Clock, color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', label: t('status.in_progress') },
            resolved: { icon: CheckCircle2, color: 'bg-green-500/10 text-green-500 border-green-500/20', label: t('status.resolved') },
            closed: { icon: XCircle, color: 'bg-gray-500/10 text-gray-500 border-gray-500/20', label: t('status.closed') },
        }
        return configs[status] || configs.open
    }

    const getPriorityConfig = (priority: string) => {
        const configs: Record<string, { color: string; label: string }> = {
            low: { color: 'bg-gray-500/10 text-gray-600 border-gray-500/20', label: t('priority.low') },
            medium: { color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', label: t('priority.medium') },
            high: { color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', label: t('priority.high') },
            urgent: { color: 'bg-red-500/10 text-red-600 border-red-500/20', label: t('priority.urgent') },
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

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = normalizeString(e.target.value)
        if (!query) {
            setFilteredTickets(tickets)
            return
        }
        const filtered = tickets.filter(ticket =>
            normalizeString(ticket.subject).includes(query) ||
            normalizeString(ticket.user?.name || '').includes(query) ||
            normalizeString(ticket.email).includes(query)
        )
        setFilteredTickets(filtered)
    }

    const handleViewTicket = (ticket: SupportTicket) => {
        setSelectedTicket(ticket)
        setIsSheetOpen(true)
    }

    const handleStatusUpdate = async (ticketId: string, status: 'open' | 'in_progress' | 'resolved' | 'closed') => {
        try {
            setIsUpdatingStatus(true)

            const result = await adminUpdateTicketStatus(ticketId, status)

            if (result.error) {
                toast.error(result.message, {
                    description: result.error.detail
                })
            } else {
                toast.success(t('toast.status_updated'))

                const updatedTicket = result.data
                setTickets(prev => prev.map(t => t.id === ticketId ? updatedTicket : t))
                setFilteredTickets(prev => prev.map(t => t.id === ticketId ? updatedTicket : t))
                setSelectedTicket(updatedTicket)

                const statsRes = await adminGetTicketStatistics()
                if (!statsRes.error)
                    setStatistics(statsRes.data)
            }
        } catch {
            toast.error(t('toast.status_failed'))
        } finally {
            setIsUpdatingStatus(false)
        }
    }

    const handleReply = async (ticketId: string, message: string) => {
        try {
            setIsSendingReply(true)

            const result = await adminAddReply(ticketId, message)

            if (result.error) {
                toast.error(result.message, {
                    description: result.error.detail
                })
            } else {
                toast.success(t('toast.reply_sent'))

                setSelectedTicket(result.data)
                fetchAdminSupport()
            }
        } catch {
            toast.error(t('toast.reply_failed'))
        } finally {
            setIsSendingReply(false)
        }
    }

    // Pagination
    const totalItems = filteredTickets.length
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedTickets = filteredTickets.slice(startIndex, endIndex)

    useEffect(() => {
        setCurrentPage(1)
    }, [filterStatus, filterPriority])

    return (
        <div className="space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <Card className="animate-in fade-in slide-in-from-bottom-4 hover:shadow-lg transition-all duration-300" style={{ animationDelay: '0ms' }}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t('status.open')}</p>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-12" />
                                ) : (
                                    <p className="text-2xl font-bold text-blue-600">{statistics?.open || 0}</p>
                                )}
                            </div>
                            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <AlertCircle className="h-5 w-5 text-blue-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="animate-in fade-in slide-in-from-bottom-4 hover:shadow-lg transition-all duration-300" style={{ animationDelay: '50ms' }}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t('status.in_progress')}</p>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-12" />
                                ) : (
                                    <p className="text-2xl font-bold text-yellow-600">{statistics?.in_progress || 0}</p>
                                )}
                            </div>
                            <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-yellow-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="animate-in fade-in slide-in-from-bottom-4 hover:shadow-lg transition-all duration-300" style={{ animationDelay: '100ms' }}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t('status.resolved')}</p>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-12" />
                                ) : (
                                    <p className="text-2xl font-bold text-green-600">{statistics?.resolved || 0}</p>
                                )}
                            </div>
                            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="animate-in fade-in slide-in-from-bottom-4 hover:shadow-lg transition-all duration-300" style={{ animationDelay: '150ms' }}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t('status.closed')}</p>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-12" />
                                ) : (
                                    <p className="text-2xl font-bold text-gray-600">{statistics?.closed || 0}</p>
                                )}
                            </div>
                            <div className="h-10 w-10 rounded-full bg-gray-500/10 flex items-center justify-center">
                                <XCircle className="h-5 w-5 text-gray-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="animate-in fade-in slide-in-from-bottom-4 hover:shadow-lg transition-all duration-300 col-span-2 sm:col-span-1" style={{ animationDelay: '200ms' }}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t('stats.total')}</p>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-12" />
                                ) : (
                                    <p className="text-2xl font-bold">{statistics?.total || 0}</p>
                                )}
                            </div>
                            <div className="h-10 w-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
                                <Headset className="h-5 w-5 text-cyan-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('filter.search')}
                        className="pl-10"
                        onChange={debounce(handleSearch, 400)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-full sm:w-40">
                            <SelectValue placeholder={t('filter.placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('filter.all')}</SelectItem>
                            <SelectItem value="open">{t('filter.open')}</SelectItem>
                            <SelectItem value="in_progress">{t('filter.in_progress')}</SelectItem>
                            <SelectItem value="resolved">{t('filter.resolved')}</SelectItem>
                            <SelectItem value="closed">{t('filter.closed')}</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                        <SelectTrigger className="w-full sm:w-40">
                            <SelectValue placeholder={t('table.priority')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('filter.all')}</SelectItem>
                            <SelectItem value="urgent">{t('priority.urgent')}</SelectItem>
                            <SelectItem value="high">{t('priority.high')}</SelectItem>
                            <SelectItem value="medium">{t('priority.medium')}</SelectItem>
                            <SelectItem value="low">{t('priority.low')}</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => fetchAdminSupport()}
                        disabled={isLoading}
                        title={t('filter.refresh')}
                    >
                        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Table */}
            <Card className="overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Headset className="h-5 w-5 text-cyan-500" />
                        {t('title')}
                    </CardTitle>
                </CardHeader>
                <div className="overflow-x-auto px-3">
                    <Table>
                        <TableHeader className="bg-secondary">
                            <TableRow>
                                <TableHead>{t('table.user')}</TableHead>
                                <TableHead>{t('table.subject')}</TableHead>
                                <TableHead className="hidden md:table-cell">{t('table.category')}</TableHead>
                                <TableHead>{t('table.status')}</TableHead>
                                <TableHead className="hidden sm:table-cell">{t('table.priority')}</TableHead>
                                <TableHead className="hidden lg:table-cell">{t('table.created')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow
                                        key={i}
                                        className="animate-in fade-in slide-in-from-left-4"
                                        style={{ animationDelay: `${i * 80}ms` }}
                                    >
                                        <TableCell>
                                            <div className="space-y-1">
                                                <Skeleton className="h-4 w-32" />
                                                <Skeleton className="h-3 w-40" />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <Skeleton className="h-4 w-48" />
                                                <Skeleton className="h-3 w-36" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <Skeleton className="h-6 w-28 rounded-full" />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Skeleton className="h-4 w-4 rounded" />
                                                <Skeleton className="h-6 w-24 rounded-full" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <Skeleton className="h-6 w-20 rounded-full" />
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            <div className="space-y-1">
                                                <Skeleton className="h-3 w-24" />
                                                <Skeleton className="h-3 w-20" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : filteredTickets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                        {t('table.no_tickets')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedTickets.map((ticket, index) => {
                                    const statusConfig = getStatusConfig(ticket.status)
                                    const StatusIcon = statusConfig.icon
                                    const priorityConfig = getPriorityConfig(ticket.priority)

                                    return (
                                        <TableRow
                                            key={ticket.id}
                                            className="hover:bg-accent/50 dark:hover:bg-accent/10 transition-colors animate-in fade-in slide-in-from-left-4 cursor-pointer"
                                            style={{ animationDelay: `${index * 30}ms` }}
                                            onClick={() => handleViewTicket(ticket)}
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="bg-cyan-500/10 text-cyan-600 text-xs">
                                                            {ticket.user?.name?.charAt(0) || ticket.email?.charAt(0) || 'U'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <p className="font-medium truncate text-sm">{ticket.user?.name || 'N/A'}</p>
                                                        <p className="text-xs text-muted-foreground truncate max-w-37.5">{ticket.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-50 lg:max-w-75">
                                                    <p className="font-medium truncate">{ticket.subject}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{ticket.description}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <Badge variant="outline">{formatCategory(ticket.category)}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`${statusConfig.color} flex items-center gap-1 border w-fit`}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    <span className="hidden sm:inline">{statusConfig.label}</span>
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                <Badge className={`${priorityConfig.color} border`}>
                                                    {priorityConfig.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                                                {formatDate(new Date(ticket.created_at))}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Pagination */}
            {totalItems > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    startIndex={startIndex}
                    endIndex={Math.min(endIndex, totalItems)}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                    itemLabel={tCommon('tickets')}
                />
            )}

            {/* Ticket Detail Sheet */}
            <TicketDetailSheet
                ticket={selectedTicket}
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                onStatusUpdate={handleStatusUpdate}
                onReply={handleReply}
                isUpdatingStatus={isUpdatingStatus}
                isSendingReply={isSendingReply}
            />
        </div>
    )
}
