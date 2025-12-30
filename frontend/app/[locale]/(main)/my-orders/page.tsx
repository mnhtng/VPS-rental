'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
    Loader,
    CircleDashed,
    BookmarkCheck,
    BanknoteX,
    Smartphone,
    Shield,
    AlertTriangle,
    RefreshCw
} from 'lucide-react';
import { Order, OrderItemDetail } from '@/types/types';
import useMember from '@/hooks/useMember';
import usePayment from '@/hooks/usePayment';
import { toast } from 'sonner';
import { formatDateTime } from '@/utils/string';
import { formatPrice } from '@/utils/currency';
import { ScrollArea } from '@/components/ui/scroll-area';
import MyOrderPlaceholder from '@/components/custom/placeholder/my-order';
import { cn } from '@/lib/utils';
import Pagination from '@/components/ui/pagination';
import { useTranslations } from "next-intl";
import { getDiskSize } from '@/utils/string';

const MyOrdersPage = () => {
    const t = useTranslations('my_orders');
    const tCommon = useTranslations('common');
    const { getOrders } = useMember();
    const { checkCanRepay, repayOrder } = usePayment();

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Payment dialog state
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [orderToRepay, setOrderToRepay] = useState<Order | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'momo' | 'vnpay'>('momo');
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [canRepayStatus, setCanRepayStatus] = useState<{ can_repay: boolean; reason?: string } | null>(null);
    const [isCheckingRepay, setIsCheckingRepay] = useState(false);

    // Animation control - only animate on first load
    const [hasAnimated, setHasAnimated] = useState(false);

    const fetchOrders = async (signal?: AbortSignal) => {
        setIsLoading(true);

        try {
            const result = await getOrders(signal);

            if (signal?.aborted) return;

            if (result.error) {
                toast.error(result.message, {
                    description: result.error.detail,
                });
            } else {
                setOrders(result.data || []);
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') return;

            toast.error(t('toast.error_fetching'), {
                description: t('toast.try_again'),
            });
        } finally {
            if (!signal?.aborted) {
                setIsLoading(false);

                // Enable animations only on first load
                if (!hasAnimated) {
                    setTimeout(() => {
                        setHasAnimated(true);
                    }, 1000);
                }
            }
        }
    };

    useEffect(() => {
        const controller = new AbortController();

        fetchOrders(controller.signal);

        return () => {
            controller.abort();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'paid':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'pending':
                return <Loader className="h-4 w-4 text-yellow-600 animate-spin" />;
            case 'cancelled':
                return <XCircle className="h-4 w-4 text-red-600" />;
            default:
                return <Package className="h-4 w-4" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{t('status.paid')}</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{t('status.pending')}</Badge>;
            case 'cancelled':
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{t('status.cancelled')}</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getPaymentStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{t('status.paid')}</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{t('status.pending_payment')}</Badge>;
            case 'failed':
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{t('status.payment_failed')}</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const formatSpecifications = (item: OrderItemDetail): string => {
        const config = item.configuration;
        if (!config) return 'N/A';
        return `${config.vcpu} CPU, ${config.ram_gb} GB RAM, ${getDiskSize(config.storage_gb, config.storage_type)}`;
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase())
            || order.order_items.some((item: OrderItemDetail) =>
                item.configuration.plan_name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            || order.order_items.some((item: OrderItemDetail) =>
                item.hostname.toLowerCase().includes(searchTerm.toLowerCase())
            );
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Pagination calculations
    const totalItems = filteredOrders.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    const handlePayNowClick = async (order: Order) => {
        setOrderToRepay(order);
        setShowPaymentDialog(true);
        setIsCheckingRepay(true);
        setCanRepayStatus(null);

        try {
            const result = await checkCanRepay(order.id);

            if (result.error) {
                setCanRepayStatus({
                    can_repay: false,
                    reason: result.error.detail,
                });
            } else {
                setCanRepayStatus(result.data);
            }
        } catch {
            setCanRepayStatus({ can_repay: false, reason: t('toast.check_failed') });
        } finally {
            setIsCheckingRepay(false);
        }
    };

    const handleProcessPayment = async () => {
        if (!orderToRepay) return;

        setIsProcessingPayment(true);

        try {
            const returnUrl = `${window.location.origin}/checkout/${paymentMethod}-return`;

            const result = await repayOrder(
                orderToRepay.order_number,
                orderToRepay.price,
                orderToRepay.billing_phone || '',
                orderToRepay.billing_address || '',
                returnUrl,
                paymentMethod
            );

            if (result.error) {
                toast.error(t('toast.payment_failed'), {
                    description: result.error.detail,
                });
            }

            // If successful, user will be redirected to payment gateway
        } catch {
            toast.error(t('toast.payment_failed'), {
                description: t('toast.try_again'),
            });
        } finally {
            setIsProcessingPayment(false);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    const OrderCard = ({ order, index }: { order: Order; index: number }) => (
        <Card
            key={order.id}
            className={`mb-4 border border-accent hover:shadow-lg hover:scale-[1.01] transition-all duration-300 ${!hasAnimated ? 'animate-in fade-in slide-in-from-bottom' : ''
                }`}
            style={!hasAnimated ? { animationDelay: `${index * 50}ms`, animationDuration: '500ms' } : undefined}
        >
            <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        {getStatusIcon(order.status)}
                        <h3 className="font-semibold text-lg">{order.order_number}</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                        {getStatusBadge(order.status)}

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedOrder(order)}
                                    className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900 dark:hover:text-blue-400 transition-all duration-200 hover:scale-110"
                                >
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="text-sm">{t('card.view_details')}</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-muted-foreground">{t('card.order_date')}</p>
                            <p className="font-medium">
                                {formatDateTime(new Date(order.created_at))}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Server className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-muted-foreground">{t('card.payment_method')}</p>
                            <p className="font-medium">
                                {order.payment_method || 'N/A'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="text-muted-foreground">{t('card.payment_status')}</p>
                            {getPaymentStatusBadge(order.payment_status || 'pending')}
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <div>
                            <p className="text-muted-foreground">{t('card.total_amount')}</p>
                            <p className="font-semibold text-lg">
                                {formatPrice(order.price)}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    if (isLoading) {
        return (
            <MyOrderPlaceholder />
        );
    }

    return (
        <div className="min-h-screen max-w-7xl mx-auto py-8 px-4">
            <div className={`flex justify-between items-center mb-8 duration-700 ${!hasAnimated && 'animate-in fade-in slide-in-from-top'}`}>
                <div>
                    <h1 className="text-3xl font-bold">{t('header.title')}</h1>
                    <p className="text-muted-foreground mt-2">
                        {t('header.subtitle')}
                    </p>
                </div>

                <Button variant="outline" size="lg" onClick={() => fetchOrders()} disabled={isLoading}>
                    <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
                    {t('header.refresh')}
                </Button>
            </div>

            {/* Search and Filter */}
            <div className={`flex flex-col sm:flex-row gap-4 mb-6 duration-700 ${!hasAnimated && 'animate-in fade-in slide-in-from-top'}`}>
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('search.placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 dark:border-gray-700 transition-all duration-200 hover:border-blue-400 focus:border-blue-500"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-48 dark:border-gray-700 transition-all duration-200 hover:border-blue-400">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder={t('filter.all')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('filter.all')}</SelectItem>
                        <SelectItem value="pending">
                            <CircleDashed className="text-amber-500 dark:text-amber-400" />
                            {t('filter.pending')}
                        </SelectItem>
                        <SelectItem value="paid">
                            <BookmarkCheck className="text-green-500 dark:text-green-400" />
                            {t('filter.paid')}
                        </SelectItem>
                        <SelectItem value="cancelled">
                            <BanknoteX className="text-red-500 dark:text-red-400" />
                            {t('filter.cancelled')}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
                {paginatedOrders.length > 0 ? (
                    paginatedOrders.map((order, index) => <OrderCard key={order.id} order={order} index={index} />)
                ) : (
                    <div className="text-center py-12 animate-in fade-in zoom-in duration-700">
                        <div className="flex justify-center mb-6 animate-in slide-in-from-top duration-500">
                            <div className="bg-linear-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 p-8 rounded-full shadow-xl hover:scale-110 transition-transform duration-300">
                                <Package className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <h3 className="text-lg font-medium mb-2 animate-in slide-in-from-top duration-700 delay-100">{t('empty.title')}</h3>
                        <p className="text-muted-foreground animate-in slide-in-from-top duration-700 delay-200">
                            {orders.length === 0
                                ? t('empty.no_orders')
                                : t('empty.no_results')}
                        </p>
                    </div>
                )}
            </div>

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
                    itemLabel={tCommon('orders')}
                />
            )}

            {/* Order Detail Modal */}
            <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
                <DialogContent className="max-w-2xl animate-in fade-in zoom-in duration-300">
                    <DialogHeader className="mb-4 animate-in fade-in slide-in-from-top duration-500">
                        <DialogTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            {selectedOrder?.order_number}
                        </DialogTitle>
                        <DialogDescription>
                            {t('detail.description')}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedOrder && (
                        <ScrollArea className="space-y-6 px-3 max-h-[calc(100vh-20rem)]">
                            <div className="flex items-center justify-between mb-4 animate-in fade-in slide-in-from-top duration-500">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('detail.order_status')}</p>
                                    {getStatusBadge(selectedOrder.status)}
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('detail.payment_status')}</p>
                                    {getPaymentStatusBadge(selectedOrder.payment_status || 'pending')}
                                </div>
                            </div>

                            <div className="flex items-center justify-between mb-4 animate-in fade-in slide-in-from-top duration-500 delay-100">
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('detail.order_date')}</p>
                                    <p className="font-medium">
                                        {formatDateTime(new Date(selectedOrder.created_at))}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">{t('detail.total_amount')}</p>
                                    <p className="font-semibold text-lg">
                                        {formatPrice(selectedOrder.price)}
                                    </p>
                                </div>
                            </div>

                            <div>
                                {selectedOrder.order_items.length > 0 && (
                                    <>
                                        <h4 className="font-semibold mb-3">{t('detail.ordered_products')}</h4>
                                        {selectedOrder.order_items.map((item: OrderItemDetail, index: number) => (
                                            <div
                                                key={index}
                                                className="border border-dashed border-accent rounded-lg p-4 space-y-2 mb-2 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 animate-in fade-in slide-in-from-left"
                                                style={{ animationDelay: `${index * 100}ms`, animationDuration: '500ms' }}
                                            >
                                                <h5 className="font-semibold">{item.configuration.plan_name}</h5>

                                                <p className="text-sm text-muted-foreground">
                                                    {t('detail.hostname')}: {item.hostname}
                                                </p>

                                                <p className="text-sm text-muted-foreground">
                                                    {t('detail.os')}: {item.os}
                                                </p>

                                                <p className="text-sm text-muted-foreground">
                                                    {formatSpecifications(item)}
                                                </p>

                                                <p className="text-sm text-muted-foreground">
                                                    {t('detail.duration')}: {item.duration_months} {t('detail.months')}
                                                </p>

                                                <p className="text-sm font-medium">
                                                    {t('detail.price')}: {formatPrice(item.total_price)}
                                                </p>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>

                            {selectedOrder.status === 'pending' && selectedOrder.order_items.length > 0 && !selectedOrder?.note && (
                                <Button
                                    className="w-full mt-4 bg-linear-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 transition-all duration-300 hover:shadow-xl hover:scale-105 animate-in fade-in zoom-in delay-300"
                                    onClick={() => handlePayNowClick(selectedOrder)}
                                >
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    {t('detail.pay_now')}
                                </Button>
                            )}

                            {selectedOrder?.note && (
                                <div className="mt-4">
                                    <p className="text-sm text-muted-foreground">{t('detail.note')}: {selectedOrder.note}</p>
                                </div>
                            )}
                        </ScrollArea>
                    )}
                </DialogContent>
            </Dialog>

            {/* Payment Method Dialog */}
            <Dialog open={showPaymentDialog} onOpenChange={(open) => {
                if (!isProcessingPayment) {
                    setShowPaymentDialog(open);
                    if (!open) {
                        setOrderToRepay(null);
                        setCanRepayStatus(null);
                    }
                }
            }}>
                <DialogContent className="max-w-md animate-in fade-in zoom-in duration-300">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-green-600" />
                            {t('payment.title')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('payment.description')} {orderToRepay?.order_number}
                        </DialogDescription>
                    </DialogHeader>

                    {isCheckingRepay ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : canRepayStatus && !canRepayStatus.can_repay ? (
                        <div className="py-6 space-y-4">
                            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                                <div>
                                    <p className="font-medium text-red-800 dark:text-red-400">{t('payment.cannot_process')}</p>
                                    <p className="text-sm text-red-600 dark:text-red-500">{canRepayStatus.reason}</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setShowPaymentDialog(false)}
                            >
                                {t('payment.close')}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6 py-4">
                            <div className="text-center p-4 bg-linear-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                                <p className="text-sm text-muted-foreground">{t('payment.amount_to_pay')}</p>
                                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {formatPrice(orderToRepay?.price || 0)}
                                </p>
                            </div>

                            <RadioGroup
                                value={paymentMethod}
                                onValueChange={(value) => setPaymentMethod(value as 'momo' | 'vnpay')}
                                className="space-y-3"
                            >
                                <Label
                                    className={`relative group cursor-pointer transition-all duration-300 hover:scale-[1.02] ${paymentMethod === 'momo'
                                        ? 'bg-linear-to-r from-pink-50 to-pink-100 dark:from-pink-900/30 dark:to-pink-800/30 border-2 border-pink-500 shadow-lg'
                                        : 'border-2 border-gray-200 dark:border-gray-700 hover:border-pink-300 hover:shadow-md'
                                        } rounded-xl p-4 flex items-center space-x-3`}
                                    htmlFor="momo"
                                >
                                    <RadioGroupItem value="momo" id="momo" className="text-pink-600 border-pink-600" />
                                    <div className={`p-2 rounded-full ${paymentMethod === 'momo' ? 'bg-pink-600 text-white' : 'bg-pink-100 text-pink-600'}`}>
                                        <Smartphone className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">{t('payment.momo_wallet')}</p>
                                        <p className="text-xs text-muted-foreground">{t('payment.momo_desc')}</p>
                                    </div>
                                </Label>

                                <Label
                                    className={`relative group cursor-pointer transition-all duration-300 hover:scale-[1.02] ${paymentMethod === 'vnpay'
                                        ? 'bg-linear-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-2 border-green-500 shadow-lg'
                                        : 'border-2 border-gray-200 dark:border-gray-700 hover:border-green-300 hover:shadow-md'
                                        } rounded-xl p-4 flex items-center space-x-3`}
                                    htmlFor="vnpay"
                                >
                                    <RadioGroupItem value="vnpay" id="vnpay" className="text-green-600 border-green-600" />
                                    <div className={`p-2 rounded-full ${paymentMethod === 'vnpay' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-600'}`}>
                                        <CreditCard className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">{t('payment.vnpay')}</p>
                                        <p className="text-xs text-muted-foreground">{t('payment.vnpay_desc')}</p>
                                    </div>
                                </Label>
                            </RadioGroup>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                                <Shield className="h-4 w-4 text-green-600" />
                                <span>{t('payment.secure')}</span>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowPaymentDialog(false)}
                                    disabled={isProcessingPayment}
                                >
                                    {t('payment.cancel')}
                                </Button>
                                <Button
                                    className="flex-1 bg-linear-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                                    onClick={handleProcessPayment}
                                    disabled={isProcessingPayment}
                                >
                                    {isProcessingPayment ? (
                                        <>
                                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                                            {t('payment.processing')}
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard className="mr-2 h-4 w-4" />
                                            {t('payment.pay_now')}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MyOrdersPage;