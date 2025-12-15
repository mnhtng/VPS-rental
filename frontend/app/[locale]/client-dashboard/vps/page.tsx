"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Server } from "lucide-react"
import Link from "next/link"
import useVPS, { VPSInstance } from "@/hooks/useVPS"
import { useLocale } from "next-intl"
import { VPSPlaceholder } from "@/components/custom/placeholder/vps"

export default function VPSListPage() {
  const locale = useLocale()
  const { getMyVps } = useVPS()

  const [vpsList, setVpsList] = useState<VPSInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searching, setSearching] = useState(false)

  const fetchVps = async () => {
    setLoading(true)
    const result = await getMyVps()
    if (result.data) {
      setVpsList(result.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchVps()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setSearching(true)
    setTimeout(() => setSearching(false), 300)
  }

  const filteredVpsList = vpsList.filter((vps) => {
    const query = searchQuery.toLowerCase()
    return (
      (vps.hostname?.toLowerCase() || "").includes(query) ||
      (vps.ip_address?.toLowerCase() || "").includes(query)
    )
  })

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h1 className="text-3xl font-bold tracking-tight">Danh sách VPS</h1>

      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tất cả máy chủ ({loading ? "..." : filteredVpsList.length})</CardTitle>
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input
                type="search"
                placeholder="Tìm kiếm theo tên hoặc IP..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="hover:border-blue-400 transition-colors"
              />
              <Button type="submit" size="icon" variant="ghost" className="hover:bg-blue-50 hover:text-blue-600 transition-colors">
                <Search className={`h-4 w-4 ${searching ? 'animate-pulse' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {loading ? (
              <VPSPlaceholder />
            ) : filteredVpsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center animate-in zoom-in duration-500">
                <div className="rounded-full bg-gradient-to-br from-blue-100 to-purple-100 p-6 mb-4">
                  <Server className="h-16 w-16 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? "Không tìm thấy VPS" : "Chưa có VPS nào"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery ? "Thử tìm kiếm với từ khóa khác" : "Bắt đầu bằng cách đăng ký VPS mới"}
                </p>
                {!searchQuery && (
                  <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Link href={`/${locale}/plans`}>
                      <Plus className="mr-2 h-4 w-4" /> Đăng ký VPS ngay
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Hostname</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Cấu hình</TableHead>
                    <TableHead>Gói VPS</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVpsList.map((vps, index) => (
                    <TableRow
                      key={vps.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors animate-in fade-in slide-in-from-left-4"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full animate-pulse ${vps.power_status === "running"
                              ? "bg-green-500"
                              : vps.power_status === "stopped"
                                ? "bg-red-500"
                                : "bg-yellow-500"
                              }`}
                          />
                          <Badge
                            variant={vps.power_status === "running" ? "default" : "destructive"}
                            className={vps.power_status === "running" ? "bg-green-500 hover:bg-green-600" : ""}
                          >
                            {vps.power_status === "running"
                              ? "Đang chạy"
                              : vps.power_status === "stopped"
                                ? "Đã tắt"
                                : vps.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {vps.hostname || "Đang cấu hình..."}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {vps.ip_address || "Chờ IP"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {vps.vcpu && vps.ram_gb ? (
                          <>
                            {vps.vcpu} vCPU • {vps.ram_gb}GB RAM
                            {vps.storage_gb && (
                              <>
                                <br />
                                {vps.storage_gb}GB {vps.storage_type || "Disk"}
                              </>
                            )}
                          </>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {vps.plan_name || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="hover:bg-blue-50 hover:text-blue-600 dark:hover:text-blue-400 border dark:border-gray-700 hover:border-blue-300 hover:scale-105 transition-all"
                        >
                          <Link href={`/${locale}/client-dashboard/vps/${vps.id}`}>Quản lý</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
