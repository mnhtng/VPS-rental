import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Cpu, HardDrive, MemoryStick } from "lucide-react"

export default function CreateVPSPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Khởi tạo VPS mới</h1>
        <p className="text-muted-foreground mt-2">Chọn cấu hình và triển khai máy chủ ảo của bạn trong vài phút</p>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          {/* Region Selection */}
          <Card>
            <CardHeader>
              <CardTitle>1. Chọn khu vực</CardTitle>
              <CardDescription>Vị trí đặt máy chủ vật lý</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup defaultValue="hcm" className="grid grid-cols-2 gap-4">
                <div>
                  <RadioGroupItem value="hcm" id="hcm" className="peer sr-only" />
                  <Label
                    htmlFor="hcm"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <span className="text-2xl mb-2">🇻🇳</span>
                    <span className="font-semibold">Hồ Chí Minh</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="hn" id="hn" className="peer sr-only" />
                  <Label
                    htmlFor="hn"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <span className="text-2xl mb-2">🇻🇳</span>
                    <span className="font-semibold">Hà Nội</span>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* OS Selection */}
          <Card>
            <CardHeader>
              <CardTitle>2. Chọn Hệ điều hành</CardTitle>
              <CardDescription>Hệ điều hành sẽ được cài đặt sẵn</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {["Ubuntu 22.04", "Ubuntu 20.04", "Debian 11", "CentOS 7", "AlmaLinux 9", "Windows Server 2022"].map(
                  (os) => (
                    <div key={os} className="relative">
                      <input type="radio" name="os" id={os} className="peer sr-only" />
                      <Label
                        htmlFor={os}
                        className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-checked:border-primary cursor-pointer h-24 text-center"
                      >
                        <span className="font-medium">{os}</span>
                      </Label>
                    </div>
                  ),
                )}
              </div>
            </CardContent>
          </Card>

          {/* Plan Selection */}
          <Card>
            <CardHeader>
              <CardTitle>3. Chọn cấu hình (Plan)</CardTitle>
              <CardDescription>Tài nguyên phần cứng cho VPS của bạn</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup defaultValue="basic" className="space-y-4">
                <div className="relative flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="basic" id="basic" />
                  <Label htmlFor="basic" className="flex flex-1 items-center justify-between cursor-pointer">
                    <div className="space-y-1">
                      <div className="font-medium">Basic</div>
                      <div className="text-sm text-muted-foreground flex gap-4">
                        <span className="flex items-center">
                          <Cpu className="w-3 h-3 mr-1" /> 1 Core
                        </span>
                        <span className="flex items-center">
                          <MemoryStick className="w-3 h-3 mr-1" /> 2GB RAM
                        </span>
                        <span className="flex items-center">
                          <HardDrive className="w-3 h-3 mr-1" /> 40GB SSD
                        </span>
                      </div>
                    </div>
                    <div className="font-bold text-lg">150.000đ/tháng</div>
                  </Label>
                </div>
                <div className="relative flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent border-primary bg-primary/5">
                  <RadioGroupItem value="pro" id="pro" />
                  <Label htmlFor="pro" className="flex flex-1 items-center justify-between cursor-pointer">
                    <div className="space-y-1">
                      <div className="font-medium flex items-center">
                        Pro{" "}
                        <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                          Phổ biến
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground flex gap-4">
                        <span className="flex items-center">
                          <Cpu className="w-3 h-3 mr-1" /> 2 Core
                        </span>
                        <span className="flex items-center">
                          <MemoryStick className="w-3 h-3 mr-1" /> 4GB RAM
                        </span>
                        <span className="flex items-center">
                          <HardDrive className="w-3 h-3 mr-1" /> 80GB SSD
                        </span>
                      </div>
                    </div>
                    <div className="font-bold text-lg">300.000đ/tháng</div>
                  </Label>
                </div>
                <div className="relative flex items-center space-x-2 rounded-lg border p-4 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="business" id="business" />
                  <Label htmlFor="business" className="flex flex-1 items-center justify-between cursor-pointer">
                    <div className="space-y-1">
                      <div className="font-medium">Business</div>
                      <div className="text-sm text-muted-foreground flex gap-4">
                        <span className="flex items-center">
                          <Cpu className="w-3 h-3 mr-1" /> 4 Core
                        </span>
                        <span className="flex items-center">
                          <MemoryStick className="w-3 h-3 mr-1" /> 8GB RAM
                        </span>
                        <span className="flex items-center">
                          <HardDrive className="w-3 h-3 mr-1" /> 160GB SSD
                        </span>
                      </div>
                    </div>
                    <div className="font-bold text-lg">600.000đ/tháng</div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Additional Settings */}
          <Card>
            <CardHeader>
              <CardTitle>4. Cấu hình bổ sung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hostname">Hostname</Label>
                <Input id="hostname" placeholder="vps-01" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ssh-key">SSH Key (Khuyên dùng)</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn SSH Key" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Không sử dụng (Dùng mật khẩu root)</SelectItem>
                    <SelectItem value="macbook">Macbook Pro - Home</SelectItem>
                    <SelectItem value="add-new">+ Thêm SSH Key mới</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gói dịch vụ</span>
                <span className="font-medium">Pro Plan</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Khu vực</span>
                <span className="font-medium">Hồ Chí Minh</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Hệ điều hành</span>
                <span className="font-medium">Ubuntu 22.04</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-bold">Tổng cộng</span>
                <span className="text-2xl font-bold text-primary">300.000đ</span>
              </div>
              <div className="text-xs text-muted-foreground text-right">/ tháng</div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" size="lg">
                Thanh toán & Khởi tạo
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
