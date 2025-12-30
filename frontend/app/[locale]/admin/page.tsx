"use client"

import { useState, useEffect, useMemo } from "react"
import { colors } from "@/utils/color"
import CountUp from "@/components/ui/count-up"
import GlowingCard from "@/components/ui/glowing-card"
import {
  Users,
  Server,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Clock,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ChartConfig,
} from "@/components/ui/chart"
import { AreaChartComponent } from "@/components/custom/chart/area-chart"
import { PieChartComponent } from "@/components/custom/chart/pie-chart"
import useAdminDashboard from "@/hooks/useAdminDashboard"
import { DashboardStats, RecentOrder } from "@/types/types"
import { toast } from "sonner"
import { formatPrice } from "@/utils/currency"
import { formatDate } from "@/utils/string"
import { DashboardPlaceholder } from "@/components/custom/placeholder/admin/dashboard"
import { useTranslations } from "next-intl"

const Dashboard = () => {
  const t = useTranslations('admin.dashboard')
  const { getDashboardStats } = useAdminDashboard()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)

  const fetchData = async (signal?: AbortSignal) => {
    setIsLoading(true)
    try {
      const result = await getDashboardStats(signal)

      if (signal?.aborted) return

      if (result.error) {
        toast.error(result.message, {
          description: result.error.detail,
        })
        return
      }

      setStats(result.data)
      setIsLoading(false)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return

      toast.error(t('errors.failed_load'), {
        description: t('errors.try_again'),
      })
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()

    fetchData(controller.signal)

    return () => {
      controller.abort()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const revenueChartConfig = {
    revenue: {
      label: t('charts.revenue_title'),
      color: "#22c55e",
    },
  } satisfies ChartConfig

  const vpsStatusChartConfig = {
    running: {
      label: t('charts.running'),
      color: "#22c55e",
    },
    stopped: {
      label: t('charts.stopped'),
      color: "#f59e0b",
    },
    terminated: {
      label: t('charts.terminated'),
      color: "#ef4444",
    },
  } satisfies ChartConfig


  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMinutes < 60) return t('recent_orders.min_ago', { value: diffMinutes })
    if (diffHours < 24) return t('recent_orders.hours_ago', { value: diffHours })
    return formatDate(new Date(dateString))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-0">{t('status.paid')}</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-0">{t('status.pending')}</Badge>
      case 'cancelled':
        return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-0">{t('status.cancelled')}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Transform data for charts
  const vpsStatusPieData = useMemo(() => {
    if (!stats) return []
    const total = stats.vps_status.running + stats.vps_status.stopped + stats.vps_status.terminated
    return [
      { category: "running", value: stats.vps_status.running, percentage: total > 0 ? Math.round((stats.vps_status.running / total) * 100) : 0, fill: "#22c55e" },
      { category: "stopped", value: stats.vps_status.stopped, percentage: total > 0 ? Math.round((stats.vps_status.stopped / total) * 100) : 0, fill: "#f59e0b" },
      { category: "terminated", value: stats.vps_status.terminated, percentage: total > 0 ? Math.round((stats.vps_status.terminated / total) * 100) : 0, fill: "#ef4444" },
    ]
  }, [stats])

  const revenueChartData = useMemo(() => {
    if (!stats) return []
    return stats.revenue_chart
  }, [stats])

  if (isLoading) {
    return (
      <DashboardPlaceholder />
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <p className="text-muted-foreground">{t('errors.failed_load')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <GlowingCard color={'blue'} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '0ms' }}>
          <div className="flex justify-between items-center gap-3">
            <span className="text-sm text-muted-foreground">{t('stats.total_users')}</span>
            <div className={`p-2 ${colors.blue.active} rounded-lg`}>
              <Users size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2">
            <CountUp
              from={0}
              to={stats.total_users}
              separator=","
              direction="up"
              duration={1}
            />
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            {stats.user_growth >= 0 ? (
              <TrendingUp size={16} className={colors.green.text} />
            ) : (
              <TrendingDown size={16} className={colors.red.text} />
            )}
            <span className={`text-sm ${stats.user_growth >= 0 ? colors.green.text : colors.red.text}`}>
              {stats.user_growth >= 0 ? '+' : ''}{t('stats.this_month', { value: stats.user_growth })}
            </span>
          </div>
        </GlowingCard>

        <GlowingCard color={'green'} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '50ms' }}>
          <div className="flex justify-between items-center gap-3">
            <span className="text-sm text-muted-foreground">{t('stats.active_vps')}</span>
            <div className={`p-2 ${colors.green.active} rounded-lg`}>
              <Server size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2">
            <CountUp
              from={0}
              to={stats.active_vps}
              separator=","
              direction="up"
              duration={1}
            />
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            {stats.vps_growth >= 0 ? (
              <TrendingUp size={16} className={colors.green.text} />
            ) : (
              <TrendingDown size={16} className={colors.red.text} />
            )}
            <span className={`text-sm ${stats.vps_growth >= 0 ? colors.green.text : colors.red.text}`}>
              {stats.vps_growth >= 0 ? '+' : ''}{t('stats.this_month', { value: stats.vps_growth })}
            </span>
          </div>
        </GlowingCard>

        <GlowingCard color={'gold'} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '100ms' }}>
          <div className="flex justify-between items-center gap-3">
            <span className="text-sm text-muted-foreground">{t('stats.monthly_revenue')}</span>
            <div className={`p-2 ${colors.orange.active} rounded-lg`}>
              <DollarSign size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2">
            <CountUp
              from={0}
              to={stats.monthly_revenue / 1000000}
              separator=","
              direction="up"
              duration={1}
              decimalPlaces={1}
            />
            <span className="text-lg">M</span>
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            {stats.revenue_growth >= 0 ? (
              <TrendingUp size={16} className={colors.green.text} />
            ) : (
              <TrendingDown size={16} className={colors.red.text} />
            )}
            <span className={`text-sm ${stats.revenue_growth >= 0 ? colors.green.text : colors.red.text}`}>
              {stats.revenue_growth >= 0 ? '+' : ''}{t('stats.vs_last_month', { value: stats.revenue_growth })}
            </span>
          </div>
        </GlowingCard>

        <GlowingCard color={'purple'} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '150ms' }}>
          <div className="flex justify-between items-center gap-3">
            <span className="text-sm text-muted-foreground">{t('stats.monthly_orders')}</span>
            <div className={`p-2 ${colors.violet.active} rounded-lg`}>
              <ShoppingCart size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold mt-2">
            <CountUp
              from={0}
              to={stats.monthly_orders}
              direction="up"
              duration={1}
            />
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            {stats.order_growth >= 0 ? (
              <TrendingUp size={16} className={colors.green.text} />
            ) : (
              <TrendingDown size={16} className={colors.red.text} />
            )}
            <span className={`text-sm ${stats.order_growth >= 0 ? colors.green.text : colors.red.text}`}>
              {stats.order_growth >= 0 ? '+' : ''}{t('stats.vs_last_month', { value: stats.order_growth })}
            </span>
          </div>
        </GlowingCard>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 animate-in fade-in slide-in-from-left-4 duration-700 hover:shadow-lg transition-shadow">
          <AreaChartComponent
            title={t('charts.revenue_title')}
            description={t('charts.revenue_description')}
            data={revenueChartData}
            chartConfig={revenueChartConfig}
            xAxisKey="month"
            variant="gradient"
            useGradient={true}
            showGrid={false}
            yAxisConfig={{
              tickFormatter: (value) => `${value / 1000000}M`,
            }}
            className="border-0 shadow-none"
          />
        </Card>

        {/* VPS Status Distribution */}
        <Card className="animate-in fade-in slide-in-from-right-4 duration-700 hover:shadow-lg transition-shadow">
          <PieChartComponent
            title={t('charts.vps_status_title')}
            description={t('charts.vps_status_description')}
            data={vpsStatusPieData}
            chartConfig={vpsStatusChartConfig}
            dataKey="value"
            nameKey="category"
            legendKey="category"
            innerRadius={80}
            outerRadius={120}
            paddingAngle={2}
            cornerRadius={3}
            showTooltip={false}
            showActiveSection={true}
            className="border-0 shadow-none h-full"
          />
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700 hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-500" />
            {t('recent_orders.title')}
          </CardTitle>
          <CardDescription>
            {t('recent_orders.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recent_orders.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">{t('recent_orders.no_orders')}</p>
            ) : (
              stats.recent_orders.map((order: RecentOrder, index: number) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 hover:border-primary/20 transition-all duration-200 animate-in fade-in slide-in-from-left-4"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="font-medium truncate">{order.customer_name}</p>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
                      <span className="font-mono">{order.order_number}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:inline">{order.plan}</span>
                    </div>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <p className="font-semibold text-green-600">{formatPrice(order.amount)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(order.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard
