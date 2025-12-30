"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Server, AlertTriangle } from "lucide-react"
import Link from "next/link"
import useVPS from "@/hooks/useVPS"
import { useLocale, useTranslations } from "next-intl"
import { VPSPlaceholder } from "@/components/custom/placeholder/vps"
import { VPSInstance } from "@/types/types"
import Pagination from "@/components/ui/pagination"
import { toast } from "sonner"
import { getDiskSize } from "@/utils/string"

export default function VPSListPage() {
  const t = useTranslations('client_vps')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const { getMyVps } = useVPS()

  const [vpsList, setVpsList] = useState<VPSInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchVps = async (signal?: AbortSignal) => {
    try {
      const result = await getMyVps(null, signal)

      if (signal?.aborted) return

      if (result.error) {
        toast.error(result.message, {
          description: result.error.detail,
        })
      } else {
        setVpsList(result.data)
      }
      setLoading(false)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;

      toast.error(t('toast.fetch_failed'), {
        description: t('toast.try_again'),
      })
      setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()

    fetchVps(controller.signal)

    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredVpsList = vpsList.filter((vps) => {
    const query = searchQuery.toLowerCase()
    return (
      (vps.vm?.hostname?.toLowerCase() || "").includes(query) ||
      (vps.vm?.ip_address?.toLowerCase() || "").includes(query)
    )
  })

  // Pagination calculations
  const totalItems = filteredVpsList.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVpsList = filteredVpsList.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>

      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('all_servers')} ({loading ? "..." : filteredVpsList.length})</CardTitle>
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input
                type="search"
                placeholder={t('search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="hover:border-blue-400 transition-colors"
              />
              <Button size="icon" variant="ghost" className="hover:bg-blue-50 hover:text-blue-600 dark:hover:text-blue-400 border dark:border-gray-700 hover:border-blue-300 hover:scale-105 transition-all">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {loading ? (
              <VPSPlaceholder />
            ) : paginatedVpsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center animate-in zoom-in duration-500">
                <div className="rounded-full bg-linear-to-br from-blue-100 to-purple-100 p-6 mb-4">
                  <Server className="h-16 w-16 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? t('empty.no_vps_found') : t('empty.no_vps_yet')}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery ? t('empty.try_different_keywords') : t('empty.start_by_registering')}
                </p>
                {!searchQuery && (
                  <Button asChild className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Link href={`/${locale}/plans`}>
                      <Plus className="mr-2 h-4 w-4" />
                      {t('empty.get_vps_now')}
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader className="bg-muted">
                    <TableRow>
                      <TableHead></TableHead>
                      <TableHead>{t('table.hostname')}</TableHead>
                      <TableHead>{t('table.ip_address')}</TableHead>
                      <TableHead>{t('table.configuration')}</TableHead>
                      <TableHead>{t('table.vps_plan')}</TableHead>
                      <TableHead className="text-right">{t('table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedVpsList.map((vps, index) => {
                      const isSuspended = vps.status === 'suspended'

                      return (
                        <TableRow
                          key={vps.id}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors animate-in fade-in slide-in-from-left-4 ${isSuspended ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <TableCell>
                            <div
                              className={`h-2 w-2 rounded-full ${isSuspended
                                ? "bg-amber-500"
                                : vps.vm?.power_status === "running"
                                  ? "bg-green-500 animate-pulse"
                                  : vps.vm?.power_status === "stopped"
                                    ? "bg-red-500"
                                    : "bg-yellow-500 animate-pulse"
                                }`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {vps.vm?.hostname || t('status.configuring')}
                              {isSuspended && (
                                <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-0 text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  {t('status.suspended')}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">
                            {vps.vm?.ip_address || t('status.waiting_for_ip')}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {vps.vm?.vcpu && vps.vm?.ram_gb ? (
                              <>
                                {vps.vm?.vcpu} vCPU • {vps.vm?.ram_gb}GB RAM
                                {vps.vm?.storage_gb && (
                                  <>
                                    <br />
                                    {getDiskSize(vps.vm?.storage_gb, vps.vm?.storage_type || "Disk")}
                                  </>
                                )}
                              </>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">
                              {vps.vps_plan?.name || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {isSuspended ? (
                              <Button
                                size="sm"
                                asChild
                                className="bg-amber-500 hover:bg-amber-600 text-white hover:scale-105 transition-all"
                              >
                                <Link href={`/${locale}/client-dashboard/billing`}>{t('buttons.renew')}</Link>
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="hover:bg-blue-50 hover:text-blue-600 dark:hover:text-blue-400 border dark:border-gray-700 hover:border-blue-300 hover:scale-105 transition-all"
                              >
                                <Link href={`/${locale}/client-dashboard/vps/${vps.id}`}>{t('buttons.manage')}</Link>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalItems > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    startIndex={startIndex}
                    endIndex={endIndex}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                    itemLabel={tCommon('vps')}
                  />
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
