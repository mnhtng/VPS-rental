import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Server, CreditCard, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Tổng quan</h1>
        <Button asChild>
          <Link href="/client-dashboard/vps/create">Đăng ký VPS mới</Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VPS Đang chạy</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">+1 trong tháng này</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trạng thái hệ thống</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Ổn định</div>
            <p className="text-xs text-muted-foreground">Uptime 99.9%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Số dư tài khoản</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.250.000 ₫</div>
            <p className="text-xs text-muted-foreground">Tự động gia hạn: Bật</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hỗ trợ</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Ticket đang mở</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity / VPS List Preview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Danh sách VPS của bạn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "web-server-01", ip: "103.15.22.10", status: "running", cpu: "15%", ram: "2.4GB" },
                { name: "db-master", ip: "103.15.22.11", status: "running", cpu: "45%", ram: "6.1GB" },
                { name: "test-env", ip: "103.15.22.12", status: "stopped", cpu: "0%", ram: "0GB" },
              ].map((vps, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{vps.name}</p>
                    <p className="text-xs text-muted-foreground">{vps.ip}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <div
                        className={`h-2 w-2 rounded-full ${vps.status === "running" ? "bg-green-500" : "bg-red-500"}`}
                      />
                      <span className="capitalize text-muted-foreground">
                        {vps.status === "running" ? "Đang chạy" : "Đã tắt"}
                      </span>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/client-dashboard/vps/${i + 100}`}>Quản lý</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {[
                { action: "Khởi động lại VPS", target: "web-server-01", time: "2 phút trước" },
                { action: "Tạo Snapshot", target: "db-master", time: "1 giờ trước" },
                { action: "Thanh toán hóa đơn", target: "#INV-2024001", time: "Hôm qua" },
              ].map((item, i) => (
                <div key={i} className="flex items-center">
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{item.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.target} - {item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
