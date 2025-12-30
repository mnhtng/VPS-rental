"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CreditCard, TrendingUp, Receipt, RefreshCw, Clock } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import useMember from "@/hooks/useMember"
import useVPS from "@/hooks/useVPS"
import { useTranslations } from "next-intl"
import { Order, VPSInstance } from "@/types/types"
import { toast } from "sonner"
import { formatPrice } from "@/utils/currency"
import { formatDateTime } from "@/utils/string"
import RenewalDialog from "@/components/custom/client/RenewalDialog"
import RepayDialog from "@/components/custom/client/RepayDialog"

export default function BillingPage() {
  const t = useTranslations('client_billing')
  const { getUserTotalRevenue, getOrders } = useMember()
  const { getMyVps } = useVPS()

  const [revenue, setRevenue] = useState({
    total: 0,
    current_month: 0,
  })
  const [vpsList, setVpsList] = useState<VPSInstance[] | []>([])
  const [orders, setOrders] = useState<Order[] | []>([])
  const [loading, setLoading] = useState(true)
  const [selectedVpsForRenewal, setSelectedVpsForRenewal] = useState<VPSInstance | null>(null)
  const [renewalDialogOpen, setRenewalDialogOpen] = useState(false)
  const [selectedOrderForRepay, setSelectedOrderForRepay] = useState<Order | null>(null)
  const [repayDialogOpen, setRepayDialogOpen] = useState(false)

  const fetchBilling = async (signal?: AbortSignal) => {
    try {
      const [totalRevenue, currentMonthRevenue, vpsData, orderData] = await Promise.all([
        getUserTotalRevenue(undefined, signal),
        getUserTotalRevenue(new Date().getMonth() + 1, signal),
        getMyVps(null, signal),
        getOrders(signal),
      ])

      if (signal?.aborted) return

      const error = [totalRevenue, currentMonthRevenue, vpsData, orderData].find(res => res.error)

      if (error) {
        toast.error(error.message, {
          description: error?.error?.detail,
        })
      } else {
        setRevenue({
          total: totalRevenue.data as number,
          current_month: currentMonthRevenue.data as number,
        })
        setVpsList(vpsData.data)
        setOrders(orderData.data)
      }
      setLoading(false)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;

      toast.error(t('toast.fetch_failed'), {
        description: t('toast.try_again'),
      })
      setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()

    fetchBilling(controller.signal)

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const vpsUsage = () => {
    if (vpsList.length === 0) return []

    const usageData = []

    for (const vps of vpsList) {
      const usage = vps.order_item
        ? parseFloat(((new Date().getTime() - new Date(vps.order_item.created_at).getTime()) / (vps.order_item.duration_months * 30 * 24 * 60 * 60 * 1000) * 100).toFixed(2))
        : 0

      const usagePercent = vps.order_item
        ? usage > 80 ? 'bg-red-500'
          : usage > 50 ? 'bg-yellow-500'
            : 'bg-green-500'
        : 'bg-green-500'

      usageData.push({
        vps: vps,
        vm: vps.vm,
        order_item: vps.order_item,
        usage: usage,
        color: usagePercent,
      })
    }

    return usageData
  }

  const getDaysUntilExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return 0
    return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }

  const getExpiryColor = (days: number) => {
    if (days <= 3) return "text-red-600"
    if (days <= 7) return "text-yellow-600"
    return "text-green-600"
  }

  const handleRenewClick = (vps: VPSInstance) => {
    setSelectedVpsForRenewal(vps)
    setRenewalDialogOpen(true)
  }

  const handleRenewalSuccess = () => {
    setRenewalDialogOpen(false)
    setSelectedVpsForRenewal(null)
  }

  const canShowRepayButton = (order: Order) => {
    return order.status === "pending" && order.note?.startsWith("VPS Renewal")
  }

  const handleRepayClick = (order: Order) => {
    setSelectedOrderForRepay(order)
    setRepayDialogOpen(true)
  }

  const handleRepaySuccess = () => {
    setRepayDialogOpen(false)
    setSelectedOrderForRepay(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{t('invoice.status.paid')}</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{t('invoice.status.pending')}</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{t('invoice.status.cancelled')}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>

      {/* Balance & Usage Cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {loading ? (
          <>
            {[1, 2].map((i) => (
              <Card key={i} className="animate-in fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-4 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-9 w-36 mb-2" />
                  <Skeleton className="h-3 w-40" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '0ms' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('cards.total_spending')}</CardTitle>
                <CreditCard className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{formatPrice(revenue.total)}</div>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '50ms' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('cards.this_month_cost')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{formatPrice(revenue.current_month)}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* VPS Usage */}
      <Card className="animate-in fade-in slide-in-from-left-4 duration-500">
        <CardHeader>
          <CardTitle>
            {t('usage.title')}
          </CardTitle>
          <CardDescription>
            {t('usage.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2 animate-in fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </>
          ) : (
            <>
              {vpsUsage().length > 0 ? (vpsUsage().map((item, i) => (
                <div key={i} className="space-y-2 animate-in fade-in slide-in-from-left-4" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{item.vm?.hostname}</span>
                      <div className={`hidden sm:flex items-center gap-1 text-xs ${getExpiryColor(getDaysUntilExpiry(item.vps.expires_at))}`}>
                        <Clock className="h-3 w-3" />
                        <span>{getDaysUntilExpiry(item.vps.expires_at) > 0 ? `${getDaysUntilExpiry(item.vps.expires_at)} ${t('usage.days')}` : t('usage.expired')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="hidden sm:block font-semibold">{formatPrice(item?.order_item?.total_price || 0)}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleRenewClick(item.vps)}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        {t('usage.renew')}
                      </Button>
                    </div>
                  </div>
                  <Progress value={item.usage} className={`h-2 ${item.color}`} />
                </div>
              ))) : (
                <div className="flex flex-col items-center justify-center py-16 text-center animate-in zoom-in duration-500">
                  <div className="rounded-full bg-linear-to-br from-blue-100 to-purple-100 p-6 mb-4">
                    <CreditCard className="h-16 w-16 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{t('usage.no_vps_title')}</h3>
                  <p className="text-muted-foreground mb-6">{t('usage.no_vps_description')}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card className="animate-in fade-in slide-in-from-right-4 duration-500">
        <CardHeader>
          <CardTitle>{t('invoice.title')}</CardTitle>
          <CardDescription>{t('invoice.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0 animate-in fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border relative">
              {orders.length > 0 ? (
                <div className="max-h-100 overflow-auto">
                  <Table>
                    <TableHeader className="bg-muted">
                      <TableRow>
                        <TableHead>{t('invoice.table.invoice_id')}</TableHead>
                        <TableHead>{t('invoice.table.time')}</TableHead>
                        <TableHead>{t('invoice.table.note')}</TableHead>
                        <TableHead>{t('invoice.table.status')}</TableHead>
                        <TableHead className="text-right">{t('invoice.table.amount')}</TableHead>
                        <TableHead className="text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((invoice, index) => (
                        <TableRow
                          key={invoice.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors animate-in fade-in slide-in-from-left-4"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <TableCell className="font-medium font-mono">{invoice.id}</TableCell>
                          <TableCell>{formatDateTime(new Date(invoice.created_at))}</TableCell>
                          <TableCell>{invoice?.note || t('invoice.none')}</TableCell>
                          <TableCell>
                            {getStatusBadge(invoice.status)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">{formatPrice(invoice.price)}</TableCell>
                          <TableCell className="text-right">
                            {canShowRepayButton(invoice) && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleRepayClick(invoice)}
                              >
                                <CreditCard className="h-3 w-3 mr-1" />
                                {t('invoice.pay')}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center animate-in zoom-in duration-500">
                  <div className="rounded-full bg-linear-to-br from-blue-100 to-purple-100 p-6 mb-4">
                    <Receipt className="h-16 w-16 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{t('invoice.no_invoices_title')}</h3>
                  <p className="text-muted-foreground mb-6">{t('invoice.no_invoices_description')}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <RenewalDialog
        open={renewalDialogOpen}
        onOpenChange={setRenewalDialogOpen}
        vpsInstance={selectedVpsForRenewal}
        userPhone={selectedVpsForRenewal?.user?.phone || ""}
        userAddress={selectedVpsForRenewal?.user?.address || ""}
        onSuccess={handleRenewalSuccess}
      />

      <RepayDialog
        open={repayDialogOpen}
        onOpenChange={setRepayDialogOpen}
        order={selectedOrderForRepay}
        userPhone={selectedOrderForRepay?.billing_phone || ""}
        userAddress={selectedOrderForRepay?.billing_address || ""}
        onSuccess={handleRepaySuccess}
      />
    </div>
  )
}
