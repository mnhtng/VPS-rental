"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Server, CreditCard, AlertCircle, Clock, LifeBuoy } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import useVPS, { VPSInstance } from "@/hooks/useVPS"
import { useLocale } from "next-intl"
import ClientDashboardPlaceholder from "@/components/custom/placeholder/client/dashboard"

export default function ClientDashboard() {
  const locale = useLocale()
  const { getMyVps } = useVPS()

  const [vpsList, setVpsList] = useState<VPSInstance[]>([])
  const [loading, setLoading] = useState(true)

  const fetchVps = async () => {
    const result = await getMyVps()

    if (result.data) {
      setVpsList(result.data)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchVps()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const totalVpsCount = vpsList.length

  // TODO: Lấy từ API orders - tạm thời mock data
  const totalSpent = 0 // Tổng tiền đã chi

  // TODO: Lấy từ API support tickets - tạm thời mock data
  const totalTickets = 0 // Tổng số ticket

  // Calculate VPS sắp hết hạn (trong vòng 7 ngày)
  const expiringVpsCount = vpsList.filter(vps => {
    const expiresAt = new Date(vps.expires_at)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7
  }).length

  if (loading) {
    return (
      <ClientDashboardPlaceholder />
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="animate-in fade-in slide-in-from-bottom-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]" style={{ animationDelay: '0ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số VPS</CardTitle>
            <Server className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalVpsCount}</div>
            <p className="text-xs text-muted-foreground">
              {totalVpsCount > 0 ? 'Đang hoạt động' : 'Chưa có VPS'}
            </p>
          </CardContent>
        </Card>

        <Card className="animate-in fade-in slide-in-from-bottom-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]" style={{ animationDelay: '50ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng tiền đã chi</CardTitle>
            <CreditCard className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalSpent.toLocaleString('vi-VN')} ₫
            </div>
            <p className="text-xs text-muted-foreground">Tất cả đơn hàng</p>
          </CardContent>
        </Card>

        <Card className="animate-in fade-in slide-in-from-bottom-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]" style={{ animationDelay: '100ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hỗ trợ</CardTitle>
            <LifeBuoy className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{totalTickets}</div>
            <p className="text-xs text-muted-foreground">Tổng số ticket</p>
          </CardContent>
        </Card>

        <Card className="animate-in fade-in slide-in-from-bottom-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]" style={{ animationDelay: '150ms' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sắp hết hạn</CardTitle>
            <AlertCircle className={`h-4 w-4 ${expiringVpsCount > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${expiringVpsCount > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
              {expiringVpsCount}
            </div>
            <p className="text-xs text-muted-foreground">Trong vòng 7 ngày</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity / VPS List Preview */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4 animate-in fade-in slide-in-from-left-4 duration-700">
          <CardHeader>
            <CardTitle>Danh sách VPS của bạn</CardTitle>
          </CardHeader>
          <CardContent>
            {vpsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in duration-500">
                <div className="rounded-full bg-gradient-to-br from-blue-100 to-purple-100 p-4 mb-4">
                  <Server className="h-12 w-12 text-blue-600" />
                </div>
                <p className="text-muted-foreground mb-4 font-medium">Bạn chưa có VPS nào</p>
                <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Link href={`/${locale}/plans`}>Đăng ký VPS ngay</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {vpsList.map((vps, index) => (
                  <div key={vps.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0 hover:bg-slate-50 dark:hover:bg-slate-900 p-2 rounded-lg transition-all duration-200 animate-in fade-in slide-in-from-left-4" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{vps.hostname || "Đang cấu hình..."}</p>
                      <p className="text-xs text-muted-foreground">{vps.ip_address || "Chờ IP"}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <div
                          className={`h-2 w-2 rounded-full animate-pulse ${vps.power_status === "running"
                            ? "bg-green-500"
                            : vps.power_status === "stopped"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                            }`}
                        />
                        <span className="capitalize text-muted-foreground">
                          {vps.power_status === "running"
                            ? "Đang chạy"
                            : vps.power_status === "stopped"
                              ? "Đã tắt"
                              : vps.status}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {vps.vcpu} vCPU / {vps.ram_gb}GB RAM
                      </div>
                      <Button variant="outline" size="sm" asChild className="hover:bg-blue-50 hover:text-blue-600 dark:hover:text-blue-400 border dark:border-gray-700 hover:border-blue-300 hover:scale-105 transition-all">
                        <Link href={`/${locale}/client-dashboard/vps/${vps.id}`}>Quản lý</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-3 animate-in fade-in slide-in-from-right-4 duration-700">
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {vpsList.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground animate-in zoom-in duration-500">
                    <Clock className="h-8 w-8 mb-2" />
                    <p className="text-sm">Chưa có hoạt động nào</p>
                  </div>
                </div>
              ) : (
                vpsList.slice(0, 3).map((vps, i) => (
                  <div key={i} className="flex items-center border-b hover:bg-slate-50 dark:hover:bg-slate-900 p-2 rounded-lg transition-colors animate-in fade-in slide-in-from-right-4" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">VPS được tạo</p>
                      <p className="text-xs text-muted-foreground">
                        {vps.hostname || "Đang cấu hình"} - {new Date(vps.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div >
  )
}
