"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Search, Layers, Trash2, RefreshCw, Loader, BadgeCheck, Gem, Puzzle } from "lucide-react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import debounce from "@/utils/performanceUtil/debounce"
import { normalizeString } from "@/utils/string"
import useAdminPlans from "@/hooks/useAdminPlans"
import { VPSPlan, VPSPlanStatistics, VPSPlanCreate, VPSPlanUpdate } from "@/types/types"
import Pagination from "@/components/ui/pagination"
import { PlanDetailSheet, CreatePlanSheet } from "@/components/custom/admin/plans/PlanDetail"
import { formatPrice } from "@/utils/currency"

const PlansPage = () => {
    const {
        getPlans,
        getPlanStatistics,
        createPlan,
        updatePlan,
        deletePlan,
    } = useAdminPlans()

    const [plans, setPlans] = useState<VPSPlan[]>([])
    const [filteredPlans, setFilteredPlans] = useState<VPSPlan[]>([])
    const [statistics, setStatistics] = useState<VPSPlanStatistics | null>(null)

    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)

    const [categoryFilter, setCategoryFilter] = useState<string>("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    const searchRef = useRef<HTMLInputElement>(null)

    const fetchPlans = async (signal?: AbortSignal) => {
        try {
            setIsLoading(true)

            const result = await getPlans(signal)

            if (signal?.aborted) return

            if (result.error) {
                toast.error(result.message, {
                    description: result.error.detail,
                })
            } else {
                const plansData = result.data || []
                setPlans(plansData)
                setFilteredPlans(plansData)

                const stats = await getPlanStatistics(plansData)
                setStatistics(stats)
            }
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') return

            toast.error('Failed to fetch plans', {
                description: "Please try again later",
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        const controller = new AbortController()

        fetchPlans(controller.signal)

        return () => {
            controller.abort()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const getDiskSize = (storage_gb: number, storage_type?: string) => {
        if (storage_gb >= 1000) {
            const tb = (storage_gb / 1000).toFixed(1)
            return `${tb} TB ${storage_type || ''}`
        }
        return `${storage_gb} GB ${storage_type || ''}`
    }

    const getCategoryBadge = (category: string) => {
        switch (category.toLowerCase()) {
            case 'basic':
                return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">Basic</Badge>
            case 'standard':
                return <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30">Standard</Badge>
            case 'premium':
                return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">Premium</Badge>
            default:
                return <Badge variant="outline">{category}</Badge>
        }
    }

    useEffect(() => {
        let filtered = plans
        if (categoryFilter !== 'all') {
            filtered = plans.filter(p => p.category?.toLowerCase() === categoryFilter.toLowerCase())
        }

        if (searchRef.current?.value) {
            const query = normalizeString(searchRef.current.value)
            filtered = filtered.filter(plan =>
                normalizeString(plan.name).includes(query) ||
                normalizeString(plan.description || '').includes(query)
            )
        }

        setFilteredPlans(filtered)
        setCurrentPage(1)
    }, [categoryFilter, plans])

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = normalizeString(e.target.value)

        let filtered = plans
        if (categoryFilter !== 'all') {
            filtered = plans.filter(p => p.category?.toLowerCase() === categoryFilter.toLowerCase())
        }

        if (!query) {
            setFilteredPlans(filtered)
            return
        }

        filtered = filtered.filter(plan =>
            normalizeString(plan.name).includes(query) ||
            normalizeString(plan.description || '').includes(query)
        )

        setFilteredPlans(filtered)
        setCurrentPage(1)
    }

    const handleCreatePlan = async (data: VPSPlanCreate) => {
        try {
            setIsCreating(true)
            const result = await createPlan(data)

            if (result.error) {
                toast.error(result.message, {
                    description: result.error.detail,
                })
            } else {
                toast.success('Plan created successfully')
                fetchPlans()
            }
        } catch {
            toast.error('Failed to create plan', {
                description: "Please try again later",
            })
        } finally {
            setIsCreating(false)
        }
    }

    const handleUpdatePlan = async (planId: string, data: VPSPlanUpdate) => {
        try {
            setIsUpdating(true)

            const result = await updatePlan(planId, data)

            if (result.error) {
                toast.error(result.message, {
                    description: result.error.detail,
                })
            } else {
                toast.success('Plan updated successfully')
                setPlans(prev => prev.map(p => p.id === planId ? result.data : p))
                setFilteredPlans(prev => prev.map(p => p.id === planId ? result.data : p))

                const stats = await getPlanStatistics(plans.map(p => p.id === planId ? result.data : p))
                setStatistics(stats)
            }
        } catch {
            toast.error('Failed to update plan', {
                description: "Please try again later",
            })
        } finally {
            setIsUpdating(false)
        }
    }

    const handleDeletePlan = async (planId: string) => {
        try {
            setIsDeleting(planId)
            const result = await deletePlan(planId)

            if (result.error) {
                toast.error(result.message, {
                    description: result.error.detail,
                })
            } else {
                toast.success('Plan deleted successfully')
                const updatedPlans = plans.filter(p => p.id !== planId)
                setPlans(updatedPlans)
                setFilteredPlans(prev => prev.filter(p => p.id !== planId))

                const stats = await getPlanStatistics(updatedPlans)
                setStatistics(stats)
            }
        } catch {
            toast.error('Failed to delete plan', {
                description: "Please try again later",
            })
        } finally {
            setIsDeleting(null)
        }
    }

    // Pagination
    const totalItems = filteredPlans.length
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedPlans = filteredPlans.slice(startIndex, endIndex)

    return (
        <div className="space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="animate-in fade-in slide-in-from-bottom-4 hover:shadow-lg transition-all duration-300" style={{ animationDelay: '0ms' }}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Plans</p>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-12" />
                                ) : (
                                    <p className="text-2xl font-bold">{statistics?.total || 0}</p>
                                )}
                            </div>
                            <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                                <Layers className="h-5 w-5 text-indigo-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="animate-in fade-in slide-in-from-bottom-4 hover:shadow-lg transition-all duration-300" style={{ animationDelay: '50ms' }}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Basic</p>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-12" />
                                ) : (
                                    <p className="text-2xl font-bold text-blue-600">{statistics?.basic || 0}</p>
                                )}
                            </div>
                            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <Puzzle className="h-5 w-5 text-blue-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="animate-in fade-in slide-in-from-bottom-4 hover:shadow-lg transition-all duration-300" style={{ animationDelay: '100ms' }}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Standard</p>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-12" />
                                ) : (
                                    <p className="text-2xl font-bold text-purple-600">{statistics?.standard || 0}</p>
                                )}
                            </div>
                            <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                                <BadgeCheck className="h-5 w-5 text-purple-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="animate-in fade-in slide-in-from-bottom-4 hover:shadow-lg transition-all duration-300" style={{ animationDelay: '150ms' }}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Premium</p>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-12" />
                                ) : (
                                    <p className="text-2xl font-bold text-amber-600">{statistics?.premium || 0}</p>
                                )}
                            </div>
                            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                                <Gem className="h-5 w-5 text-amber-500" />
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
                        placeholder="Search plans..."
                        className="pl-10"
                        onChange={debounce(handleSearch, 400)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-full sm:w-40">
                            <SelectValue placeholder="Filter by category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => fetchPlans()}
                        disabled={isLoading}
                        title="Refresh"
                    >
                        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    </Button>

                    <CreatePlanSheet onCreate={handleCreatePlan} isCreating={isCreating} />
                </div>
            </div>

            {/* Table */}
            <Card className="overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Layers className="h-5 w-5 text-indigo-500" />
                        VPS Plans
                    </CardTitle>
                </CardHeader>
                <div className="overflow-x-auto px-3">
                    <Table>
                        <TableHeader className="bg-secondary">
                            <TableRow>
                                <TableHead>Plan Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="hidden md:table-cell">Specs</TableHead>
                                <TableHead className="hidden lg:table-cell">Storage</TableHead>
                                <TableHead className="text-right">Price</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
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
                                        <TableCell>
                                            <div className="space-y-1">
                                                <Skeleton className="h-5 w-32" />
                                                <Skeleton className="h-3 w-48" />
                                            </div>
                                        </TableCell>
                                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="space-y-1">
                                                <Skeleton className="h-4 w-24" />
                                                <Skeleton className="h-4 w-28" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <Skeleton className="h-5 w-24" />
                                                <Skeleton className="h-3 w-16" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Skeleton className="h-8 w-8 rounded" />
                                                <Skeleton className="h-8 w-8 rounded" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : filteredPlans.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                        No plans found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedPlans.map((plan, index) => (
                                    <TableRow
                                        key={plan.id}
                                        className="hover:bg-accent/50 dark:hover:bg-accent/10 transition-colors animate-in fade-in slide-in-from-left-4"
                                        style={{ animationDelay: `${index * 30}ms` }}
                                    >
                                        <TableCell>
                                            <PlanDetailSheet plan={plan} onUpdate={handleUpdatePlan} isUpdating={isUpdating} />
                                        </TableCell>
                                        <TableCell>
                                            {getCategoryBadge(plan.category)}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <span>{plan.vcpu} vCPU</span>
                                                <span>•</span>
                                                <span>{plan.ram_gb} GB RAM</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell">
                                            <span className="text-sm">{getDiskSize(plan.storage_gb, plan.storage_type)}</span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="font-medium text-green-600">
                                                {formatPrice(plan.monthly_price)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <AlertDialog>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                                                disabled={isDeleting === plan.id}
                                                            >
                                                                {isDeleting === plan.id ? (
                                                                    <Loader className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Delete plan</TooltipContent>
                                                </Tooltip>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Confirm Delete Plan</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to delete <strong>{plan.name}</strong>?
                                                            This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDeletePlan(plan.id)}
                                                            className="bg-red-600 hover:bg-red-700"
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))
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
                    itemLabel="plans"
                />
            )}
        </div>
    )
}

export default PlansPage
