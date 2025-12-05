"use client"

import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Square, Terminal, HardDrive, Shield, Activity, Network } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { UsageChart } from "@/components/custom/chart/usage-chart"
import VNCConsole from "@/components/custom/console/VNCConsole"

export default function VPSDetail() {
  const params = useParams();
  const vmId = params.id as string;
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">web-server-01</h1>
            <Badge className="bg-green-500 hover:bg-green-600">Running</Badge>
          </div>
          <p className="text-muted-foreground mt-1">Ubuntu 22.04 LTS • 4 vCPU • 8GB RAM • 160GB NVMe</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent">
            <Square className="mr-2 h-4 w-4" /> Force Stop
          </Button>
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" /> Reboot
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">
            <Terminal className="mr-2 h-4 w-4" /> Console
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="console">Console (VNC)</TabsTrigger>
          <TabsTrigger value="snapshots">Snapshots</TabsTrigger>
          <TabsTrigger value="network">Mạng</TabsTrigger>
          <TabsTrigger value="settings">Cài đặt</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12%</div>
                <p className="text-xs text-muted-foreground">4 Cores</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.4 GB</div>
                <p className="text-xs text-muted-foreground">of 8 GB (30%)</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45 GB</div>
                <p className="text-xs text-muted-foreground">of 160 GB (28%)</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Network In/Out</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.2 MB/s</div>
                <p className="text-xs text-muted-foreground">Total: 150 GB</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Hiệu năng (24h qua)</CardTitle>
                <CardDescription>Dữ liệu thời gian thực từ Proxmox RRD</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <UsageChart />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Thông tin chi tiết</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-muted-foreground">VM ID</div>
                  <div className="font-medium">101</div>
                  <div className="text-muted-foreground">Node</div>
                  <div className="font-medium">pve-cluster-01</div>
                  <div className="text-muted-foreground">IP Address</div>
                  <div className="font-medium font-mono">103.15.22.10</div>
                  <div className="text-muted-foreground">Gateway</div>
                  <div className="font-medium font-mono">103.15.22.1</div>
                  <div className="text-muted-foreground">MAC Address</div>
                  <div className="font-medium font-mono">BC:24:11:AA:BB:CC</div>
                  <div className="text-muted-foreground">Uptime</div>
                  <div className="font-medium">14 ngày, 2 giờ</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="console" className="space-y-4">
          <VNCConsole vmId="110" node="pve" />
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
                <Button>
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
                  <div key={i} className="flex items-center justify-between border p-4 rounded-lg">
                    <div>
                      <p className="font-medium">{snap.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {snap.date} • {snap.size}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Rollback
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
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
    </div>
  )
}
