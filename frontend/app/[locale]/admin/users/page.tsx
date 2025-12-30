"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Search, Mail, Shield, Trash2, Users, RefreshCw, Loader } from "lucide-react"
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
import { formatDate, normalizeString } from "@/utils/string"
import useUsers from "@/hooks/useUsers"
import { User, UserStatistics, AdminUserCreate, AdminUserUpdate } from "@/types/types"
import Pagination from "@/components/ui/pagination"
import { UserDetailSheet, CreateUserSheet } from "@/components/custom/admin/users/UserDetail"
import { useTranslations } from "next-intl"

const UsersPage = () => {
    const tCommon = useTranslations('common')
    const t = useTranslations('admin.users')
    const {
        getUsers,
        getUserStatistics,
        createUser,
        updateUser,
        deleteUser,
    } = useUsers()

    const [users, setUsers] = useState<User[]>([])
    const [filteredUsers, setFilteredUsers] = useState<User[]>([])
    const [statistics, setStatistics] = useState<UserStatistics | null>(null)

    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)

    const [roleFilter, setRoleFilter] = useState<string>("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    const searchRef = useRef<HTMLInputElement>(null)

    const fetchUsers = async (signal?: AbortSignal) => {
        try {
            setIsLoading(true)

            const [usersRes, statsRes] = await Promise.all([
                getUsers(0, undefined, signal),
                getUserStatistics(signal),
            ])

            if (signal?.aborted) return

            if (usersRes.error || statsRes.error) {
                toast.error(usersRes?.message || statsRes?.message, {
                    description: usersRes?.error?.detail || statsRes?.error?.detail,
                })
            } else {
                setUsers(usersRes.data || [])
                setFilteredUsers(usersRes.data || [])
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

        fetchUsers(controller.signal)

        return () => {
            controller.abort()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const getProviderBadge = (provider?: string) => {
        switch (provider) {
            case 'google':
                return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">Google</Badge>
            case 'github':
                return <Badge variant="outline" className="bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30">GitHub</Badge>
            default:
                return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">Email</Badge>
        }
    }

    useEffect(() => {
        let filtered = users
        if (roleFilter !== 'all') {
            filtered = users.filter(u => u.role === roleFilter)
        }

        if (searchRef.current?.value) {
            const query = normalizeString(searchRef.current.value)
            filtered = filtered.filter(user =>
                normalizeString(user.name || '').includes(query) ||
                normalizeString(user.email).includes(query) ||
                normalizeString(user.phone || '').includes(query)
            )
        }

        setFilteredUsers(filtered)
        setCurrentPage(1)
    }, [roleFilter, users])

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = normalizeString(e.target.value)

        let filtered = users
        if (roleFilter !== 'all') {
            filtered = users.filter(u => u.role === roleFilter)
        }

        if (!query) {
            setFilteredUsers(filtered)
            return
        }

        filtered = filtered.filter(user =>
            normalizeString(user.name || '').includes(query) ||
            normalizeString(user.email).includes(query) ||
            normalizeString(user.phone || '').includes(query)
        )

        setFilteredUsers(filtered)
        setCurrentPage(1)
    }

    const handleCreateUser = async (data: AdminUserCreate) => {
        try {
            setIsCreating(true)
            const result = await createUser(data)

            if (result.error) {
                toast.error(result.message, {
                    description: result.error.detail,
                })
            } else {
                toast.success(t('toast.create_success'))
                fetchUsers()
            }
        } catch {
            toast.error(t('toast.create_failed'))
        } finally {
            setIsCreating(false)
        }
    }

    const handleUpdateUser = async (userId: string, data: AdminUserUpdate) => {
        try {
            setIsUpdating(true)
            const result = await updateUser(userId, data)

            if (result.error) {
                toast.error(result.message, {
                    description: result.error.detail,
                })
            } else {
                toast.success(t('toast.update_success'))
                setUsers(prev => prev.map(u => u.id === userId ? result.data : u))
                setFilteredUsers(prev => prev.map(u => u.id === userId ? result.data : u))

                const statsRes = await getUserStatistics()
                if (!statsRes.error) {
                    setStatistics(statsRes.data)
                }
            }
        } catch {
            toast.error(t('toast.update_failed'))
        } finally {
            setIsUpdating(false)
        }
    }

    const handleDeleteUser = async (userId: string) => {
        try {
            setIsDeleting(userId)
            const result = await deleteUser(userId)

            if (result.error) {
                toast.error(result.message, {
                    description: result.error.detail,
                })
            } else {
                toast.success(t('toast.delete_success'))
                setUsers(prev => prev.filter(u => u.id !== userId))
                setFilteredUsers(prev => prev.filter(u => u.id !== userId))

                const statsRes = await getUserStatistics()
                if (!statsRes.error) {
                    setStatistics(statsRes.data)
                }
            }
        } catch {
            toast.error(t('toast.delete_failed'))
        } finally {
            setIsDeleting(null)
        }
    }

    // Pagination
    const totalItems = filteredUsers.length
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

    return (
        <div className="space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="animate-in fade-in slide-in-from-bottom-4 hover:shadow-lg transition-all duration-300" style={{ animationDelay: '0ms' }}>
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
                                <Users className="h-5 w-5 text-blue-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="animate-in fade-in slide-in-from-bottom-4 hover:shadow-lg transition-all duration-300" style={{ animationDelay: '50ms' }}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t('role.admin')}</p>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-12" />
                                ) : (
                                    <p className="text-2xl font-bold text-orange-600">{statistics?.admins || 0}</p>
                                )}
                            </div>
                            <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                                <Shield className="h-5 w-5 text-orange-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="animate-in fade-in slide-in-from-bottom-4 hover:shadow-lg transition-all duration-300" style={{ animationDelay: '100ms' }}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{t('filter.verified')}</p>
                                {isLoading ? (
                                    <Skeleton className="h-8 w-12" />
                                ) : (
                                    <p className="text-2xl font-bold text-green-600">{statistics?.verified || 0}</p>
                                )}
                            </div>
                            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                <Mail className="h-5 w-5 text-green-500" />
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
                        onChange={debounce(handleSearch, 400)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-full sm:w-40">
                            <SelectValue placeholder={t('filter.placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('filter.all')}</SelectItem>
                            <SelectItem value="USER">{t('filter.user')}</SelectItem>
                            <SelectItem value="ADMIN">{t('filter.admin')}</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => fetchUsers()}
                        disabled={isLoading}
                        title={t('filter.refresh')}
                    >
                        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    </Button>

                    <CreateUserSheet onCreate={handleCreateUser} isCreating={isCreating} />
                </div>
            </div>

            {/* Table */}
            <Card className="overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-500" />
                        {t('title')}
                    </CardTitle>
                </CardHeader>
                <div className="overflow-x-auto px-3">
                    <Table>
                        <TableHeader className="bg-secondary">
                            <TableRow>
                                <TableHead>{t('table.name')}</TableHead>
                                <TableHead className="hidden md:table-cell">{t('table.email')}</TableHead>
                                <TableHead className="hidden sm:table-cell">{t('table.provider')}</TableHead>
                                <TableHead>{t('table.role')}</TableHead>
                                <TableHead className="hidden xl:table-cell">{t('table.joined')}</TableHead>
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
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="h-10 w-10 rounded-full" />
                                                <div className="space-y-1">
                                                    <Skeleton className="h-4 w-32" />
                                                    <Skeleton className="h-3 w-24" />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex items-center gap-2">
                                                <Skeleton className="h-4 w-48" />
                                                <Skeleton className="h-5 w-5 rounded" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <Skeleton className="h-6 w-20 rounded-full" />
                                        </TableCell>
                                        <TableCell>
                                            <Skeleton className="h-6 w-16 rounded-full" />
                                        </TableCell>
                                        <TableCell className="hidden xl:table-cell">
                                            <Skeleton className="h-4 w-24" />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Skeleton className="h-8 w-8 rounded ml-auto" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                        {t('table.no_users')}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedUsers.map((user, index) => (
                                    <TableRow
                                        key={user.id}
                                        className="hover:bg-accent/50 dark:hover:bg-accent/10 transition-colors animate-in fade-in slide-in-from-left-4"
                                        style={{ animationDelay: `${index * 30}ms` }}
                                    >
                                        <TableCell>
                                            <UserDetailSheet user={user} onUpdate={handleUpdateUser} isUpdating={isUpdating} />
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm truncate max-w-50">{user.email}</span>
                                                {user.email_verified && (
                                                    <Badge variant="outline" className="text-green-600 border-green-600 text-xs shrink-0">
                                                        ✓
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            {getProviderBadge(user?.account?.provider)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                                                {user.role === 'ADMIN' ? t('role.admin') : t('role.user')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground hidden xl:table-cell">
                                            {formatDate(new Date(user.created_at))}
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
                                                                disabled={user.role === 'ADMIN' || isDeleting === user.id}
                                                            >
                                                                {isDeleting === user.id ? (
                                                                    <Loader className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {user.role === 'ADMIN' ? 'Cannot delete admin' : 'Delete user'}
                                                    </TooltipContent>
                                                </Tooltip>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Confirm Delete User</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to delete <strong>{user.name || user.email}</strong>?
                                                            This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDeleteUser(user.id)}
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
                    itemLabel={tCommon('users')}
                />
            )}
        </div>
    )
}

export default UsersPage
