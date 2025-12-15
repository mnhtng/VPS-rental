"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageCircle, FileText, Plus, ExternalLink, LifeBuoy } from "lucide-react"
import Link from "next/link"

export default function SupportPage() {
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
      <h1 className="text-3xl font-bold tracking-tight">Hỗ trợ khách hàng</h1>

      <div className="grid gap-4 md:grid-cols-3">
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-in fade-in zoom-in-95" style={{ animationDelay: `${i * 50}ms` }}>
                <CardHeader>
                  <Skeleton className="h-8 w-8 rounded mb-2" />
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '0ms' }}>
              <CardHeader>
                <MessageCircle className="h-8 w-8 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                <CardTitle>Live Chat</CardTitle>
                <CardDescription>Trò chuyện trực tiếp với đội ngũ hỗ trợ</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full bg-transparent hover:bg-blue-50 hover:text-blue-600 hover:border-blue-600 hover:scale-105 transition-all">
                  Bắt đầu chat
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '50ms' }}>
              <CardHeader>
                <FileText className="h-8 w-8 text-green-500 mb-2 group-hover:scale-110 transition-transform" />
                <CardTitle>Tài liệu hướng dẫn</CardTitle>
                <CardDescription>Tra cứu hướng dẫn sử dụng chi tiết</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full bg-transparent hover:bg-green-50 hover:text-green-600 hover:border-green-600 hover:scale-105 transition-all" asChild>
                  <Link href="/client-dashboard/docs">
                    Xem tài liệu
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '100ms' }}>
              <CardHeader>
                <MessageCircle className="h-8 w-8 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
                <CardTitle>Community Forum</CardTitle>
                <CardDescription>Tham gia cộng đồng người dùng</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full bg-transparent hover:bg-purple-50 hover:text-purple-600 hover:border-purple-600 hover:scale-105 transition-all" asChild>
                  <Link href="/client-dashboard/forum">
                    Truy cập forum
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card className="animate-in fade-in slide-in-from-left-4 duration-500">
        <CardHeader>
          <CardTitle>Ticket hỗ trợ của bạn</CardTitle>
          <CardDescription>Theo dõi tất cả các yêu cầu hỗ trợ</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between border p-4 rounded-lg animate-in fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-5 w-64" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-9 w-28" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {[
                {
                  id: "TICKET-001",
                  title: "Không thể truy cập Console VNC",
                  status: "open",
                  priority: "high",
                  date: "20/11/2024",
                },
                {
                  id: "TICKET-002",
                  title: "Hướng dẫn backup tự động",
                  status: "answered",
                  priority: "medium",
                  date: "18/11/2024",
                },
                {
                  id: "TICKET-003",
                  title: "Tăng dung lượng ổ cứng",
                  status: "closed",
                  priority: "low",
                  date: "15/11/2024",
                },
              ].map((ticket, index) => (
                <div key={ticket.id} className="flex items-center justify-between border p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-all hover:shadow-md animate-in fade-in slide-in-from-left-4" style={{ animationDelay: `${index * 50}ms` }}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-muted-foreground">{ticket.id}</span>
                      <Badge
                        variant={
                          ticket.priority === "high"
                            ? "destructive"
                            : ticket.priority === "medium"
                              ? "default"
                              : "secondary"
                        }
                        className="animate-in zoom-in"
                      >
                        {ticket.priority === "high" ? "Khẩn cấp" : ticket.priority === "medium" ? "Trung bình" : "Thấp"}
                      </Badge>
                    </div>
                    <p className="font-medium">{ticket.title}</p>
                    <p className="text-sm text-muted-foreground">{ticket.date}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={ticket.status === "closed" ? "secondary" : "default"} className={ticket.status === "open" ? "bg-blue-500" : ticket.status === "answered" ? "bg-green-500" : ""}>
                      {ticket.status === "open" ? "Đang xử lý" : ticket.status === "answered" ? "Đã trả lời" : "Đã đóng"}
                    </Badge>
                    <Button variant="outline" size="sm" className="hover:scale-105 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-600 transition-all">
                      Xem chi tiết
                    </Button>
                  </div>
                </div>
              ))}
              {/* Empty state */}
              {false && (
                <div className="flex flex-col items-center justify-center py-16 text-center animate-in zoom-in duration-500">
                  <div className="rounded-full bg-gradient-to-br from-blue-100 to-green-100 p-6 mb-4">
                    <LifeBuoy className="h-16 w-16 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Chưa có ticket hỗ trợ</h3>
                  <p className="text-muted-foreground mb-6">Tạo ticket mới nếu bạn cần hỗ trợ</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="animate-in fade-in slide-in-from-right-4 duration-500">
        <CardHeader>
          <CardTitle>Gửi yêu cầu hỗ trợ mới</CardTitle>
          <CardDescription>Mô tả vấn đề của bạn chi tiết để chúng tôi có thể hỗ trợ nhanh nhất</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2 animate-in fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className={`w-full ${i === 3 ? 'h-32' : 'h-10'}`} />
                </div>
              ))}
              <Skeleton className="h-10 w-44" />
            </>
          ) : (
            <>
              <div className="space-y-2 animate-in fade-in" style={{ animationDelay: '0ms' }}>
                <Label htmlFor="subject">Tiêu đề</Label>
                <Input id="subject" placeholder="Tóm tắt vấn đề của bạn..." className="transition-all focus:scale-[1.01] focus:border-blue-500" />
              </div>
              <div className="space-y-2 animate-in fade-in" style={{ animationDelay: '50ms' }}>
                <Label htmlFor="vps-select">VPS liên quan (nếu có)</Label>
                <Input id="vps-select" placeholder="Chọn VPS..." className="transition-all focus:scale-[1.01] focus:border-blue-500" />
              </div>
              <div className="space-y-2 animate-in fade-in" style={{ animationDelay: '100ms' }}>
                <Label htmlFor="message">Mô tả chi tiết</Label>
                <Textarea id="message" placeholder="Hãy mô tả vấn đề một cách chi tiết..." rows={6} className="transition-all focus:scale-[1.01] focus:border-blue-500" />
              </div>
              <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 hover:scale-105 transition-all animate-in fade-in" style={{ animationDelay: '150ms' }}>Gửi yêu cầu hỗ trợ</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
