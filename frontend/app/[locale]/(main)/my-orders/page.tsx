'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger
} from '@/components/ui/tooltip';
import {
    Package,
    Search,
    Filter,
    Eye,
    Server,
    Calendar,
    CreditCard,
    CheckCircle,
    XCircle,
    AlertCircle,
    Loader,
    CircleDashed,
    PackageSearch,
    BookmarkCheck,
    BanknoteX
} from 'lucide-react';

// Types
interface OrderItem {
    planName: string;
    duration: number;
    price: number;
    specifications: string;
}

interface Order {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    totalAmount: number;
    createdAt: string;
    items: OrderItem[];
}

// Mock data - replace with actual API data
const mockOrders: Order[] = [
    {
        id: '1',
        orderNumber: 'VPS-2024-001',
        status: 'completed',
        paymentStatus: 'paid',
        totalAmount: 500,
        createdAt: '2024-03-15T10:30:00Z',
        items: [
            {
                planName: 'VPS Pro Plan',
                duration: 3,
                price: 500,
                specifications: '4 CPU, 8GB RAM, 100GB SSD'
            }
        ]
    },
    {
        id: '2',
        orderNumber: 'VPS-2024-002',
        status: 'processing',
        paymentStatus: 'paid',
        totalAmount: 200,
        createdAt: '2024-03-14T14:15:00Z',
        items: [
            {
                planName: 'VPS Starter Plan',
                duration: 1,
                price: 200,
                specifications: '1 CPU, 1GB RAM, 20GB SSD'
            }
        ]
    },
    {
        id: '3',
        orderNumber: 'VPS-2024-003',
        status: 'pending',
        paymentStatus: 'pending',
        totalAmount: 1000,
        createdAt: '2024-03-13T09:00:00Z',
        items: [
            {
                planName: 'VPS Enterprise Plan',
                duration: 6,
                price: 1000,
                specifications: '8 CPU, 16GB RAM, 200GB SSD'
            }
        ]
    },
    {
        id: '4',
        orderNumber: 'VPS-2024-004',
        status: 'cancelled',
        paymentStatus: 'failed',
        totalAmount: 300,
        createdAt: '2024-03-12T16:45:00Z',
        items: [
            {
                planName: 'VPS Standard Plan',
                duration: 2,
                price: 300,
                specifications: '2 CPU, 4GB RAM, 50GB SSD'
            }
        ]
    }
];

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'completed':
            return <CheckCircle className="h-4 w-4 text-green-600" />;
        case 'processing':
            return <Loader className="h-4 w-4 text-blue-600 animate-spin" />;
        case 'pending':
            return <AlertCircle className="h-4 w-4 text-yellow-600" />;
        case 'cancelled':
            return <XCircle className="h-4 w-4 text-red-600" />;
        default:
            return <Package className="h-4 w-4" />;
    }
};

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'completed':
            return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
        case 'processing':
            return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Processing</Badge>;
        case 'pending':
            return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
        case 'cancelled':
            return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelled</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
};

const getPaymentStatusBadge = (status: string) => {
    switch (status) {
        case 'paid':
            return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
        case 'pending':
            return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending Payment</Badge>;
        case 'failed':
            return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Payment Failed</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
};

const MyOrdersPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const filteredOrders = mockOrders.filter(order => {
        const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.items.some(item => item.planName.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const OrderCard = ({ order }: { order: Order }) => (
        <Card key={order.id} className="mb-4 border border-accent">
            <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        {getStatusIcon(order.status)}
                        <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                        {getStatusBadge(order.status)}

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedOrder(order)}
                                >
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="text-sm">View Details</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-muted-foreground">Order Date</p>
                            <p className="font-medium">
                                {new Date(order.createdAt).toLocaleDateString('en-US')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Server className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-muted-foreground">Service Plan</p>
                            <p className="font-medium">{order.items[0].planName}</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-muted-foreground">Payment</p>
                            {getPaymentStatusBadge(order.paymentStatus)}
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <div>
                            <p className="text-muted-foreground">Total Amount</p>
                            <p className="font-semibold text-lg">
                                ${order.totalAmount.toLocaleString('en-US')}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="min-h-screen max-w-7xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">My Orders</h1>
                <p className="text-muted-foreground mt-2">
                    Manage and track all your VPS orders
                </p>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by order number or plan name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 dark:border-gray-700"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48 dark:border-gray-700">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="pending">
                            <CircleDashed className="text-amber-500 dark:text-amber-400" />
                            Pending
                        </SelectItem>
                        <SelectItem value="processing">
                            <PackageSearch className="text-blue-500 dark:text-blue-400" />
                            Processing
                        </SelectItem>
                        <SelectItem value="completed">
                            <BookmarkCheck className="text-green-500 dark:text-green-400" />
                            Completed
                        </SelectItem>
                        <SelectItem value="cancelled">
                            <BanknoteX className="text-red-500 dark:text-red-400" />
                            Cancelled
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
                {filteredOrders.length > 0 ? (
                    filteredOrders.map(order => <OrderCard key={order.id} order={order} />)
                ) : (
                    <div className="text-center py-12">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium">No orders found</h3>
                        <p className="text-muted-foreground">
                            Try changing filters or search terms
                        </p>
                    </div>
                )}
            </div>

            {/* Order Detail Modal */}
            <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            {selectedOrder?.orderNumber}
                        </DialogTitle>
                        <DialogDescription>
                            Detailed information about the order and payment status
                        </DialogDescription>
                    </DialogHeader>

                    {selectedOrder && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Order Status</p>
                                    {getStatusBadge(selectedOrder.status)}
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Payment Status</p>
                                    {getPaymentStatusBadge(selectedOrder.paymentStatus)}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Order Date</p>
                                    <p className="font-medium">
                                        {new Date(selectedOrder.createdAt).toLocaleString('en-US')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Amount</p>
                                    <p className="font-semibold text-lg">
                                        ${selectedOrder.totalAmount.toLocaleString('en-US')}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-3">Ordered Products</h4>
                                {selectedOrder.items.map((item: OrderItem, index: number) => (
                                    <div key={index} className="border border-dashed border-accent rounded-lg p-4 space-y-2">
                                        <h5 className="font-semibold">{item.planName}</h5>

                                        <p className="text-sm text-muted-foreground">
                                            {item.specifications}
                                        </p>

                                        <p className="text-sm text-muted-foreground">
                                            Duration: {item.duration} months
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {selectedOrder.status === 'pending' && (
                                <Button className="w-full mt-4">
                                    Pay Now
                                </Button>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MyOrdersPage;