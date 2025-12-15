"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CreditCard, Download, Plus, TrendingUp, Receipt } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export default function BillingPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h1 className="text-3xl font-bold tracking-tight">Tài chính</h1>

      {/* Balance & Usage Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
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
                <CardTitle className="text-sm font-medium">Số dư khả dụng</CardTitle>
                <CreditCard className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">1.250.000 ₫</div>
                <p className="text-xs text-muted-foreground mt-1">Đủ cho ~2 tháng sử dụng</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '50ms' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chi phí tháng này</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">485.000 ₫</div>
                <p className="text-xs text-muted-foreground mt-1">+12% so với tháng trước</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '100ms' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dự kiến thanh toán</CardTitle>
                <CreditCard className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">620.000 ₫</div>
                <p className="text-xs text-muted-foreground mt-1">Ngày 1 tháng tới</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Resource Usage This Month */}
      <Card className="animate-in fade-in slide-in-from-left-4 duration-500">
        <CardHeader>
          <CardTitle>Sử dụng tài nguyên tháng này</CardTitle>
          <CardDescription>Chi tiết chi phí theo từng dịch vụ</CardDescription>
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
              {[
                { service: "VPS - web-server-01 (4 vCPU, 8GB RAM)", cost: 250000, usage: 100, color: "bg-blue-500" },
                { service: "VPS - db-master (8 vCPU, 16GB RAM)", cost: 180000, usage: 75, color: "bg-green-500" },
                { service: "VPS - test-env (2 vCPU, 4GB RAM)", cost: 35000, usage: 45, color: "bg-purple-500" },
                { service: "Băng thông (150GB)", cost: 20000, usage: 60, color: "bg-orange-500" },
              ].map((item, i) => (
                <div key={i} className="space-y-2 animate-in fade-in slide-in-from-left-4" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{item.service}</span>
                    <span className="font-semibold">{item.cost.toLocaleString()} ₫</span>
                  </div>
                  <Progress value={item.usage} className={`h-2 ${item.color}`} />
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card className="animate-in fade-in slide-in-from-right-4 duration-500">
        <CardHeader>
          <CardTitle>Lịch sử hóa đơn</CardTitle>
          <CardDescription>Tất cả giao dịch và hóa đơn của bạn</CardDescription>
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
            <div className="overflow-x-auto">
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
                  ].map((invoice, index) => (
                    <TableRow
                      key={invoice.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors animate-in fade-in slide-in-from-left-4"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell className="font-medium font-mono">{invoice.id}</TableCell>
                      <TableCell>{invoice.date}</TableCell>
                      <TableCell>{invoice.desc}</TableCell>
                      <TableCell>
                        <Badge variant={invoice.status === "paid" ? "default" : "secondary"} className={invoice.status === "paid" ? "bg-green-500 hover:bg-green-600" : ""}>
                          {invoice.status === "paid" ? "Đã thanh toán" : "Chờ xử lý"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{invoice.amount.toLocaleString()} ₫</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:text-blue-600 dark:hover:text-blue-400 border dark:border-gray-700 hover:border-blue-300 hover:scale-105 transition-all">
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Empty state */}
              {false && (
                <div className="flex flex-col items-center justify-center py-16 text-center animate-in zoom-in duration-500">
                  <div className="rounded-full bg-gradient-to-br from-blue-100 to-purple-100 p-6 mb-4">
                    <Receipt className="h-16 w-16 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Chưa có hóa đơn</h3>
                  <p className="text-muted-foreground mb-6">Các giao dịch của bạn sẽ hiển thị ở đây</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
