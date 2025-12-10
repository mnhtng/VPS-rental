'use client';

import React, { useState } from 'react';
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
    Calendar
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SupportTicket } from '@/types/types';

// Mock data
const mockTickets: SupportTicket[] = [
    {
        id: 'TKT-001',
        subject: 'Cannot access VPS after payment',
        description: 'I have completed payment but still cannot access my VPS instance.',
        contact: {
            email: 'user1@example.com',
            phone: '+84 912 345 678'
        },
        status: 'in-progress',
        priority: 'high',
        category: 'Technical',
        created_at: '2025-10-05T10:30:00',
        updated_at: '2025-10-07T15:20:00',
        messages: []
    },
    {
        id: 'TKT-002',
        subject: 'Request for plan upgrade',
        description: 'I would like to upgrade from Basic plan to Premium plan.',
        contact: {
            email: 'user2@example.com',
            phone: '+84 987 654 321'
        },
        status: 'open',
        priority: 'medium',
        category: 'Billing',
        created_at: '2025-10-07T09:15:00',
        updated_at: '2025-10-07T09:15:00',
        messages: []
    },
    {
        id: 'TKT-003',
        subject: 'Server performance issue',
        description: 'My VPS is running very slow, please check.',
        contact: {
            email: 'user3@example.com',
            phone: '+84 901 234 567'
        },
        status: 'resolved',
        priority: 'high',
        category: 'Technical',
        created_at: '2025-10-01T14:00:00',
        updated_at: '2025-10-03T16:45:00',
        messages: []
    },
    {
        id: 'TKT-004',
        subject: 'Question about backup policy',
        description: 'How often are automatic backups performed?',
        contact: {
            email: 'user4@example.com',
            phone: '+84 909 876 543'
        },
        status: 'closed',
        priority: 'low',
        category: 'General',
        created_at: '2025-09-28T11:20:00',
        updated_at: '2025-09-29T10:00:00',
        messages: []
    }
];

const MyTicketsPage = () => {
    const [tickets, setTickets] = useState<SupportTicket[]>(mockTickets);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterPriority, setFilterPriority] = useState<string>('all');
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    // New ticket form state
    const [newTicket, setNewTicket] = useState({
        subject: '',
        description: '',
        phone: '',
        category: 'Technical',
        priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent'
    });

    // Filter tickets
    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
        const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
        return matchesSearch && matchesStatus && matchesPriority;
    });

    // Get status badge
    const getStatusBadge = (status: string) => {
        const statusConfig = {
            open: { icon: AlertCircle, color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
            'in-progress': { icon: Clock, color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
            resolved: { icon: CheckCircle2, color: 'bg-green-500/10 text-green-500 border-green-500/20' },
            closed: { icon: XCircle, color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' }
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        const Icon = config.icon;
        return (
            <Badge className={`${config.color} flex items-center gap-1 border`}>
                <Icon className="h-3 w-3" />
                {status.replace('-', ' ')}
            </Badge>
        );
    };

    // Get priority badge
    const getPriorityBadge = (priority: string) => {
        const priorityConfig = {
            low: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
            medium: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
            high: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
            urgent: 'bg-red-500/10 text-red-600 border-red-500/20'
        };
        return (
            <Badge className={`${priorityConfig[priority as keyof typeof priorityConfig]} border`}>
                {priority}
            </Badge>
        );
    };

    // Handle create ticket
    const handleCreateTicket = () => {
        const ticket: SupportTicket = {
            id: `TKT-${String(tickets.length + 1).padStart(3, '0')}`,
            subject: newTicket.subject,
            description: newTicket.description,
            contact: {
                email: '', // Email will be auto-filled from user session
                phone: newTicket.phone
            },
            category: newTicket.category,
            priority: newTicket.priority,
            status: 'open',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            messages: []
        };
        setTickets([ticket, ...tickets]);
        setIsCreateDialogOpen(false);
        setNewTicket({
            subject: '',
            description: '',
            phone: '',
            category: 'Technical',
            priority: 'medium'
        });
    };

    // Group tickets by status
    const ticketsByStatus = {
        all: filteredTickets,
        open: filteredTickets.filter(t => t.status === 'open'),
        'in-progress': filteredTickets.filter(t => t.status === 'in-progress'),
        resolved: filteredTickets.filter(t => t.status === 'resolved'),
        closed: filteredTickets.filter(t => t.status === 'closed')
    };

    return (
        <div className="min-h-screen max-w-7xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Ticket className="h-8 w-8 text-primary" />
                        My Support Tickets
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Track and manage your support tickets
                    </p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="lg" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Create New Ticket
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Create Support Ticket</DialogTitle>
                            <DialogDescription>
                                Describe your issue and we&apos;ll get back to you as soon as possible.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="ticket-title">Title *</Label>
                                <Input
                                    id="ticket-title"
                                    placeholder="Brief description of your issue"
                                    value={newTicket.subject}
                                    onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ticket-phone">Phone Number *</Label>
                                <Input
                                    id="ticket-phone"
                                    type="tel"
                                    placeholder="+84 912 345 678"
                                    value={newTicket.phone}
                                    onChange={(e) => setNewTicket({ ...newTicket, phone: e.target.value })}
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
                                            <SelectItem value="Technical">Technical</SelectItem>
                                            <SelectItem value="Billing">Billing</SelectItem>
                                            <SelectItem value="General">General</SelectItem>
                                            <SelectItem value="Account">Account</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ticket-priority">Priority</Label>
                                    <Select
                                        value={newTicket.priority}
                                        onValueChange={(value) => setNewTicket({ ...newTicket, priority: value as 'low' | 'medium' | 'high' | 'urgent' })}
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
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreateTicket}
                                disabled={!newTicket.subject || !newTicket.description || !newTicket.phone}
                            >
                                Create Ticket
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row gap-4 my-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tickets by ID or title..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full md:w-[180px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-full md:w-[180px]">
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
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Open</p>
                                <p className="text-2xl font-bold">{ticketsByStatus.open.length}</p>
                            </div>
                            <AlertCircle className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">In Progress</p>
                                <p className="text-2xl font-bold">{ticketsByStatus['in-progress'].length}</p>
                            </div>
                            <Clock className="h-8 w-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Resolved</p>
                                <p className="text-2xl font-bold">{ticketsByStatus.resolved.length}</p>
                            </div>
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total</p>
                                <p className="text-2xl font-bold">{tickets.length}</p>
                            </div>
                            <Ticket className="h-8 w-8 text-primary" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tickets Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Ticket List</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">ID</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead className="w-[120px]">Created</TableHead>
                                    <TableHead className="w-[80px]">Replies</TableHead>
                                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTickets.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                                            No tickets found. Create your first ticket to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTickets.map((ticket) => (
                                        <TableRow key={ticket.id} className="hover:bg-muted/50">
                                            <TableCell className="font-mono font-medium">{ticket.id}</TableCell>
                                            <TableCell>
                                                <div className="max-w-md">
                                                    <p className="font-medium truncate">{ticket.subject}</p>
                                                    <p className="text-sm text-muted-foreground truncate">{ticket.description}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{ticket.category}</Badge>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                                            <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(ticket.created_at).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                                    <span>{ticket.messages.length}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedTicket(ticket)}
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

            {/* Ticket Detail Dialog */}
            <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    {selectedTicket && (
                        <>
                            <DialogHeader>
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <DialogTitle className="text-2xl">{selectedTicket.subject}</DialogTitle>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm text-muted-foreground">{selectedTicket.id}</span>
                                            {getStatusBadge(selectedTicket.status)}
                                            {getPriorityBadge(selectedTicket.priority)}
                                            <Badge variant="outline">{selectedTicket.category}</Badge>
                                        </div>
                                    </div>
                                </div>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div>
                                    <h4 className="font-semibold mb-2">Description</h4>
                                    <p className="text-muted-foreground">{selectedTicket.description}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Phone Number:</span>
                                        <p className="font-medium">{selectedTicket.contact.phone}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Category:</span>
                                        <p className="font-medium">{selectedTicket.category}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Created:</span>
                                        <p className="font-medium">{new Date(selectedTicket.created_at).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Last Updated:</span>
                                        <p className="font-medium">{new Date(selectedTicket.updated_at).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-3">Conversation ({selectedTicket.messages.length} replies)</h4>
                                    <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                                        <p className="text-sm text-muted-foreground text-center">
                                            Conversation history will be displayed here
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MyTicketsPage;
