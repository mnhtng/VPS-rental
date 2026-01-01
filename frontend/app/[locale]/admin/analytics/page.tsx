"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig } from "@/components/ui/chart"
import { BarChartComponent } from "@/components/custom/chart/bar-chart"
import { LineChartComponent } from "@/components/custom/chart/line-chart"
import { PieChartComponent } from "@/components/custom/chart/pie-chart"
import { colorsHex } from "@/utils/color"
import { Server, Users, DollarSign, TrendingUp, Loader2 } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import useAdminDashboard from "@/hooks/useAdminDashboard"
import { AnalyticsStats } from "@/types/types"
import { toast } from "sonner"
import { formatPrice } from "@/utils/currency"
import { AnalyticsPlaceholder } from "@/components/custom/placeholder/admin/analytics"
import { useTranslations } from "next-intl"

export default function AnalyticsPage() {
    const t = useTranslations('admin.analytics')
    const [analyticsData, setAnalyticsData] = useState<AnalyticsStats | null>(null)
    const [loading, setLoading] = useState(true)
    const { getAnalyticsStats } = useAdminDashboard()

    const fetchAnalytics = async (signal?: AbortSignal) => {
        setLoading(true)

        try {
            const result = await getAnalyticsStats(signal)

            if (signal?.aborted) return

            if (result.error) {
                toast.error(result.message, {
                    description: result.error.detail,
                })
            } else {
                setAnalyticsData(result.data)
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') return

            toast.error(t('toast.fetch_failed'), {
                description: t('toast.fetch_failed'),
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const controller = new AbortController()

        fetchAnalytics(controller.signal)

        return () => {
            controller.abort()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const formatCurrency = (value: number) => {
        if (value >= 1000000000) {
            return `${(value / 1000000000).toFixed(1)}B`
        }
        if (value >= 1000000) {
            return `${(value / 1000000).toFixed(0)}M`
        }
        return value.toString()
    }

    const chartConfig = {
        revenue: { label: t('charts.revenue'), color: "#22c55e" },
        orders: { label: t('stats.orders'), color: "#3b82f6" },
        users: { label: t('stats.users'), color: "#8b5cf6" },
        count: { label: t('charts.count'), color: "#3b82f6" },
    } satisfies ChartConfig

    // Color mapping for plan categories
    const planColors: Record<string, string> = {
        "Basic": colorsHex.blue,
        "Standard": colorsHex.violet,
        "Premium": colorsHex.emerald,
    }

    // Color mapping for OS types
    const osColors: Record<string, string> = {
        "windows": colorsHex.teal,
        "linux": colorsHex.amber,
    }

    // Color mapping for payment methods
    const paymentColors: Record<string, string> = {
        "VNPAY": colorsHex.blue,
        "VNPay": colorsHex.blue,
        "Momo": colorsHex.rose,
        "MoMo": colorsHex.rose,
    }

    // Month colors for chart
    const monthColors = [
        colorsHex.green, colorsHex.blue, colorsHex.violet, colorsHex.amber,
        colorsHex.red, colorsHex.cyan, colorsHex.pink, colorsHex.teal,
        colorsHex.orange, colorsHex.indigo, colorsHex.lime, colorsHex.purple,
    ]

    if (loading) {
        return (
            <AnalyticsPlaceholder />
        )
    }

    if (!analyticsData) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    // Transform data for charts
    const vpsByPlanData = analyticsData.vps_by_plan.map(item => ({
        plan: item.plan,
        count: item.count,
        revenue: item.revenue,
        fill: planColors[item.plan] || colorsHex.gray,
    }))

    const vpsByOsPieData = analyticsData.vps_by_os.map(item => ({
        category: item.os,
        value: item.count,
        percentage: 0,
        fill: osColors[item.os] || colorsHex.gray,
    }))

    const monthlyRevenueData = analyticsData.monthly_revenue.map((item, index) => ({
        month: item.month,
        revenue: item.revenue,
        orders: item.orders,
        fill: monthColors[index % 12],
    }))

    const userGrowthData = analyticsData.user_growth.map(item => ({
        month: item.month,
        users: item.users,
    }))

    const paymentMethodPieData = analyticsData.payment_methods.map(item => ({
        category: item.method,
        value: item.count,
        percentage: 0,
        fill: paymentColors[item.method] || colorsHex.gray,
    }))

    // Generate chart configs
    const vpsOsChartConfig = analyticsData.vps_by_os.reduce((acc, item) => {
        acc[item.os.toLowerCase().replace(' ', '')] = {
            label: item.os,
            color: osColors[item.os] || colorsHex.gray
        }
        return acc
    }, {} as ChartConfig)

    const paymentChartConfig = analyticsData.payment_methods.reduce((acc, item) => {
        acc[item.method.toLowerCase()] = {
            label: item.method,
            color: paymentColors[item.method] || colorsHex.gray
        }
        return acc
    }, {} as ChartConfig)

    const { summary } = analyticsData
    const totalVps = summary.total_vps
    const totalUsers = summary.total_users
    const totalRevenue = summary.yearly_revenue
    const totalOrders = summary.yearly_orders

    return (
        <div className="space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="animate-in fade-in slide-in-from-bottom-4 hover:shadow-lg transition-all" style={{ animationDelay: '0ms' }}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Server className="h-4 w-4" />
                            {t('stats.total_vps')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl md:text-3xl font-bold text-blue-600">{totalVps}</p>
                    </CardContent>
                </Card>
                <Card className="animate-in fade-in slide-in-from-bottom-4 hover:shadow-lg transition-all" style={{ animationDelay: '50ms' }}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {t('stats.users')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl md:text-3xl font-bold text-purple-600">{totalUsers}</p>
                    </CardContent>
                </Card>
                <Card className="animate-in fade-in slide-in-from-bottom-4 hover:shadow-lg transition-all" style={{ animationDelay: '100ms' }}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            {t('stats.yearly_revenue')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl md:text-3xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
                    </CardContent>
                </Card>
                <Card className="animate-in fade-in slide-in-from-bottom-4 hover:shadow-lg transition-all" style={{ animationDelay: '150ms' }}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            {t('stats.orders')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl md:text-3xl font-bold text-orange-600">{totalOrders}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <BarChartComponent
                    title={t('charts.monthly_revenue')}
                    description={t('charts.monthly_revenue_desc')}
                    data={monthlyRevenueData}
                    chartConfig={chartConfig}
                    xAxisKey="month"
                    variant="mixed"
                    yAxisConfig={{ tickFormatter: formatCurrency }}
                    className="animate-in fade-in slide-in-from-left-4 duration-700 hover:shadow-lg transition-shadow"
                />

                {/* User Growth */}
                <LineChartComponent
                    title={t('charts.user_growth')}
                    description={t('charts.user_growth_desc')}
                    data={userGrowthData}
                    chartConfig={{ users: { label: t('stats.users'), color: colorsHex.red } }}
                    xAxisKey="month"
                    lines={[{ dataKey: "users", stroke: colorsHex.red, strokeWidth: 2, dot: true }]}
                    className="animate-in fade-in slide-in-from-right-4 duration-700 hover:shadow-lg transition-shadow"
                />
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-center justify-center">
                {/* VPS by Plan */}
                <BarChartComponent
                    title={t('charts.vps_by_plan')}
                    description={t('charts.vps_by_plan_desc')}
                    data={vpsByPlanData}
                    chartConfig={{ count: { label: t('charts.count'), color: colorsHex.blue } }}
                    xAxisKey="plan"
                    variant="horizontal"
                    className="animate-in fade-in slide-in-from-bottom-4 duration-700 hover:shadow-lg transition-shadow"
                />

                {/* VPS by OS */}
                {vpsByOsPieData.length > 0 ? (
                    <PieChartComponent
                        title={t('charts.vps_by_os')}
                        description={t('charts.vps_by_os_desc')}
                        data={vpsByOsPieData}
                        chartConfig={vpsOsChartConfig}
                        dataKey="value"
                        nameKey="category"
                        legendKey="category"
                        outerRadius={70}
                        showLegend={true}
                        showTooltip={true}
                        className="animate-in fade-in slide-in-from-bottom-4 duration-700 hover:shadow-lg transition-shadow"
                    />
                ) : (
                    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <CardHeader>
                            <CardTitle>{t('charts.vps_by_os')}</CardTitle>
                            <CardDescription>{t('charts.vps_by_os_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center h-50">
                            <p className="text-muted-foreground">{t('no_data')}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Payment Method */}
                {paymentMethodPieData.some(item => item.value > 0) ? (
                    <PieChartComponent
                        title={t('charts.payment_methods')}
                        description={t('charts.payment_methods_desc')}
                        data={paymentMethodPieData}
                        chartConfig={paymentChartConfig}
                        dataKey="value"
                        nameKey="category"
                        legendKey="category"
                        innerRadius={40}
                        outerRadius={70}
                        showLegend={true}
                        showTooltip={true}
                        className="animate-in fade-in slide-in-from-bottom-4 duration-700 hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-1"
                    />
                ) : (
                    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700 md:col-span-2 lg:col-span-1">
                        <CardHeader>
                            <CardTitle>{t('charts.payment_methods')}</CardTitle>
                            <CardDescription>{t('charts.payment_methods_desc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center h-50">
                            <p className="text-muted-foreground">{t('no_data')}</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Statistics Table */}
            <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-hidden">
                <CardHeader>
                    <CardTitle>{t('table.title')}</CardTitle>
                    <CardDescription>{t('table.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-secondary">
                                <TableRow>
                                    <TableHead>{t('table.service_plan')}</TableHead>
                                    <TableHead className="text-center">{t('table.vps_count')}</TableHead>
                                    <TableHead className="text-center hidden sm:table-cell">{t('table.percentage')}</TableHead>
                                    <TableHead className="text-right">{t('table.revenue')}</TableHead>
                                    <TableHead className="text-right hidden md:table-cell">{t('table.revenue_percent')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {vpsByPlanData.map((item, index) => {
                                    const totalPlanRevenue = vpsByPlanData.reduce((sum, p) => sum + p.revenue, 0)
                                    return (
                                        <TableRow
                                            key={item.plan}
                                            className="hover:bg-accent/50 transition-colors animate-in fade-in slide-in-from-left-4"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <TableCell className="font-medium">{item.plan}</TableCell>
                                            <TableCell className="text-center">{item.count}</TableCell>
                                            <TableCell className="text-center hidden sm:table-cell">
                                                {totalVps > 0 ? ((item.count / totalVps) * 100).toFixed(1) : 0}%
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-green-600">
                                                {formatPrice(item.revenue)}
                                            </TableCell>
                                            <TableCell className="text-right hidden md:table-cell">
                                                {totalPlanRevenue > 0 ? ((item.revenue / totalPlanRevenue) * 100).toFixed(1) : 0}%
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                                <TableRow className="font-bold bg-muted/50">
                                    <TableCell>{t('table.total')}</TableCell>
                                    <TableCell className="text-center">{totalVps}</TableCell>
                                    <TableCell className="text-center hidden sm:table-cell">100%</TableCell>
                                    <TableCell className="text-right text-green-600">
                                        {formatPrice(vpsByPlanData.reduce((sum, p) => sum + p.revenue, 0))}
                                    </TableCell>
                                    <TableCell className="text-right hidden md:table-cell">100%</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}