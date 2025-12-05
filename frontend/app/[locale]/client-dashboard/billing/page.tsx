import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Download, Plus, TrendingUp } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Tài chính</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nạp tiền
        </Button>
      </div>

      {/* Balance & Usage Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Số dư khả dụng</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1.250.000 ₫</div>
            <p className="text-xs text-muted-foreground mt-1">Đủ cho ~2 tháng sử dụng</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chi phí tháng này</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">485.000 ₫</div>
            <p className="text-xs text-muted-foreground mt-1">+12% so với tháng trước</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dự kiến thanh toán</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">620.000 ₫</div>
            <p className="text-xs text-muted-foreground mt-1">Ngày 1 tháng tới</p>
          </CardContent>
        </Card>
      </div>

      {/* Resource Usage This Month */}
      <Card>
        <CardHeader>
          <CardTitle>Sử dụng tài nguyên tháng này</CardTitle>
          <CardDescription>Chi tiết chi phí theo từng dịch vụ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {[
            { service: "VPS - web-server-01 (4 vCPU, 8GB RAM)", cost: 250000, usage: 100, color: "bg-blue-500" },
            { service: "VPS - db-master (8 vCPU, 16GB RAM)", cost: 180000, usage: 75, color: "bg-green-500" },
            { service: "VPS - test-env (2 vCPU, 4GB RAM)", cost: 35000, usage: 45, color: "bg-purple-500" },
            { service: "Băng thông (150GB)", cost: 20000, usage: 60, color: "bg-orange-500" },
          ].map((item, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.service}</span>
                <span className="font-semibold">{item.cost.toLocaleString()} ₫</span>
              </div>
              <Progress value={item.usage} className={`h-2 ${item.color}`} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử hóa đơn</CardTitle>
          <CardDescription>Tất cả giao dịch và hóa đơn của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã hóa đơn</TableHead>
                <TableHead>Ngày phát hành</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                {
                  id: "INV-2024001",
                  date: "01/11/2024",
                  desc: "Thanh toán dịch vụ VPS",
                  status: "paid",
                  amount: 620000,
                },
                {
                  id: "INV-2024002",
                  date: "15/11/2024",
                  desc: "Nạp tiền vào tài khoản",
                  status: "paid",
                  amount: 1000000,
                },
                {
                  id: "INV-2024003",
                  date: "20/11/2024",
                  desc: "Phí băng thông vượt mức",
                  status: "pending",
                  amount: 50000,
                },
              ].map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium font-mono">{invoice.id}</TableCell>
                  <TableCell>{invoice.date}</TableCell>
                  <TableCell>{invoice.desc}</TableCell>
                  <TableCell>
                    <Badge variant={invoice.status === "paid" ? "default" : "secondary"}>
                      {invoice.status === "paid" ? "Đã thanh toán" : "Chờ xử lý"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{invoice.amount.toLocaleString()} ₫</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
