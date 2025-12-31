"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Server, Play, Square, RotateCcw, Eye, Monitor, HardDrive, Cpu, MemoryStick, Clock, Loader, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { formatDate } from "@/utils/string"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { VPSInstance } from "@/types/types"
import { useTranslations } from "next-intl"

export const VPSDetailSheet = ({
    vps,
    onStart,
    onStop,
    onReboot,
    onDelete,
    isActionLoading,
}: {
    vps: VPSInstance
    onStart: (id: string) => void
    onStop: (id: string) => void
    onReboot: (id: string) => void
    onDelete: (id: string) => Promise<void>
    isActionLoading: string | null
}) => {
    const t = useTranslations('admin.components.vps_detail')
    const tCommon = useTranslations('admin.components.common')
    const [isDeleting, setIsDeleting] = useState(false)
    const [sheetOpen, setSheetOpen] = useState(false)

    const handleDelete = async () => {
        setIsDeleting(true)
        await onDelete(vps.id)
        setIsDeleting(false)
        setSheetOpen(false)
    }

    const getDaysUntilExpiry = (expiresAt: string) => {
        const now = new Date()
        const expiry = new Date(expiresAt)
        return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }

    const getPowerStatusBadge = (status: string) => {
        switch (status) {
            case 'running':
                return (
                    <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-0">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                        {t('running')}
                    </Badge>
                )
            case 'suspended':
                return (
                    <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-0">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1.5" />
                        {t('suspended')}
                    </Badge>
                )
            case 'stopped':
                return (
                    <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-0">
                        <div className="w-2 h-2 rounded-full bg-red-500 mr-1.5" />
                        {t('stopped')}
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

    const daysLeft = getDaysUntilExpiry(vps.expires_at)
    const isExpiringSoon = daysLeft > 0 && daysLeft <= 30
    const isLoading = isActionLoading === vps.id

    return (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                    <Eye className="h-4 w-4" />
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
                {/* Header with gradient based on status */}
                <div className={`p-6 pb-8 ${vps.status === 'active'
                    ? 'bg-linear-to-br from-green-500/20 via-green-500/10 to-background'
                    : vps.status === 'suspended'
                        ? 'bg-linear-to-br from-yellow-500/20 via-yellow-500/10 to-background'
                        : 'bg-linear-to-br from-red-500/20 via-red-500/10 to-background'
                    }`}>
                    <SheetHeader className="text-left">
                        <div className="flex items-center gap-3">
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${vps.status === 'active'
                                ? 'bg-green-500/20'
                                : vps.status === 'suspended'
                                    ? 'bg-yellow-500/20'
                                    : 'bg-red-500/20'
                                }`}>
                                <Server className={`h-6 w-6 ${vps.status === 'active'
                                    ? 'text-green-600'
                                    : vps.status === 'suspended'
                                        ? 'text-yellow-600'
                                        : 'text-red-600'
                                    }`} />
                            </div>
                            <div>
                                <SheetTitle className="text-xl">{vps.order_item?.hostname || vps.vm?.hostname || tCommon('na')}</SheetTitle>
                                <SheetDescription className="font-mono">
                                    VMID: {vps.vm?.vmid || tCommon('na')} • {vps.vm?.ip_address || tCommon('na')}
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>
                </div>

                {/* Status card overlapping header */}
                <div className="px-6 -mt-4">
                    <div className="bg-card border rounded-xl p-4 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center justify-between">
                            {getPowerStatusBadge(vps.vm?.power_status || 'unknown')}
                            <div className="flex gap-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            disabled={vps.vm?.power_status === 'running' || isLoading}
                                            className="hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/30 transition-all"
                                            onClick={() => onStart(vps.id)}
                                        >
                                            {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{t('start')}</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            disabled={vps.vm?.power_status === 'stopped' || isLoading}
                                            className="hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30 transition-all"
                                            onClick={() => onStop(vps.id)}
                                        >
                                            {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{t('stop')}</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            disabled={vps.vm?.power_status === 'stopped' || isLoading}
                                            className="hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/30 transition-all"
                                            onClick={() => onReboot(vps.id)}
                                        >
                                            {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{t('reboot')}</TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Expiry Warning */}
                    {isExpiringSoon && vps.status !== 'terminated' && (
                        <div className="p-4 rounded-xl bg-linear-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/30 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="flex items-center gap-3 text-orange-600">
                                <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-semibold">{t('expiring_soon')}</p>
                                    <p className="text-sm opacity-80">{daysLeft} {t('days_until_renewal')}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Specs */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '50ms' }}>
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('specs')}</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <Card className="bg-linear-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:shadow-lg transition-all">
                                <CardContent className="pt-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                            <Cpu className="h-5 w-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">CPU</p>
                                            <p className="text-xl font-bold">{vps.vm?.vcpu || vps.vps_plan?.vcpu || 'N/A'} <span className="text-sm font-normal">vCPU</span></p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-linear-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20 hover:shadow-lg transition-all">
                                <CardContent className="pt-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                            <MemoryStick className="h-5 w-5 text-purple-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">RAM</p>
                                            <p className="text-xl font-bold">{vps.vm?.ram_gb || vps.vps_plan?.ram_gb || 'N/A'} <span className="text-sm font-normal">GB</span></p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-linear-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20 hover:shadow-lg transition-all">
                                <CardContent className="pt-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                            <HardDrive className="h-5 w-5 text-orange-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Storage</p>
                                            <p className="text-xl font-bold">{vps.vm?.storage_gb || vps.vps_plan?.storage_gb || 'N/A'} <span className="text-sm font-normal">GB</span></p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-linear-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/20 hover:shadow-lg transition-all">
                                <CardContent className="pt-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                                            <Monitor className="h-5 w-5 text-cyan-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">OS</p>
                                            <p className="text-sm font-bold truncate max-w-25" title={vps.order_item?.os}>{vps.order_item?.os || 'N/A'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Owner Info */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '100ms' }}>
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('owner')}</h4>
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                            <p className="text-sm"><span className="text-muted-foreground">Name:</span> <span className="font-medium">{vps.user?.name || tCommon('na')}</span></p>
                            <p className="text-sm"><span className="text-muted-foreground">Email:</span> <span className="font-medium">{vps.user?.email || tCommon('na')}</span></p>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '150ms' }}>
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('service_info')}</h4>
                        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                            <p className="text-sm"><span className="text-muted-foreground">Plan:</span> <Badge variant="outline" className="ml-1">{vps.vps_plan?.name || tCommon('na')}</Badge></p>
                            <p className="text-sm"><span className="text-muted-foreground">Created:</span> <span className="font-medium">{formatDate(new Date(vps.created_at))}</span></p>
                            <p className="text-sm"><span className="text-muted-foreground">Expires:</span> <span className={`font-medium ${isExpiringSoon ? 'text-orange-600' : ''}`}>{formatDate(new Date(vps.expires_at))}</span></p>
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                {vps.status !== 'terminated' && (
                    <div className="px-6 animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '200ms' }}>
                        <h4 className="text-sm font-semibold text-red-600 uppercase tracking-wider mb-3">{t('danger_zone')}</h4>
                        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                            <div className="flex items-center justify-between gap-2">
                                <div>
                                    <p className="text-sm font-medium">{t('delete_vps')}</p>
                                    <p className="text-xs text-muted-foreground">{t('delete_warning')}</p>
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            disabled={isDeleting || isLoading}
                                        >
                                            {isDeleting ? (
                                                <Loader className="h-4 w-4 animate-spin mr-2" />
                                            ) : (
                                                <Trash2 className="h-4 w-4 mr-2" />
                                            )}
                                            {tCommon('delete')}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>{t('delete_confirm_title')}</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                {t('delete_confirm_description', { hostname: vps.order_item?.hostname || vps.vm?.hostname || 'N/A' })}
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleDelete}
                                                className="bg-destructive text-white hover:bg-destructive/90"
                                            >
                                                {isDeleting ? (
                                                    <Loader className="h-4 w-4 animate-spin mr-2" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                )}
                                                {t('delete_confirm')}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    </div>
                )}

                <SheetFooter className="px-6 py-6">
                    <SheetClose asChild>
                        <Button variant="outline" className="w-full">{tCommon('close')}</Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}