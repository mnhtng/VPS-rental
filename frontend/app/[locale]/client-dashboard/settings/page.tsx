"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Key, User, Bell, Shield, Terminal } from "lucide-react"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("profile")

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1200)
    return () => clearTimeout(timer)
  }, [activeTab])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h1 className="text-3xl font-bold tracking-tight">Cài đặt</h1>

      <Tabs defaultValue="profile" className="space-y-4" onValueChange={(value) => { setActiveTab(value); setLoading(true); }}>
        <TabsList className="w-full justify-start overflow-x-auto animate-in fade-in slide-in-from-top-4 duration-500">
          <TabsTrigger value="profile" className="hover:scale-105 transition-all">
            <User className="mr-2 h-4 w-4" /> Hồ sơ
          </TabsTrigger>
          <TabsTrigger value="security" className="hover:scale-105 transition-all">
            <Shield className="mr-2 h-4 w-4" /> Bảo mật
          </TabsTrigger>
          <TabsTrigger value="ssh-keys" className="hover:scale-105 transition-all">
            <Terminal className="mr-2 h-4 w-4" /> SSH Keys
          </TabsTrigger>
          <TabsTrigger value="api" className="hover:scale-105 transition-all">
            <Key className="mr-2 h-4 w-4" /> API Keys
          </TabsTrigger>
          <TabsTrigger value="notifications" className="hover:scale-105 transition-all">
            <Bell className="mr-2 h-4 w-4" /> Thông báo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          {loading ? (
            <Card className="animate-in fade-in zoom-in-95 duration-300">
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-64 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-32" />
              </CardContent>
            </Card>
          ) : (
            <Card className="hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
              <CardHeader>
                <CardTitle>Thông tin cá nhân</CardTitle>
                <CardDescription>Cập nhật thông tin tài khoản của bạn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 animate-in fade-in" style={{ animationDelay: '50ms' }}>
                    <Label htmlFor="fullname">Họ và tên</Label>
                    <Input id="fullname" placeholder="Nguyễn Văn A" defaultValue="Nguyễn Văn A" className="transition-all focus:scale-[1.01]" />
                  </div>
                  <div className="space-y-2 animate-in fade-in" style={{ animationDelay: '100ms' }}>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="email@example.com" defaultValue="user@example.com" className="transition-all focus:scale-[1.01]" />
                  </div>
                </div>
                <div className="space-y-2 animate-in fade-in" style={{ animationDelay: '150ms' }}>
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input id="phone" placeholder="+84 xxx xxx xxx" defaultValue="+84 912 345 678" className="transition-all focus:scale-[1.01]" />
                </div>
                <div className="space-y-2 animate-in fade-in" style={{ animationDelay: '200ms' }}>
                  <Label htmlFor="company">Công ty (tùy chọn)</Label>
                  <Input id="company" placeholder="Tên công ty" className="transition-all focus:scale-[1.01]" />
                </div>
                <Separator className="animate-in fade-in" style={{ animationDelay: '250ms' }} />
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 transition-all animate-in fade-in" style={{ animationDelay: '300ms' }}>Lưu thay đổi</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          {loading ? (
            <>
              <Card className="animate-in fade-in zoom-in-95 duration-300">
                <CardHeader>
                  <Skeleton className="h-6 w-36" />
                  <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                  <Skeleton className="h-10 w-40" />
                </CardContent>
              </Card>
              <Card className="animate-in fade-in zoom-in-95 duration-300" style={{ animationDelay: '100ms' }}>
                <CardHeader>
                  <Skeleton className="h-6 w-52" />
                  <Skeleton className="h-4 w-56 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-6 w-11 rounded-full" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card className="hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                <CardHeader>
                  <CardTitle>Đổi mật khẩu</CardTitle>
                  <CardDescription>Bảo vệ tài khoản của bạn bằng mật khẩu mạnh</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 animate-in fade-in" style={{ animationDelay: '50ms' }}>
                    <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
                    <Input id="current-password" type="password" className="transition-all focus:scale-[1.01]" />
                  </div>
                  <div className="space-y-2 animate-in fade-in" style={{ animationDelay: '100ms' }}>
                    <Label htmlFor="new-password">Mật khẩu mới</Label>
                    <Input id="new-password" type="password" className="transition-all focus:scale-[1.01]" />
                  </div>
                  <div className="space-y-2 animate-in fade-in" style={{ animationDelay: '150ms' }}>
                    <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
                    <Input id="confirm-password" type="password" className="transition-all focus:scale-[1.01]" />
                  </div>
                  <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 hover:scale-105 transition-all animate-in fade-in" style={{ animationDelay: '200ms' }}>Cập nhật mật khẩu</Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '100ms' }}>
                <CardHeader>
                  <CardTitle>Xác thực hai yếu tố (2FA)</CardTitle>
                  <CardDescription>Tăng cường bảo mật với xác thực hai lớp</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between animate-in fade-in" style={{ animationDelay: '150ms' }}>
                    <div className="space-y-0.5">
                      <div className="font-medium">Bật 2FA</div>
                      <div className="text-sm text-muted-foreground">Yêu cầu mã xác thực khi đăng nhập</div>
                    </div>
                    <Switch className="data-[state=checked]:bg-green-600" />
                  </div>
                  <Separator className="animate-in fade-in" style={{ animationDelay: '200ms' }} />
                  <Button variant="outline" className="hover:scale-105 transition-all animate-in fade-in" style={{ animationDelay: '250ms' }}>Cấu hình Authenticator App</Button>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="ssh-keys" className="space-y-4">
          {loading ? (
            <Card className="animate-in fade-in zoom-in-95 duration-300">
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-80 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-32 mt-2" />
                </div>
                <div className="space-y-2 pt-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-24 w-full" />
                </div>
                <Skeleton className="h-10 w-36" />
              </CardContent>
            </Card>
          ) : (
            <Card className="hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
              <CardHeader>
                <CardTitle>Quản lý SSH Keys</CardTitle>
                <CardDescription>Thêm SSH keys để truy cập VPS Linux an toàn mà không cần mật khẩu</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-muted/50 p-4 hover:bg-muted/70 transition-all animate-in fade-in" style={{ animationDelay: '50ms' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Terminal className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Macbook Pro - Home</span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 hover:scale-105 transition-all">
                      Xóa
                    </Button>
                  </div>
                  <div className="font-mono text-xs text-muted-foreground break-all bg-background p-2 rounded border">
                    ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC...user@macbook
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">Thêm ngày: 20/11/2024</div>
                </div>

                <div className="space-y-2 pt-4 animate-in fade-in" style={{ animationDelay: '100ms' }}>
                  <Label htmlFor="ssh-key-name">Tên gợi nhớ</Label>
                  <Input id="ssh-key-name" placeholder="Ví dụ: Laptop Công ty" className="transition-all focus:scale-[1.01]" />
                </div>
                <div className="space-y-2 animate-in fade-in" style={{ animationDelay: '150ms' }}>
                  <Label htmlFor="ssh-key-content">Nội dung Public Key</Label>
                  <textarea
                    id="ssh-key-content"
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all focus:scale-[1.01]"
                    placeholder="ssh-rsa AAAA..."
                  />
                </div>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 transition-all animate-in fade-in" style={{ animationDelay: '200ms' }}>Thêm SSH Key</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          {loading ? (
            <Card className="animate-in fade-in zoom-in-95 duration-300">
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-72 mt-2" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="rounded-lg border bg-muted/50 p-4" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex items-center justify-between mb-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-3 w-32 mt-2" />
                  </div>
                ))}
                <Skeleton className="h-10 w-44" />
              </CardContent>
            </Card>
          ) : (
            <Card className="hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
              <CardHeader>
                <CardTitle>Quản lý API Keys</CardTitle>
                <CardDescription>Sử dụng API keys để tích hợp với Proxmox API</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-muted/50 p-4 hover:bg-muted/70 transition-all animate-in fade-in" style={{ animationDelay: '50ms' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                      Production API Key
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 hover:scale-105 transition-all">
                      Xóa
                    </Button>
                  </div>
                  <div className="font-mono text-sm bg-background p-2 rounded border select-all hover:bg-blue-50 transition-colors">
                    pk_live_51HxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">Tạo ngày: 15/11/2024</div>
                </div>
                <div className="rounded-lg border bg-muted/50 p-4 hover:bg-muted/70 transition-all animate-in fade-in" style={{ animationDelay: '100ms' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></span>
                      Development API Key
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 hover:scale-105 transition-all">
                      Xóa
                    </Button>
                  </div>
                  <div className="font-mono text-sm bg-background p-2 rounded border select-all hover:bg-blue-50 transition-colors">
                    pk_test_51HxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">Tạo ngày: 10/11/2024</div>
                </div>
                <Button variant="outline" className="hover:scale-105 transition-all animate-in fade-in" style={{ animationDelay: '150ms' }}>
                  <Key className="mr-2 h-4 w-4" /> Tạo API Key mới
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          {loading ? (
            <Card className="animate-in fade-in zoom-in-95 duration-300">
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-64 mt-2" />
              </CardHeader>
              <CardContent className="space-y-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between animate-in fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-64" />
                      </div>
                      <Skeleton className="h-6 w-11 rounded-full" />
                    </div>
                    {i < 4 && <Skeleton className="h-px w-full my-6" />}
                  </div>
                ))}
                <Skeleton className="h-10 w-32" />
              </CardContent>
            </Card>
          ) : (
            <Card className="hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
              <CardHeader>
                <CardTitle>Tùy chọn thông báo</CardTitle>
                <CardDescription>Chọn cách bạn muốn nhận thông báo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between hover:bg-muted/50 p-2 rounded-lg transition-all animate-in fade-in" style={{ animationDelay: '50ms' }}>
                  <div className="space-y-0.5">
                    <div className="font-medium">Email thông báo hệ thống</div>
                    <div className="text-sm text-muted-foreground">Nhận thông báo về bảo trì, cập nhật</div>
                  </div>
                  <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                </div>
                <Separator className="animate-in fade-in" style={{ animationDelay: '100ms' }} />
                <div className="flex items-center justify-between hover:bg-muted/50 p-2 rounded-lg transition-all animate-in fade-in" style={{ animationDelay: '150ms' }}>
                  <div className="space-y-0.5">
                    <div className="font-medium">Cảnh báo tài nguyên</div>
                    <div className="text-sm text-muted-foreground">Thông báo khi CPU/RAM vượt 80%</div>
                  </div>
                  <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                </div>
                <Separator className="animate-in fade-in" style={{ animationDelay: '200ms' }} />
                <div className="flex items-center justify-between hover:bg-muted/50 p-2 rounded-lg transition-all animate-in fade-in" style={{ animationDelay: '250ms' }}>
                  <div className="space-y-0.5">
                    <div className="font-medium">Thông báo thanh toán</div>
                    <div className="text-sm text-muted-foreground">Nhắc nhở hóa đơn sắp đến hạn</div>
                  </div>
                  <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                </div>
                <Separator className="animate-in fade-in" style={{ animationDelay: '300ms' }} />
                <div className="flex items-center justify-between hover:bg-muted/50 p-2 rounded-lg transition-all animate-in fade-in" style={{ animationDelay: '350ms' }}>
                  <div className="space-y-0.5">
                    <div className="font-medium">Bản tin Marketing</div>
                    <div className="text-sm text-muted-foreground">Tin tức, khuyến mãi từ CloudVPS</div>
                  </div>
                  <Switch />
                </div>
                <Separator className="animate-in fade-in" style={{ animationDelay: '400ms' }} />
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 transition-all animate-in fade-in" style={{ animationDelay: '450ms' }}>Lưu tùy chọn</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
