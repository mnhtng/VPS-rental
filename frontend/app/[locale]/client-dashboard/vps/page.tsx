import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Plus } from "lucide-react"
import Link from "next/link"

export default function VPSListPage() {
  const vpsList = [
    { id: 101, name: "web-server-01", ip: "103.15.22.10", os: "Ubuntu 22.04", status: "running", region: "VN-Hanoi" },
    { id: 102, name: "db-master", ip: "103.15.22.11", os: "CentOS 8", status: "running", region: "VN-Hanoi" },
    { id: 103, name: "test-env", ip: "103.15.22.12", os: "Debian 11", status: "stopped", region: "VN-HCM" },
    { id: 104, name: "backup-svr", ip: "103.15.22.13", os: "Ubuntu 20.04", status: "running", region: "VN-HCM" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Danh sách VPS</h1>
        <Button asChild>
          <Link href="/client-dashboard/vps/create">
            <Plus className="mr-2 h-4 w-4" /> Tạo VPS mới
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tất cả máy chủ</CardTitle>
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input type="search" placeholder="Tìm kiếm theo tên hoặc IP..." />
              <Button type="submit" size="icon" variant="ghost">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Hostname</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Hệ điều hành</TableHead>
                <TableHead>Khu vực</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vpsList.map((vps) => (
                <TableRow key={vps.id}>
                  <TableCell>
                    <Badge
                      variant={vps.status === "running" ? "default" : "destructive"}
                      className={vps.status === "running" ? "bg-green-500 hover:bg-green-600" : ""}
                    >
                      {vps.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{vps.name}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">{vps.ip}</TableCell>
                  <TableCell>{vps.os}</TableCell>
                  <TableCell>{vps.region}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/client-dashboard/vps/${vps.id}`}>Quản lý</Link>
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
