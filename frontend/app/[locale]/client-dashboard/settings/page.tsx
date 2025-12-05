import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Key, User, Bell, Shield, Terminal } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cài đặt</h1>
        <p className="text-muted-foreground mt-2">Quản lý thông tin tài khoản và cấu hình hệ thống</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" /> Hồ sơ
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" /> Bảo mật
          </TabsTrigger>
          <TabsTrigger value="ssh-keys">
            <Terminal className="mr-2 h-4 w-4" /> SSH Keys
          </TabsTrigger>
          <TabsTrigger value="api">
            <Key className="mr-2 h-4 w-4" /> API Keys
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" /> Thông báo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
              <CardDescription>Cập nhật thông tin tài khoản của bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullname">Họ và tên</Label>
                  <Input id="fullname" placeholder="Nguyễn Văn A" defaultValue="Nguyễn Văn A" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="email@example.com" defaultValue="user@example.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input id="phone" placeholder="+84 xxx xxx xxx" defaultValue="+84 912 345 678" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Công ty (tùy chọn)</Label>
                <Input id="company" placeholder="Tên công ty" />
              </div>
              <Separator />
              <Button>Lưu thay đổi</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Đổi mật khẩu</CardTitle>
              <CardDescription>Bảo vệ tài khoản của bạn bằng mật khẩu mạnh</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Mật khẩu hiện tại</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Mật khẩu mới</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Xác nhận mật khẩu mới</Label>
                <Input id="confirm-password" type="password" />
              </div>
              <Button>Cập nhật mật khẩu</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Xác thực hai yếu tố (2FA)</CardTitle>
              <CardDescription>Tăng cường bảo mật với xác thực hai lớp</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">Bật 2FA</div>
                  <div className="text-sm text-muted-foreground">Yêu cầu mã xác thực khi đăng nhập</div>
                </div>
                <Switch />
              </div>
              <Separator />
              <Button variant="outline">Cấu hình Authenticator App</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ssh-keys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quản lý SSH Keys</CardTitle>
              <CardDescription>Thêm SSH keys để truy cập VPS Linux an toàn mà không cần mật khẩu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    <span className="font-medium">Macbook Pro - Home</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-500">
                    Xóa
                  </Button>
                </div>
                <div className="font-mono text-xs text-muted-foreground break-all">
                  ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC...user@macbook
                </div>
                <div className="text-xs text-muted-foreground mt-2">Thêm ngày: 20/11/2024</div>
              </div>

              <div className="space-y-2 pt-4">
                <Label htmlFor="ssh-key-name">Tên gợi nhớ</Label>
                <Input id="ssh-key-name" placeholder="Ví dụ: Laptop Công ty" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ssh-key-content">Nội dung Public Key</Label>
                <textarea
                  id="ssh-key-content"
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="ssh-rsa AAAA..."
                />
              </div>
              <Button>Thêm SSH Key</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quản lý API Keys</CardTitle>
              <CardDescription>Sử dụng API keys để tích hợp với Proxmox API</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">Production API Key</div>
                  <Button variant="ghost" size="sm" className="text-red-500">
                    Xóa
                  </Button>
                </div>
                <div className="font-mono text-sm bg-background p-2 rounded border">
                  pk_live_51HxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
                </div>
                <div className="text-xs text-muted-foreground mt-2">Tạo ngày: 15/11/2024</div>
              </div>
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">Development API Key</div>
                  <Button variant="ghost" size="sm" className="text-red-500">
                    Xóa
                  </Button>
                </div>
                <div className="font-mono text-sm bg-background p-2 rounded border">
                  pk_test_51HxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
                </div>
                <div className="text-xs text-muted-foreground mt-2">Tạo ngày: 10/11/2024</div>
              </div>
              <Button variant="outline">
                <Key className="mr-2 h-4 w-4" /> Tạo API Key mới
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tùy chọn thông báo</CardTitle>
              <CardDescription>Chọn cách bạn muốn nhận thông báo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">Email thông báo hệ thống</div>
                  <div className="text-sm text-muted-foreground">Nhận thông báo về bảo trì, cập nhật</div>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">Cảnh báo tài nguyên</div>
                  <div className="text-sm text-muted-foreground">Thông báo khi CPU/RAM vượt 80%</div>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">Thông báo thanh toán</div>
                  <div className="text-sm text-muted-foreground">Nhắc nhở hóa đơn sắp đến hạn</div>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">Bản tin Marketing</div>
                  <div className="text-sm text-muted-foreground">Tin tức, khuyến mãi từ CloudVPS</div>
                </div>
                <Switch />
              </div>
              <Separator />
              <Button>Lưu tùy chọn</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
