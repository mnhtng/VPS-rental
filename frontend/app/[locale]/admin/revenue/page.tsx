"use client"

import { Search, DollarSign, ShoppingCart, CreditCard, TrendingUp, Package, CalendarDays, BarChart3 } from "lucide-react"
import { Input } from '@/components/ui/input'
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { colorsHex } from "@/utils/color"
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
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useMemo, useEffect } from "react"
import debounce from "@/utils/performanceUtil/debounce"
import { normalizeString } from "@/utils/string"
import {
    ChartConfig,
} from "@/components/ui/chart"
import { BarChartComponent } from "@/components/custom/chart/bar-chart"
import useAdminOrders from "@/hooks/useAdminOrders"
import { AdminOrder, OrderStatistics, MonthlyRevenue } from "@/types/types"
import Pagination from "@/components/ui/pagination"
import { formatDate } from "@/utils/string"
import { formatPrice } from "@/utils/currency"
import { toast } from "sonner"
import { OrderDetailSheet } from "@/components/custom/admin/revenue/RevenueDetail"
import { RevenuePlaceholder } from "@/components/custom/placeholder/admin/revenue"
import { useTranslations } from "next-intl"

const chartConfig = {
    revenue: { label: "Revenue", color: "#22c55e" },
} satisfies ChartConfig


const RevenuePage = () => {
    const tCommon = useTranslations('common')
    const t = useTranslations('admin.revenue')
    const { getAllOrders, getOrderStatistics, getMonthlyRevenue } = useAdminOrders()

    const [orders, setOrders] = useState<AdminOrder[]>([])
    const [allOrders, setAllOrders] = useState<AdminOrder[]>([])
    const [stats, setStats] = useState<OrderStatistics | null>(null)
    const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [timeFilter, setTimeFilter] = useState<string>("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    const fetchRevenue = async (signal?: AbortSignal) => {
        setIsLoading(true)

        try {
            const [ordersRes, statsRes, monthlyRes] = await Promise.all([
                getAllOrders(0, undefined, undefined, signal),
                getOrderStatistics(signal),
                getMonthlyRevenue(undefined, signal)
            ])

            if (signal?.aborted) return

            if (ordersRes.data) {
                setOrders(ordersRes.data)
                setAllOrders(ordersRes.data)
            }
            if (statsRes.data) {
                setStats(statsRes.data)
            }
            if (monthlyRes.data) {
                setMonthlyData(monthlyRes.data)
            }
            setIsLoading(false)
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') return

            toast.error(t('toast.fetch_failed'), {
                description: t('toast.fetch_failed')
            })
            setIsLoading(false)
        }
    }

    useEffect(() => {
        const controller = new AbortController()

        fetchRevenue(controller.signal)

        return () => {
            controller.abort()
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const formatPriceShort = (value: number) => {
        if (value >= 1000000000) return `${(value / 1000000000).toFixed(0)}B`
        if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`
        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
        return value.toString()
    }

    const getStatusBadge = (status: AdminOrder['status']) => {
        switch (status) {
            case 'paid':
                return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-0">{t('status.paid')}</Badge>
            case 'pending':
                return <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-0">{t('status.pending')}</Badge>
            case 'cancelled':
                return <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-0">{t('status.cancelled')}</Badge>
        }
    }

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = normalizeString(e.target.value)

        if (!query) {
            setOrders(allOrders)
            return
        }

        const filtered = allOrders.filter(order =>
            normalizeString(order.order_number).includes(query) ||
            normalizeString(order.user?.name || '').includes(query) ||
            normalizeString(order.user?.email || '').includes(query)
        )
        setOrders(filtered)
        setCurrentPage(1)
    }

    const handleStatusFilter = (value: string) => {
        setStatusFilter(value)
        filterOrders(value, timeFilter)
    }

    const handleTimeFilter = (value: string) => {
        setTimeFilter(value)
        filterOrders(statusFilter, value)
    }

    const filterOrders = (status: string, time: string) => {
        let filtered = [...allOrders]

        // Status filter
        if (status !== "all") {
            filtered = filtered.filter(order => order.status === status)
        }

        // Time filter
        if (time !== "all") {
            const now = new Date()
            filtered = filtered.filter(order => {
                const orderDate = new Date(order.created_at)
                switch (time) {
                    case "month":
                        return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()
                    case "quarter":
                        const currentQuarter = Math.floor(now.getMonth() / 3)
                        const orderQuarter = Math.floor(orderDate.getMonth() / 3)
                        return orderQuarter === currentQuarter && orderDate.getFullYear() === now.getFullYear()
                    case "year":
                        return orderDate.getFullYear() === now.getFullYear()
                    default:
                        return true
                }
            })
        }

        setOrders(filtered)
        setCurrentPage(1)
    }

    const chartColorsList = Object.values(colorsHex)
    const chartData = useMemo(() => {
        return monthlyData.map((item, index) => ({
            ...item,
            fill: chartColorsList[index % chartColorsList.length]
        })).filter(m => m.revenue > 0)
    }, [monthlyData, chartColorsList])

    const quarterlyData = useMemo(() => {
        const quarters: { [key: string]: { revenue: number; orders: number } } = {
            'Q1': { revenue: 0, orders: 0 },
            'Q2': { revenue: 0, orders: 0 },
            'Q3': { revenue: 0, orders: 0 },
            'Q4': { revenue: 0, orders: 0 }
        }

        monthlyData.forEach((item, index) => {
            const quarter = Math.floor(index / 3) + 1
            quarters[`Q${quarter}`].revenue += item.revenue
            quarters[`Q${quarter}`].orders += item.orders
        })

        return Object.entries(quarters).map(([quarter, data]) => ({
            quarter,
            revenue: data.revenue,
            orders: data.orders
        }))
    }, [monthlyData])

    // Pagination
    const totalItems = orders.length
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedOrders = orders.slice(startIndex, endIndex)

    if (isLoading) {
        return (
            <RevenuePlaceholder />
        )
    }

    return (
        <div className="space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-linear-to-br from-green-500/10 to-green-500/5 border-green-500/20 animate-in fade-in slide-in-from-bottom-4 hover:shadow-lg transition-all" style={{ animationDelay: '0ms' }}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            {t('stats.total_revenue')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl md:text-2xl font-bold text-green-600">{formatPrice(stats?.total_revenue || 0)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t('stats.from_orders', { count: stats?.paid_orders || 0 })}</p>
                    </CardContent>
                </Card>

                <Card className="animate-in fade-in slide-in-from-bottom-4 hover:shadow-lg transition-all" style={{ animationDelay: '50ms' }}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            {t('stats.paid_orders')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl md:text-2xl font-bold">{stats?.paid_orders || 0}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t('stats.orders_label')}</p>
                    </CardContent>
                </Card>

                <Card className="bg-linear-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20 animate-in fade-in slide-in-from-bottom-4 hover:shadow-lg transition-all" style={{ animationDelay: '100ms' }}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4" />
                            {t('filter.pending')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl md:text-2xl font-bold text-yellow-600">{stats?.pending_orders || 0}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatPrice(stats?.pending_amount || 0)}</p>
                    </CardContent>
                </Card>

                <Card className="animate-in fade-in slide-in-from-bottom-4 hover:shadow-lg transition-all" style={{ animationDelay: '150ms' }}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            {t('stats.avg_order')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl md:text-2xl font-bold">{formatPrice(stats?.average_order || 0)}</p>
                        <p className="text-xs text-muted-foreground mt-1">{t('stats.average_label')}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue Charts */}
            <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <CardContent>
                    <Tabs defaultValue="monthly" className="w-full">
                        <CardHeader className="flex flex-col lg:flex-row sm:items-center sm:justify-between pb-4 gap-4">
                            <div className="">
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-green-500" />
                                    {t('chart.title')}
                                </CardTitle>
                                <CardDescription>{t('chart.description')}</CardDescription>
                            </div>
                            <TabsList className="grid w-full max-w-md grid-cols-3 mb-4">
                                <TabsTrigger value="monthly">{t('chart.monthly')}</TabsTrigger>
                                <TabsTrigger value="quarterly">{t('chart.quarterly')}</TabsTrigger>
                                <TabsTrigger value="table">{t('chart.details')}</TabsTrigger>
                            </TabsList>
                        </CardHeader>
                        <TabsContent value="monthly">
                            <BarChartComponent
                                data={chartData}
                                chartConfig={chartConfig}
                                variant="mixed"
                                xAxisKey="month"
                                yAxisConfig={{ tickFormatter: formatPriceShort }}
                                tooltipNameKey="month"
                                className="border-0 shadow-none"
                            />
                        </TabsContent>
                        <TabsContent value="quarterly">
                            <BarChartComponent
                                data={quarterlyData}
                                chartConfig={chartConfig}
                                variant="mixed"
                                xAxisKey="quarter"
                                yAxisConfig={{ tickFormatter: formatPriceShort }}
                                tooltipNameKey="quarter"
                                className="border-0 shadow-none"
                            />
                        </TabsContent>
                        <TabsContent value="table">
                            <Table>
                                <TableHeader className="bg-secondary">
                                    <TableRow>
                                        <TableHead>{t('chart.period')}</TableHead>
                                        <TableHead className="text-right">{t('chart.revenue')}</TableHead>
                                        <TableHead className="text-right">{t('chart.orders')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {quarterlyData.map((q) => (
                                        <TableRow key={q.quarter}>
                                            <TableCell className="font-medium">{q.quarter} {new Date().getFullYear()}</TableCell>
                                            <TableCell className="text-right text-green-600 font-medium">{formatPrice(q.revenue)}</TableCell>
                                            <TableCell className="text-right">{q.orders}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('filter.search')}
                        className="pl-10"
                        onChange={debounce(handleSearch, 300)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
                    <Select value={timeFilter} onValueChange={handleTimeFilter}>
                        <SelectTrigger className="w-full sm:w-36">
                            <CalendarDays className="h-4 w-4 mr-2" />
                            <SelectValue placeholder={t('filter.time_placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('filter.all')}</SelectItem>
                            <SelectItem value="month">{t('filter.month')}</SelectItem>
                            <SelectItem value="quarter">{t('filter.week')}</SelectItem>
                            <SelectItem value="year">{t('filter.year')}</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={handleStatusFilter}>
                        <SelectTrigger className="w-full sm:w-40">
                            <SelectValue placeholder={t('filter.placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('filter.all')}</SelectItem>
                            <SelectItem value="paid">{t('status.paid')}</SelectItem>
                            <SelectItem value="pending">{t('status.pending')}</SelectItem>
                            <SelectItem value="cancelled">{t('status.cancelled')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Orders Table */}
            <Card className="overflow-hidden p-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-secondary">
                            <TableRow>
                                <TableHead>{t('table.order_number')}</TableHead>
                                <TableHead className="hidden md:table-cell">{t('table.customer')}</TableHead>
                                <TableHead className="text-center hidden sm:table-cell">
                                    <Package className="h-4 w-4 inline-block" />
                                </TableHead>
                                <TableHead className="text-right">{t('table.amount')}</TableHead>
                                <TableHead className="hidden lg:table-cell">{t('table.payment')}</TableHead>
                                <TableHead>{t('table.status')}</TableHead>
                                <TableHead className="hidden xl:table-cell">{t('table.date')}</TableHead>
                                <TableHead className="text-right">{t('table.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        {t('table.no_orders')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedOrders.map((order, index) => (
                                    <TableRow
                                        key={order.id}
                                        className="hover:bg-accent/50 dark:hover:bg-accent/10 transition-colors animate-in fade-in slide-in-from-left-4"
                                        style={{ animationDelay: `${index * 30}ms` }}
                                    >
                                        <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="text-sm">
                                                <p className="font-medium">{order.user?.name || tCommon('na')}</p>
                                                <p className="text-muted-foreground text-xs truncate max-w-45">{order.user?.email || tCommon('na')}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center hidden sm:table-cell">
                                            <Badge variant="secondary">{order.order_items?.length || 0}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-semibold text-green-600">
                                            {formatPrice(order.price)}
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            {order.payment_method ? (
                                                <Badge variant="outline">{order.payment_method}</Badge>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground hidden xl:table-cell">
                                            {formatDate(new Date(order.created_at))}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <OrderDetailSheet order={order} />
                                        </TableCell>
                                    </TableRow>
                                ))
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
                    itemLabel={tCommon('orders')}
                />
            )}
        </div>
    )
}

export default RevenuePage
