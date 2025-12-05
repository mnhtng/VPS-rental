import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, FileText, Plus, ExternalLink } from "lucide-react"
import Link from "next/link"

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hỗ trợ khách hàng</h1>
          <p className="text-muted-foreground mt-2">Chúng tôi luôn sẵn sàng giúp đỡ bạn 24/7</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Tạo ticket mới
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <MessageCircle className="h-8 w-8 text-blue-500 mb-2" />
            <CardTitle>Live Chat</CardTitle>
            <CardDescription>Trò chuyện trực tiếp với đội ngũ hỗ trợ</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full bg-transparent">
              Bắt đầu chat
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <FileText className="h-8 w-8 text-green-500 mb-2" />
            <CardTitle>Tài liệu hướng dẫn</CardTitle>
            <CardDescription>Tra cứu hướng dẫn sử dụng chi tiết</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full bg-transparent" asChild>
              <Link href="/client-dashboard/docs">
                Xem tài liệu
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <MessageCircle className="h-8 w-8 text-purple-500 mb-2" />
            <CardTitle>Community Forum</CardTitle>
            <CardDescription>Tham gia cộng đồng người dùng</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full bg-transparent" asChild>
              <Link href="/client-dashboard/forum">
                Truy cập forum
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ticket hỗ trợ của bạn</CardTitle>
          <CardDescription>Theo dõi tất cả các yêu cầu hỗ trợ</CardDescription>
        </CardHeader>
        <CardContent>
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
            ].map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between border p-4 rounded-lg">
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
                    >
                      {ticket.priority === "high" ? "Khẩn cấp" : ticket.priority === "medium" ? "Trung bình" : "Thấp"}
                    </Badge>
                  </div>
                  <p className="font-medium">{ticket.title}</p>
                  <p className="text-sm text-muted-foreground">{ticket.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={ticket.status === "closed" ? "secondary" : "default"}>
                    {ticket.status === "open" ? "Đang xử lý" : ticket.status === "answered" ? "Đã trả lời" : "Đã đóng"}
                  </Badge>
                  <Button variant="outline" size="sm">
                    Xem chi tiết
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gửi yêu cầu hỗ trợ mới</CardTitle>
          <CardDescription>Mô tả vấn đề của bạn chi tiết để chúng tôi có thể hỗ trợ nhanh nhất</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Tiêu đề</Label>
            <Input id="subject" placeholder="Tóm tắt vấn đề của bạn..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vps-select">VPS liên quan (nếu có)</Label>
            <Input id="vps-select" placeholder="Chọn VPS..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Mô tả chi tiết</Label>
            <Textarea id="message" placeholder="Hãy mô tả vấn đề một cách chi tiết..." rows={6} />
          </div>
          <Button>Gửi yêu cầu hỗ trợ</Button>
        </CardContent>
      </Card>
    </div>
  )
}
