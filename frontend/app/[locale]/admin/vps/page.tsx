"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Search, Server, Play, Square, Globe, RefreshCw } from "lucide-react"
import { Input } from '@/components/ui/input'
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import debounce from "@/utils/performanceUtil/debounce"
import { formatDate, normalizeString } from "@/utils/string"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import Pagination from "@/components/ui/pagination"
import useAdminVPS from "@/hooks/useAdminVPS"
import { VPSInstance, VPSStatistics } from "@/types/types"
import { VPSDetailSheet } from "@/components/custom/admin/vps/VPSDetail"
import { useTranslations } from "next-intl"

const VPSPage = () => {
    const tCommon = useTranslations('common')
    const t = useTranslations('admin.vps')
    const { getAllVps, getVpsStatistics, adminStartVps, adminStopVps, adminRebootVps, adminDeleteVps } = useAdminVPS()

    const [vpsList, setVpsList] = useState<VPSInstance[]>([])
    const [filteredVpsList, setFilteredVpsList] = useState<VPSInstance[]>([])
    const [statistics, setStatistics] = useState<VPSStatistics | null>(null)

    const [isLoading, setIsLoading] = useState(true)
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null)

    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    const searchRef = useRef<HTMLInputElement>(null)

    const fetchVpsData = async (signal?: AbortSignal) => {
        try {
            setIsLoading(true)

            const [vpsRes, statsRes] = await Promise.all([
                getAllVps(0, undefined, undefined, signal),
                getVpsStatistics(signal),
            ])

            if (signal?.aborted) return

            if (vpsRes.error || statsRes.error) {
                toast.error(vpsRes?.message || statsRes?.message, {
                    description: vpsRes?.error?.detail || statsRes?.error?.detail,
                })
            } else {
                setVpsList(vpsRes.data || [])
                setFilteredVpsList(vpsRes.data || [])
                setStatistics(statsRes.data || null)
            }
            setIsLoading(false)
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') return

            toast.error(t('toast.fetch_failed'), {
                description: t('toast.fetch_failed'),
            })
            setIsLoading(false)
        }
    }

    useEffect(() => {
        const controller = new AbortController()

        fetchVpsData(controller.signal)

        return () => {
            controller.abort()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const getDaysUntilExpiry = (expiresAt: string) => {
        const now = new Date()
        const expiry = new Date(expiresAt)
        return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return (
                    <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-0">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                        {t('status.active')}
                    </Badge>
                )
            case 'suspended':
                return (
                    <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-0">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1.5" />
                        {t('status.suspended')}
                    </Badge>
                )
            case 'terminated':
                return (
                    <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-0">
                        <div className="w-2 h-2 rounded-full bg-red-500 mr-1.5" />
                        {t('status.terminated')}
                    </Badge>
                )
            case 'creating':
                return (
                    <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-0">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mr-1.5 animate-pulse" />
                        {t('status.creating')}
                    </Badge>
                )
            case 'error':
                return (
                    <Badge className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-0">
                        <div className="w-2 h-2 rounded-full bg-orange-500 mr-1.5" />
                        {t('status.error')}
                    </Badge>
                )
            default:
                return (
                    <Badge className="bg-gray-500/10 text-gray-600 hover:bg-gray-500/20 border-0">
                        <div className="w-2 h-2 rounded-full bg-gray-500 mr-1.5" />
                        {status}
                    </Badge>
                )
        }
    }

    useEffect(() => {
        let filtered = vpsList

        if (statusFilter !== 'all') {
            filtered = vpsList.filter(v => v.status === statusFilter)
        }

        if (searchRef.current?.value) {
            const query = normalizeString(searchRef.current.value)
            filtered = filtered.filter(vps =>
                normalizeString(vps.order_item?.hostname || vps.vm?.hostname || '').includes(query) ||
                normalizeString(vps.vm?.ip_address || '').includes(query) ||
                normalizeString(vps.user?.name || '').includes(query) ||
                normalizeString(vps.user?.email || '').includes(query) ||
                normalizeString(vps.order_item?.os || '').includes(query)
            )
        }

        setFilteredVpsList(filtered)
        setCurrentPage(1)
    }, [statusFilter, vpsList])

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = normalizeString(e.target.value)

        let filtered = vpsList
        if (statusFilter !== 'all') {
            filtered = vpsList.filter(v => v.status === statusFilter)
        }

        if (!query) {
            setFilteredVpsList(filtered)
            return
        }

        filtered = filtered.filter(vps =>
            normalizeString(vps.order_item?.hostname || vps.vm?.hostname || '').includes(query) ||
            normalizeString(vps.vm?.ip_address || '').includes(query) ||
            normalizeString(vps.user?.name || '').includes(query) ||
            normalizeString(vps.user?.email || '').includes(query) ||
            normalizeString(vps.order_item?.os || '').includes(query)
        )

        setFilteredVpsList(filtered)
        setCurrentPage(1)
    }

    const handleStart = async (vpsId: string) => {
        try {
            setIsActionLoading(vpsId)
            const result = await adminStartVps(vpsId)

            if (result.error) {
                toast.error(result.message, { description: result.error.detail })
            } else {
                toast.success(result.message || t('toast.start_success'))
                fetchVpsData()
            }
        } catch {
            toast.error(t('toast.start_failed'))
        } finally {
            setIsActionLoading(null)
        }
    }

    const handleStop = async (vpsId: string) => {
        try {
            setIsActionLoading(vpsId)
            const result = await adminStopVps(vpsId)

            if (result.error) {
                toast.error(result.message, { description: result.error.detail })
            } else {
                toast.success(result.message || t('toast.stop_success'))
                fetchVpsData()
            }
        } catch {
            toast.error(t('toast.stop_failed'))
        } finally {
            setIsActionLoading(null)
        }
    }

    const handleReboot = async (vpsId: string) => {
        try {
            setIsActionLoading(vpsId)
            const result = await adminRebootVps(vpsId)

            if (result.error) {
                toast.error(result.message, { description: result.error.detail })
            } else {
                toast.success(result.message || t('toast.reboot_success'))
                fetchVpsData()
            }
        } catch {
            toast.error(t('toast.reboot_failed'))
        } finally {
            setIsActionLoading(null)
        }
    }

    const handleDelete = async (vpsId: string) => {
        try {
            setIsActionLoading(vpsId)
            const result = await adminDeleteVps(vpsId)

            if (result.error) {
                toast.error(result.message, {
                    description: result.error.detail
                })
            } else {
                toast.success(result.message || t('toast.delete_success'))
                fetchVpsData()
            }
        } catch {
            toast.error(t('toast.delete_failed'))
        } finally {
            setIsActionLoading(null)
        }
    }

    // Pagination
    const totalItems = filteredVpsList.length
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedVps = filteredVpsList.slice(startIndex, endIndex)

    return (
        <div className="space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="animate-in fade-in slide-in-from-bottom-4 hover:shadow-lg transition-all" style={{ animationDelay: '0ms' }}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t('stats.total')}</p>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-12" />
                                ) : (
                                    <p className="text-2xl font-bold">{statistics?.total || 0}</p>
                                )}
                            </div>
                            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <Server className="h-5 w-5 text-blue-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="animate-in fade-in slide-in-from-bottom-4 hover:shadow-lg transition-all" style={{ animationDelay: '50ms' }}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t('stats.active')}</p>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-12" />
                                ) : (
                                    <p className="text-2xl font-bold text-green-600">{statistics?.active || 0}</p>
                                )}
                            </div>
                            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                <Play className="h-5 w-5 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="animate-in fade-in slide-in-from-bottom-4 hover:shadow-lg transition-all" style={{ animationDelay: '100ms' }}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t('stats.suspended')}</p>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-12" />
                                ) : (
                                    <p className="text-2xl font-bold text-yellow-600">{statistics?.suspended || 0}</p>
                                )}
                            </div>
                            <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                <Square className="h-5 w-5 text-yellow-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="animate-in fade-in slide-in-from-bottom-4 hover:shadow-lg transition-all" style={{ animationDelay: '150ms' }}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t('stats.terminated')}</p>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-12" />
                                ) : (
                                    <p className="text-2xl font-bold text-red-600">{statistics?.terminated || 0}</p>
                                )}
                            </div>
                            <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                                <Globe className="h-5 w-5 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        ref={searchRef}
                        placeholder={t('filter.search')}
                        className="pl-10"
                        onChange={debounce(handleSearch, 300)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-40">
                            <SelectValue placeholder={t('filter.placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('filter.all')}</SelectItem>
                            <SelectItem value="active">{t('filter.running')}</SelectItem>
                            <SelectItem value="suspended">{t('filter.suspended')}</SelectItem>
                            <SelectItem value="terminated">{t('filter.terminated')}</SelectItem>
                            <SelectItem value="creating">{t('filter.creating')}</SelectItem>
                            <SelectItem value="error">{t('filter.error')}</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => fetchVpsData()}
                        disabled={isLoading}
                        title={t('filter.refresh')}
                    >
                        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Table */}
            <Card className="overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Server className="h-5 w-5 text-blue-500" />
                        {t('title')}
                    </CardTitle>
                </CardHeader>
                <div className="overflow-x-auto px-3">
                    <Table>
                        <TableHeader className="bg-secondary">
                            <TableRow>
                                <TableHead className="hidden sm:table-cell">{t('table.vmid')}</TableHead>
                                <TableHead>{t('table.hostname')}</TableHead>
                                <TableHead className="hidden lg:table-cell">{t('table.ip_address')}</TableHead>
                                <TableHead className="hidden md:table-cell">{t('table.os')}</TableHead>
                                <TableHead className="hidden xl:table-cell">{t('table.plan')}</TableHead>
                                <TableHead className="hidden lg:table-cell">{t('table.user')}</TableHead>
                                <TableHead>{t('table.status')}</TableHead>
                                <TableHead className="hidden md:table-cell">{t('table.expires')}</TableHead>
                                <TableHead className="text-right">{t('table.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow
                                        key={i}
                                        className="animate-in fade-in slide-in-from-left-4"
                                        style={{ animationDelay: `${i * 80}ms` }}
                                    >
                                        <TableCell className="hidden sm:table-cell">
                                            <Skeleton className="h-4 w-12" />
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <Skeleton className="h-4 w-32" />
                                                <Skeleton className="h-3 w-24" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            <div className="flex items-center gap-2">
                                                <Skeleton className="h-4 w-4 rounded" />
                                                <Skeleton className="h-4 w-28" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex items-center gap-2">
                                                <Skeleton className="h-5 w-5 rounded" />
                                                <Skeleton className="h-4 w-24" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden xl:table-cell">
                                            <Skeleton className="h-6 w-20 rounded-full" />
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            <div className="space-y-1">
                                                <Skeleton className="h-4 w-32" />
                                                <Skeleton className="h-3 w-40" />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Skeleton className="h-2 w-2 rounded-full" />
                                                <Skeleton className="h-6 w-20 rounded-full" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="space-y-1">
                                                <Skeleton className="h-4 w-24" />
                                                <Skeleton className="h-3 w-16" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Skeleton className="h-8 w-8 rounded ml-auto" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : filteredVpsList.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                                        {t('table.no_vps')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedVps.map((vps, index) => {
                                    const daysLeft = getDaysUntilExpiry(vps.expires_at)
                                    const isExpiringSoon = daysLeft > 0 && daysLeft <= 30

                                    return (
                                        <TableRow
                                            key={vps.id}
                                            className="hover:bg-accent/50 dark:hover:bg-accent/10 transition-colors animate-in fade-in slide-in-from-left-4"
                                            style={{ animationDelay: `${index * 30}ms` }}
                                        >
                                            <TableCell className="font-mono hidden sm:table-cell">{vps.vm?.vmid || 'N/A'}</TableCell>
                                            <TableCell className="font-medium">{vps.order_item?.hostname || vps.vm?.hostname || 'N/A'}</TableCell>
                                            <TableCell className="font-mono text-sm hidden lg:table-cell">{vps.vm?.ip_address || 'N/A'}</TableCell>
                                            <TableCell className="text-sm hidden md:table-cell">{vps.order_item?.os || 'N/A'}</TableCell>
                                            <TableCell className="hidden xl:table-cell">
                                                <Badge variant="outline">{vps.vps_plan?.name || 'N/A'}</Badge>
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                <div className="text-sm">
                                                    <p>{vps.user?.name || 'N/A'}</p>
                                                    <p className="text-muted-foreground text-xs truncate max-w-37.5">{vps.user?.email || ''}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(vps.status)}</TableCell>
                                            <TableCell className="text-sm hidden md:table-cell">
                                                <div className="flex items-center gap-2">
                                                    <span className={isExpiringSoon && vps.status !== 'terminated' ? 'text-orange-600 font-medium' : 'text-muted-foreground'}>
                                                        {formatDate(new Date(vps.expires_at))}
                                                    </span>
                                                    {isExpiringSoon && vps.status !== 'terminated' && (
                                                        <Badge variant="outline" className="text-orange-600 border-orange-500/30 bg-orange-500/10 text-xs">
                                                            {daysLeft}d
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <VPSDetailSheet
                                                        vps={vps}
                                                        onStart={handleStart}
                                                        onStop={handleStop}
                                                        onReboot={handleReboot}
                                                        onDelete={handleDelete}
                                                        isActionLoading={isActionLoading}
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Pagination */}
            {totalItems > 0 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    startIndex={startIndex}
                    endIndex={Math.min(endIndex, totalItems)}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setItemsPerPage}
                    itemLabel={tCommon('vps')}
                />
            )}
        </div>
    )
}

export default VPSPage
