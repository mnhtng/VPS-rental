"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Square, Terminal, HardDrive, Shield, Activity, Network, Server } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { UsageChart } from "@/components/custom/chart/usage-chart"
import VNCConsole from "@/components/custom/console/VNCConsole"
import { apiPattern } from "@/utils/pattern"
import { cn } from "@/lib/utils"
import { VPSItemPlaceholder } from "@/components/custom/placeholder/vps"

export default function VPSDetail() {
  const params = useParams();
  const vpsId = params.id as string;

  const [loading, setLoading] = useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [vpsInfo, setVpsInfo] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchVPSInfo = async () => {
    setLoading(true)
    try {
      const response = await apiPattern(
        `${process.env.NEXT_PUBLIC_API_URL}/vps/${vpsId}/info`,
        { method: 'GET' }
      )

      if (response.ok) {
        const data = await response.json()
        console.log('>>> VPS Info:', data)
        setVpsInfo(data)
      }
    } catch (error) {
      console.error('Failed to fetch VPS info:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVPSInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vpsId])

  return (
    <div className={cn(
      "space-y-6 w-full h-full animate-in fade-in slide-in-from-bottom-4 duration-700",
      !vpsInfo && "justify-center flex"
    )}>
      {/* Header Section */}
      {loading ? (
        <VPSItemPlaceholder />
      ) : vpsInfo ? (
        <>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-in fade-in slide-in-from-top-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {vpsInfo.hostname || 'Đang cấu hình...'}
                </h1>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full animate-pulse ${vpsInfo.power_status === 'running'
                      ? 'bg-green-500'
                      : vpsInfo.power_status === 'stopped'
                        ? 'bg-red-500'
                        : 'bg-yellow-500'
                      }`}
                  />
                  <Badge className={vpsInfo.power_status === 'running' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}>
                    {vpsInfo.power_status === 'running' ? 'Đang chạy' : vpsInfo.power_status === 'stopped' ? 'Đã tắt' : vpsInfo.status}
                  </Badge>
                </div>
              </div>
              <p className="text-muted-foreground mt-1">
                {vpsInfo.os || 'N/A'} • {vpsInfo.vcpu || 0} vCPU • {vpsInfo.ram_gb || 0}GB RAM • {vpsInfo.storage_gb || 0}GB {vpsInfo.storage_type || 'Disk'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent hover:scale-105 transition-all"
                disabled={actionLoading || vpsInfo.power_status === 'stopped'}
              >
                <Square className="mr-2 h-4 w-4" /> Force Stop
              </Button>
              <Button
                variant="outline"
                className="hover:scale-105 transition-all"
                disabled={actionLoading || vpsInfo.power_status === 'stopped'}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${actionLoading ? 'animate-spin' : ''}`} /> Reboot
              </Button>
              <Button
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 hover:scale-105 transition-all"
                disabled={vpsInfo.power_status !== 'running'}
              >
                <Terminal className="mr-2 h-4 w-4" /> Console
              </Button>
            </div>
          </div>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview">Tổng quan</TabsTrigger>
              <TabsTrigger value="console">Console (VNC)</TabsTrigger>
              <TabsTrigger value="snapshots">Snapshots</TabsTrigger>
              <TabsTrigger value="network">Mạng</TabsTrigger>
              <TabsTrigger value="settings">Cài đặt</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '0ms' }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                    <Activity className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{vpsInfo.cpu_usage || '0'}%</div>
                    <p className="text-xs text-muted-foreground">{vpsInfo.vcpu || 0} Cores</p>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '50ms' }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Memory</CardTitle>
                    <Activity className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {vpsInfo.memory_usage ? `${(vpsInfo.memory_usage / 1024 / 1024 / 1024).toFixed(1)} GB` : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">of {vpsInfo.ram_gb || 0} GB</p>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '100ms' }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
                    <HardDrive className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {vpsInfo.disk_usage ? `${(vpsInfo.disk_usage / 1024 / 1024 / 1024).toFixed(0)} GB` : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">of {vpsInfo.storage_gb || 0} GB</p>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '150ms' }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Network</CardTitle>
                    <Network className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {vpsInfo.network_rate ? `${(vpsInfo.network_rate / 1024 / 1024).toFixed(2)} MB/s` : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">Current rate</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-7">
                <Card className="lg:col-span-4 animate-in fade-in slide-in-from-left-4 duration-500">
                  <CardHeader>
                    <CardTitle>Hiệu năng (24h qua)</CardTitle>
                    <CardDescription>Dữ liệu thời gian thực từ Proxmox RRD</CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <UsageChart />
                  </CardContent>
                </Card>
                <Card className="lg:col-span-3 animate-in fade-in slide-in-from-right-4 duration-500">
                  <CardHeader>
                    <CardTitle>Thông tin chi tiết</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-muted-foreground">VM ID</div>
                      <div className="font-medium">{vpsInfo.vmid || 'N/A'}</div>
                      <div className="text-muted-foreground">Node</div>
                      <div className="font-medium">{vpsInfo.node || 'N/A'}</div>
                      <div className="text-muted-foreground">IP Address</div>
                      <div className="font-medium font-mono">{vpsInfo.ip_address || 'Chờ IP'}</div>
                      <div className="text-muted-foreground">Gateway</div>
                      <div className="font-medium font-mono">{vpsInfo.gateway || 'N/A'}</div>
                      <div className="text-muted-foreground">MAC Address</div>
                      <div className="font-medium font-mono">{vpsInfo.mac_address || 'N/A'}</div>
                      <div className="text-muted-foreground">Uptime</div>
                      <div className="font-medium">{vpsInfo.uptime || 'N/A'}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="console" className="space-y-4">
              <div className="animate-in fade-in zoom-in duration-500">
                <VNCConsole vmId={vpsInfo.vmid?.toString() || '108'} node={vpsInfo.node || 'pve'} />
              </div>
              <div className="text-sm text-muted-foreground">
                Sử dụng nút Ctrl+Alt+Del trong toolbar để gửi lệnh reset mềm tới máy ảo.
                Nếu console không hiển thị trong trang, hãy sử dụng nút &quot;Open in New Window&quot;.
              </div>
            </TabsContent>

            <TabsContent value="snapshots" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Snapshots</CardTitle>
                      <CardDescription>Tạo điểm khôi phục cho VPS của bạn.</CardDescription>
                    </div>
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 transition-all">
                      <Shield className="mr-2 h-4 w-4" /> Tạo Snapshot mới
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: "Before Update PHP 8.2", date: "20/11/2023 10:00", size: "2.1 GB" },
                      { name: "Clean Install", date: "01/11/2023 09:00", size: "1.5 GB" },
                    ].map((snap, i) => (
                      <div key={i} className="flex items-center justify-between border p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 hover:shadow-md transition-all animate-in fade-in slide-in-from-left-4" style={{ animationDelay: `${i * 100}ms` }}>
                        <div>
                          <p className="font-medium">{snap.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {snap.date} • {snap.size}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:text-blue-600 hover:scale-105 transition-all">
                            Rollback
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 hover:scale-105 transition-all">
                            Xóa
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="network" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Cấu hình mạng</CardTitle>
                  <CardDescription>Quản lý địa chỉ IP và cài đặt mạng của VPS</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>IPv4 Address</Label>
                      <Input value="103.15.22.10" disabled className="font-mono" />
                    </div>
                    <div className="space-y-2">
                      <Label>Gateway</Label>
                      <Input value="103.15.22.1" disabled className="font-mono" />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Subnet Mask</Label>
                      <Input value="255.255.255.0" disabled className="font-mono" />
                    </div>
                    <div className="space-y-2">
                      <Label>DNS Server</Label>
                      <Input value="8.8.8.8, 8.8.4.4" disabled className="font-mono" />
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium">Reverse DNS (PTR Record)</h4>
                    <div className="space-y-2">
                      <Label htmlFor="ptr">PTR Record</Label>
                      <Input id="ptr" placeholder="mail.example.com" />
                    </div>
                    <Button variant="outline">Cập nhật PTR</Button>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium">Firewall</h4>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="font-medium">Bật Firewall</div>
                        <div className="text-sm text-muted-foreground">Bảo vệ VPS với firewall tích hợp</div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <Button variant="outline" className="w-full bg-transparent">
                      <Network className="mr-2 h-4 w-4" /> Quản lý quy tắc Firewall
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Băng thông sử dụng</CardTitle>
                  <CardDescription>Theo dõi lưu lượng mạng của bạn</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Inbound (Tháng này)</span>
                      <span className="text-sm font-semibold">85 GB / 1000 GB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Outbound (Tháng này)</span>
                      <span className="text-sm font-semibold">65 GB / 1000 GB</span>
                    </div>
                    <Separator />
                    <div className="text-xs text-muted-foreground">Reset vào ngày 1 hàng tháng</div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Cài đặt hệ điều hành</CardTitle>
                  <CardDescription>Cài đặt lại hoặc thay đổi hệ điều hành</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Hệ điều hành hiện tại</Label>
                    <Input value="Ubuntu 22.04 LTS" disabled />
                  </div>
                  <Button variant="destructive" className="w-full">
                    Cài đặt lại hệ điều hành
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Cảnh báo: Thao tác này sẽ xóa toàn bộ dữ liệu trên VPS. Hãy tạo snapshot trước khi thực hiện.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cấu hình phần cứng</CardTitle>
                  <CardDescription>Nâng cấp CPU, RAM hoặc ổ cứng</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>vCPU</Label>
                      <Input value="4 Cores" disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>RAM</Label>
                      <Input value="8 GB" disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Storage</Label>
                      <Input value="160 GB NVMe" disabled />
                    </div>
                  </div>
                  <Button variant="outline" className="w-full bg-transparent">
                    Nâng cấp cấu hình
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sao lưu tự động</CardTitle>
                  <CardDescription>Cấu hình backup tự động hàng ngày</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-medium">Bật backup tự động</div>
                      <div className="text-sm text-muted-foreground">Tạo snapshot tự động mỗi ngày lúc 2:00 AM</div>
                    </div>
                    <Switch />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Số lượng backup giữ lại</Label>
                    <Input type="number" defaultValue="7" />
                  </div>
                  <Button>Lưu cài đặt</Button>
                </CardContent>
              </Card>

              <Card className="border-red-200 dark:border-red-900">
                <CardHeader>
                  <CardTitle className="text-red-600">Vùng nguy hiểm</CardTitle>
                  <CardDescription>Các thao tác không thể hoàn tác</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="destructive" className="w-full">
                    Xóa VPS vĩnh viễn
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Thao tác này sẽ xóa hoàn toàn VPS và tất cả dữ liệu liên quan. Không thể khôi phục.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="my-auto flex flex-col items-center justify-center py-16 text-center animate-in zoom-in duration-500">
          <div className="rounded-full bg-gradient-to-br from-blue-100 to-purple-100 p-6 mb-4">
            <Server className="h-16 w-16 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">VPS không tồn tại</h3>
          <p className="text-muted-foreground mb-6">Không tìm thấy thông tin VPS này</p>
        </div>
      )}

    </div>
  )
}
