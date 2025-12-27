'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Ticket,
    Search,
    Filter,
    Plus,
    MessageSquare,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Eye,
    Calendar,
    Send,
    Loader,
    RefreshCw,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
    SupportTicket,
    TicketStatistics,
    TicketReply,
} from '@/types/types';
import useSupport from '@/hooks/useSupport';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import SupportPlaceholder from '@/components/custom/placeholder/support';
import Pagination from '@/components/ui/pagination';
import { formatDateTime } from '@/utils/string';

const MyTicketsPage = () => {
    const {
        createTicket,
        getTickets,
        getTicketStatistics,
        addReply,
    } = useSupport();

    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [statistics, setStatistics] = useState<TicketStatistics | null>(null);
    const [selectedTicketData, setSelectedTicketData] = useState<SupportTicket | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterPriority, setFilterPriority] = useState<string>('all');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isSendingReply, setIsSendingReply] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [newTicket, setNewTicket] = useState({
        subject: '',
        description: '',
        phone: '',
        category: 'technical_support',
        priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    });
    const [replyMessage, setReplyMessage] = useState('');

    const fetchTickets = async (signal?: AbortSignal) => {
        try {
            setIsLoading(true);

            const [ticketsData, statsData] = await Promise.all([
                getTickets(
                    {
                        status: filterStatus !== 'all' ? filterStatus : undefined,
                        priority: filterPriority !== 'all' ? filterPriority : undefined,
                    },
                    signal
                ),
                getTicketStatistics(signal),
            ]);

            if (signal?.aborted) return;

            if (ticketsData.error || statsData.error) {
                toast.error(ticketsData?.message || statsData?.message, {
                    description: ticketsData?.error?.detail || statsData?.error?.detail,
                });
            } else {
                setTickets(ticketsData.data || []);
                setStatistics(statsData.data || null);
                setNewTicket(prev => ({ ...prev, phone: ticketsData.data && ticketsData.data.length > 0 && ticketsData.data[0].phone ? ticketsData.data[0].phone : prev.phone }));

            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') return;

            toast.error('Failed to load tickets', {
                description: "Please try again later"
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const controller = new AbortController();

        fetchTickets(controller.signal);

        return () => {
            controller.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterPriority, filterStatus]);

    const filteredTickets = tickets.filter((ticket) => {
        const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesSearch;
    });

    // Pagination calculations
    const totalItems = filteredTickets.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            open: { icon: AlertCircle, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
            in_progress: { icon: Clock, color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
            resolved: { icon: CheckCircle2, color: 'bg-green-500/10 text-green-500 border-green-500/20' },
            closed: { icon: XCircle, color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
        const Icon = config.icon;
        return (
            <Badge className={`${config.color} flex items-center gap-1 border`}>
                <Icon className="h-3 w-3" />
                {status.replace('_', ' ')}
            </Badge>
        );
    };

    const getPriorityBadge = (priority: string) => {
        const priorityConfig = {
            low: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
            medium: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
            high: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
            urgent: 'bg-red-500/10 text-red-600 border-red-500/20',
        };
        return (
            <Badge className={`${priorityConfig[priority as keyof typeof priorityConfig]} border`}>
                {priority}
            </Badge>
        );
    };

    const handleCreateTicket = async () => {
        if (!newTicket.subject || !newTicket.description || !newTicket.phone) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setIsCreating(true);

            const result = await createTicket({
                subject: newTicket.subject,
                description: newTicket.description,
                category: newTicket.category,
                priority: newTicket.priority,
                phone: newTicket.phone.replace(/\D/g, ''), // Remove non-digits
            });

            if (result.error) {
                toast.error(result.message, {
                    description: result.error.detail,
                });
            } else {
                toast.success('Ticket created successfully');
                setIsCreateDialogOpen(false);

                setNewTicket({
                    subject: '',
                    description: '',
                    phone: '',
                    category: 'technical_support',
                    priority: 'medium',
                });

                fetchTickets();
            }
        } catch {
            toast.error('Failed to create ticket', {
                description: "Please try again later"
            });
        } finally {
            setIsCreating(false);
        }
    };

    const handleViewTicket = async (ticketId: string) => {
        setIsDetailDialogOpen(true);
        setSelectedTicketData(tickets.find((t) => t.id === ticketId) || null);
    };

    const handleSendReply = async () => {
        if (!selectedTicketData || !replyMessage.trim()) return;

        try {
            setIsSendingReply(true);

            const result = await addReply(selectedTicketData.id, replyMessage);

            if (result.error) {
                toast.error(result.message, {
                    description: result.error.detail,
                });
            } else {
                toast.success('Reply sent successfully');
                setReplyMessage('');
                setSelectedTicketData(result.data);
            }
        } catch {
            toast.error('Failed to send reply', {
                description: "Please try again later"
            });
        } finally {
            setIsSendingReply(false);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus, filterPriority]);

    const formatCategory = (category: string) => {
        return category
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <div className="min-h-screen max-w-7xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="animate-in fade-in slide-in-from-left-4" style={{ animationDelay: '100ms' }}>
                    <h1 className="text-3xl font-bold">
                        My Support Tickets
                    </h1>
                    <p className="text-muted-foreground mt-2">Track and manage your support tickets</p>
                </div>
                <div className="flex gap-2 animate-in fade-in slide-in-from-right-4" style={{ animationDelay: '200ms' }}>
                    <Button variant="outline" size="lg" onClick={() => fetchTickets()} disabled={isLoading} className="hover:scale-105 transition-all">
                        <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
                        Refresh
                    </Button>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="lg" className="gap-2 hover:scale-105 transition-all">
                                <Plus className="h-4 w-4" />
                                Create New Ticket
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] py-8 flex overflow-hidden">
                            <ScrollArea className="flex-1 px-3 lg:px-0 overflow-y-auto">
                                <DialogHeader className="shrink-0">
                                    <DialogTitle className="text-xl">Create Support Ticket</DialogTitle>
                                    <DialogDescription>
                                        Describe your issue and we&apos;ll get back to you as soon as possible.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 px-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="ticket-title">Title *</Label>
                                        <Input
                                            id="ticket-title"
                                            placeholder="Brief description of your issue"
                                            value={newTicket.subject}
                                            onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                                            className="transition-all focus:scale-[1.01]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="ticket-phone">Phone Number *</Label>
                                        <Input
                                            id="ticket-phone"
                                            type="tel"
                                            placeholder="0912345678"
                                            value={newTicket.phone}
                                            onChange={(e) => setNewTicket({ ...newTicket, phone: e.target.value })}
                                            className="transition-all focus:scale-[1.01]"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            We will contact you via this phone number for urgent updates
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="ticket-category">Category</Label>
                                            <Select
                                                value={newTicket.category}
                                                onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}
                                            >
                                                <SelectTrigger id="ticket-category">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="technical_support">Technical Support</SelectItem>
                                                    <SelectItem value="payment">Payment</SelectItem>
                                                    <SelectItem value="server_issue">Server Issue</SelectItem>
                                                    <SelectItem value="performance">Performance</SelectItem>
                                                    <SelectItem value="security">Security</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="ticket-priority">Priority</Label>
                                            <Select
                                                value={newTicket.priority}
                                                onValueChange={(value) =>
                                                    setNewTicket({
                                                        ...newTicket,
                                                        priority: value as 'low' | 'medium' | 'high' | 'urgent',
                                                    })
                                                }
                                            >
                                                <SelectTrigger id="ticket-priority">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="low">Low</SelectItem>
                                                    <SelectItem value="medium">Medium</SelectItem>
                                                    <SelectItem value="high">High</SelectItem>
                                                    <SelectItem value="urgent">Urgent</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="ticket-description">Description *</Label>
                                        <Textarea
                                            id="ticket-description"
                                            placeholder="Provide detailed information about your issue..."
                                            rows={6}
                                            value={newTicket.description}
                                            onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                            className="transition-all focus:scale-[1.01]"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 shrink-0 pt-4">
                                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="hover:scale-105 transition-all">
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleCreateTicket}
                                        disabled={!newTicket.subject || !newTicket.description || !newTicket.phone || isCreating}
                                        className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 transition-all"
                                    >
                                        {isCreating ? (
                                            <>
                                                <Loader className="h-4 w-4 mr-2 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            'Create Ticket'
                                        )}
                                    </Button>
                                </div>
                            </ScrollArea>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row gap-4 my-6 animate-in fade-in slide-in-from-top-4" style={{ animationDelay: '300ms' }}>
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tickets by title..."
                        className="pl-10 transition-all focus:scale-[1.01]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full md:w-45">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-full md:w-45">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '0ms' }}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Open</p>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-12" />
                                ) : (
                                    <p className="text-2xl font-bold">{statistics?.open || 0}</p>
                                )}
                            </div>
                            <AlertCircle className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '50ms' }}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">In Progress</p>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-12" />
                                ) : (
                                    <p className="text-2xl font-bold">{statistics?.in_progress || 0}</p>
                                )}
                            </div>
                            <Clock className="h-8 w-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '100ms' }}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Resolved</p>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-12" />
                                ) : (
                                    <p className="text-2xl font-bold">{statistics?.resolved || 0}</p>
                                )}
                            </div>
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '150ms' }}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total</p>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-12" />
                                ) : (
                                    <p className="text-2xl font-bold">{statistics?.total || 0}</p>
                                )}
                            </div>
                            <Ticket className="h-8 w-8 text-primary" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tickets Table */}
            <Card className="animate-in fade-in slide-in-from-left-4 duration-500">
                <CardHeader>
                    <CardTitle>Ticket List</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-25">ID</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead className="w-30">Created</TableHead>
                                    <TableHead className="w-25 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <SupportPlaceholder />
                                ) : filteredTickets.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                            No tickets found. Create your first ticket to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedTickets.map((ticket, index) => (
                                        <TableRow key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-all hover:shadow-sm animate-in fade-in slide-in-from-left-4" style={{ animationDelay: `${index * 50}ms` }}>
                                            <TableCell className="font-mono font-medium text-xs truncate max-w-25">
                                                {ticket.id}
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-md">
                                                    <p className="font-medium truncate">{ticket.subject}</p>
                                                    <p className="text-sm text-muted-foreground truncate">
                                                        {ticket.description}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{formatCategory(ticket.category)}</Badge>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                                            <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDateTime(new Date(ticket.created_at))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewTicket(ticket.id)}
                                                    className="hover:bg-blue-50 hover:text-blue-600 hover:scale-110 transition-all"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalItems > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    startIndex={startIndex}
                    endIndex={endIndex}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                    itemLabel="tickets"
                />
            )}

            {/* Ticket Detail Dialog */}
            <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                    {selectedTicketData ? (
                        <>
                            <DialogHeader className="shrink-0">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <DialogTitle className="text-2xl">
                                            {selectedTicketData.subject}
                                        </DialogTitle>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-mono text-xs text-muted-foreground">
                                                {selectedTicketData.id}
                                            </span>
                                            {getStatusBadge(selectedTicketData.status)}
                                            {getPriorityBadge(selectedTicketData.priority)}
                                            <Badge variant="outline">
                                                {formatCategory(selectedTicketData.category)}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </DialogHeader>
                            <ScrollArea className="flex-1 overflow-y-auto">
                                <div className="space-y-4 py-2">
                                    <div className="grid grid-cols-2 gap-4 text-sm pb-3 border-b">
                                        <div>
                                            <span className="text-muted-foreground">Phone Number:</span>
                                            <p className="font-medium">{selectedTicketData.phone}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Email:</span>
                                            <p className="font-medium">{selectedTicketData.email}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Created:</span>
                                            <p className="font-medium">
                                                {new Date(selectedTicketData.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Last Updated:</span>
                                            <p className="font-medium">
                                                {new Date(selectedTicketData.updated_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Conversation */}
                                    <div className="space-y-3">
                                        <h4 className="font-semibold flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4" />
                                            Conversation ({(selectedTicketData.replies?.length || 0) + 1} messages)
                                        </h4>
                                        <div className="border rounded-lg p-4 bg-muted/30 max-h-70 overflow-y-auto">
                                            <div className="space-y-4">
                                                {/* Initial message from user */}
                                                <div className="w-[85%] flex gap-3 flex-row-reverse ml-auto">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="bg-muted">
                                                            {selectedTicketData.user?.name?.charAt(0) || selectedTicketData.email?.charAt(0) || 'U'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 rounded-lg p-3 bg-muted ml-8">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-sm font-medium">
                                                                {selectedTicketData.user?.name || 'You'}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {new Date(selectedTicketData.created_at).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm whitespace-pre-wrap">{selectedTicketData.description}</p>
                                                    </div>
                                                </div>

                                                {/* Replies */}
                                                {selectedTicketData.replies && selectedTicketData.replies.length > 0 && (
                                                    <>
                                                        {selectedTicketData.replies.map((reply: TicketReply) => {
                                                            const isAdmin = reply.message.sender.role === 'ADMIN';
                                                            return (
                                                                <div
                                                                    key={reply.id}
                                                                    className={cn(
                                                                        'w-[85%] flex gap-3',
                                                                        isAdmin ? 'flex-row mr-auto' : 'flex-row-reverse ml-auto'
                                                                    )}
                                                                >
                                                                    <Avatar className="h-8 w-8">
                                                                        <AvatarFallback
                                                                            className={cn(
                                                                                isAdmin
                                                                                    ? 'bg-primary text-primary-foreground'
                                                                                    : 'bg-muted'
                                                                            )}
                                                                        >
                                                                            {isAdmin
                                                                                ? 'S'
                                                                                : reply.message.sender.name?.charAt(0) || 'U'}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div
                                                                        className={cn(
                                                                            'flex-1 rounded-lg p-3',
                                                                            isAdmin
                                                                                ? 'bg-primary/10 mr-8'
                                                                                : 'bg-muted ml-8'
                                                                        )}
                                                                    >
                                                                        <div className="flex items-center justify-between mb-1">
                                                                            <span className="text-sm font-medium">
                                                                                {isAdmin
                                                                                    ? 'Support Team'
                                                                                    : reply.message.sender.name}
                                                                            </span>
                                                                            <span className="text-xs text-muted-foreground">
                                                                                {formatDateTime(new Date(reply.created_at))}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-sm whitespace-pre-wrap">{reply.message.content.text}</p>
                                                                        {reply.message.attachments.length > 0 && (
                                                                            <div className="mt-2 space-y-1">
                                                                                {reply.message.attachments.map((attachment) => (
                                                                                    <a
                                                                                        key={attachment.id}
                                                                                        href={attachment.url}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="flex items-center gap-2 text-xs text-primary hover:underline"
                                                                                    >
                                                                                        <span>📎 {attachment.name}</span>
                                                                                        <span className="text-muted-foreground">
                                                                                            ({(attachment.size / 1024).toFixed(1)} KB)
                                                                                        </span>
                                                                                    </a>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Reply Input */}
                                    {selectedTicketData.status !== 'closed' && (
                                        <div className="space-y-2 pt-2 px-1">
                                            <Textarea
                                                placeholder="Type your message..."
                                                value={replyMessage}
                                                onChange={(e) => setReplyMessage(e.target.value)}
                                                className="resize-none"
                                                rows={2}
                                            />
                                            <Button
                                                onClick={handleSendReply}
                                                disabled={!replyMessage.trim() || isSendingReply}
                                                className="w-full"
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
                        </>
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MyTicketsPage;
