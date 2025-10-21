"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Eye, EyeClosed } from "lucide-react"

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
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
import { useState } from "react"
import { colors } from "@/utils/color"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
    GenericDataTableConfig,
    UserDataType
} from "@/types/data-table-types"
import { DataTable } from "@/components/ui/data-table"

interface PasswordVisibleProps {
    element: string
    isVisible: boolean
}

// Table cell viewer component for user details
function UserTableCellViewer({ item }: { item: UserDataType }) {
    const [validation, setValidation] = useState<{
        error: string
        loading: boolean
    }>({
        error: "",
        loading: false
    })
    const [passwordVisible, setPasswordVisible] = useState<PasswordVisibleProps[]>([])

    const handleTogglePassword = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        const passwordInput = e.currentTarget.parentElement?.querySelector('input')?.name

        const currentPasswordVisible = passwordVisible.find(pv => pv.element === passwordInput)

        if (!(currentPasswordVisible?.element === passwordInput)) {
            setPasswordVisible(prevState => [
                ...prevState.filter(pv => pv.element !== passwordInput),
                { element: passwordInput || "", isVisible: true }
            ])
            return
        }

        if (currentPasswordVisible?.isVisible === false) {
            setPasswordVisible(prevState => [
                ...prevState.filter(pv => pv.element !== passwordInput),
                { element: passwordInput || "", isVisible: true }
            ])
            return
        }

        setPasswordVisible(prevState => [
            ...prevState.filter(pv => pv.element !== passwordInput),
            { element: passwordInput || "", isVisible: false }
        ])
    }

    const handleEditUser = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setValidation({ ...validation, loading: true })

        const formData = new FormData(e.currentTarget)
        const data = Object.fromEntries(formData.entries())

        try {
            setValidation({
                ...validation,
                error: "",
                loading: true,
            })

            console.log("Updating user:", data)
            toast.success('User updated successfully')
        } catch (error) {
            setValidation({
                ...validation,
                error: "Failed to update user. Please try again.",
                loading: false,
            })

            console.error("Error updating user:", error)
            toast.error('Failed to update user')
        } finally {
            setValidation({
                error: "",
                loading: false
            })
        }
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="link" className="w-fit px-0 text-left text-foreground">
                    {item.name}
                </Button>
            </SheetTrigger>

            <SheetContent
                side="right"
                onInteractOutside={e => {
                    e.preventDefault()
                }}
                className="flex flex-col z-1000"
            >
                <SheetHeader className="gap-1">
                    <SheetTitle>Edit User</SheetTitle>

                    <SheetDescription>
                        Update the user details below. Make sure to save your changes.
                    </SheetDescription>
                </SheetHeader>

                <Separator />

                <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 text-sm">
                    <form
                        onSubmit={handleEditUser}
                        className="flex flex-1 h-full"
                    >
                        <div className="flex flex-1 flex-col justify-between items-stretch gap-4 overflow-y-auto p-4 text-sm">
                            <div className="flex flex-col gap-4 flex-1">
                                <div className="flex flex-col gap-3">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        type="text"
                                        defaultValue={item.name}
                                        placeholder="User name..."
                                        required
                                        disabled={validation.loading}
                                    />
                                </div>

                                <div className="flex flex-col gap-3">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        defaultValue={item.email}
                                        placeholder="User email..."
                                        required
                                        disabled={validation.loading}
                                    />
                                </div>

                                <div className="relative flex flex-col gap-3">
                                    <Label htmlFor="password">Password (Option)</Label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type={passwordVisible.find(pv => pv.element === 'password')?.isVisible ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        className="pr-10"
                                        disabled={validation.loading}
                                    />
                                    <Button
                                        variant='ghost'
                                        size='icon'
                                        type='button'
                                        className='absolute top-[50%] right-0 -translate-y-1 cursor-pointer'
                                        onClick={(e) => handleTogglePassword(e)}
                                    >
                                        {passwordVisible.find(pv => pv.element === 'password')?.isVisible ?
                                            <Eye size={20} />
                                            :
                                            <EyeClosed size={20} />
                                        }
                                    </Button>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <Label htmlFor="role">Role</Label>

                                    <Select
                                        name="role"
                                        defaultValue={item.role}
                                        disabled={validation.loading}
                                    >
                                        <SelectTrigger id="role" className="w-full">
                                            <SelectValue placeholder="Select a role..." />
                                        </SelectTrigger>

                                        <SelectContent className="z-1001">
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="user">User</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <SheetFooter className="mt-auto flex flex-col gap-4 md:flex-row px-0">
                                <Button
                                    type="submit"
                                    className="flex-1 w-full"
                                    disabled={validation.loading}
                                >
                                    Submit
                                </Button>

                                <SheetClose asChild>
                                    <Button
                                        variant="outline"
                                        className="flex-1 w-full"
                                        disabled={validation.loading}
                                    >
                                        Cancel
                                    </Button>
                                </SheetClose>
                            </SheetFooter>
                        </div>
                    </form>
                </div>
            </SheetContent>
        </Sheet>
    )
}

// Define columns for the user data table
const userColumns: ColumnDef<UserDataType>[] = [
    {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
            return <UserTableCellViewer item={row.original} />
        },
        enableHiding: false,
    },
    {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
            <span>
                {row.original.email}
            </span>
        ),
    },
    {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
            <div className={cn(
                "rounded-lg p-2 w-fit",
                row.original.role === "admin" ? colors.orange.active : colors.blue.active
            )}>
                {row.original.role}
            </div>
        ),
    },
    {
        accessorKey: "provider",
        header: "Provider",
        cell: ({ row }) => (
            <span>
                {row.original.provider}
            </span>
        ),
    },
    {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ row }) => (
            <span>
                {new Date(row?.original?.createdAt as Date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                })}
            </span>
        ),
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            return row.original.status === "online" ? (
                <Badge className={cn(
                    "flex items-center gap-1 px-2 py-1 text-sm",
                    colors.green.active
                )}>
                    <div className={cn(
                        "w-2 h-2 rounded-full bg-green-500",
                    )}></div>
                    {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
                </Badge>
            ) : (
                <Badge className={cn(
                    "flex items-center gap-1 px-2 py-1 text-sm",
                    colors.gray.active
                )}>
                    <div className={cn(
                        "w-2 h-2 rounded-full bg-gray-500",
                    )}></div>
                    {(row?.original?.status as string).charAt(0).toUpperCase() + (row?.original?.status as string).slice(1)}
                </Badge>
            );
        },
    },
]

export function UserDataTable({
    initialData,
}: {
    initialData: UserDataType[];
}) {
    // Custom delete handler for users
    const handleDeleteUser = async (ids: string | string[] | number | number[] | UserDataType | UserDataType[]) => {
        try {
            // Here you would typically make an API call to delete users
            console.log("Deleting users:", ids)

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            // In a real app, you'd refetch data or update state from parent
            return Promise.resolve()
        } catch (error) {
            console.error("Error deleting users:", error)
            throw error
        }
    }

    // Custom import handler for users
    const handleImportUser = async (data: UserDataType[]) => {
        try {
            // Here you would typically validate and save imported users
            console.log("Importing users:", data)

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            return Promise.resolve()
        } catch (error) {
            console.error("Error importing users:", error)
            throw error
        }
    }

    // Custom export handler for users
    const handleExportUser = (data: UserDataType[]) => {
        // Custom export logic if needed
        import("xlsx").then((XLSX) => {
            const exportData = data.map(user => ({
                Name: user.name,
                Email: user.email,
                Role: user.role,
                Provider: user.provider,
                Status: user.status,
                "Created At": new Date(user.createdAt as Date).toLocaleDateString(),
            }))

            const ws = XLSX.utils.json_to_sheet(exportData)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, "Users")

            const fileName = `users_export_${new Date().toISOString().split('T')[0]}.xlsx`
            XLSX.writeFile(wb, fileName)
        })
    }

    // Configure the generic data table
    const tableConfig: GenericDataTableConfig<UserDataType> = {
        data: initialData,
        columns: userColumns,

        // Enable all features
        enableDragAndDrop: true,
        enableRowSelection: true,
        enablePagination: true,
        enableSorting: true,
        enableFiltering: true,
        enableImportExport: true,
        enableBulkDelete: true,
        enableSearch: true,

        // Search configuration
        // searchKey: "name",
        // searchPlaceholder: "Search users by name...",

        // Pagination settings
        initialPageSize: 10,
        pageSizeOptions: [10, 20, 30, 50, 100],

        // Export configuration
        exportFileName: `users_${new Date().toISOString().split('T')[0]}.xlsx`,
        exportSheetName: "Users",

        // Event handlers
        onDelete: handleDeleteUser,
        onImport: handleImportUser,
        onExport: handleExportUser,

        // Custom labels
        labels: {
            deleteTitle: "Delete User",
            deleteDescription: (user) => `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
            bulkDeleteTitle: "Delete Users",
            bulkDeleteDescription: (count) => `Are you sure you want to delete ${count} user(s)? This action cannot be undone.`,
            importTitle: "Import Users",
            importDescription: (count) => `You are about to import ${count} user(s). Please choose how you want to handle the import:`,
            noDataMessage: "No users found.",
            exportName: "users"
        }
    }

    return <DataTable config={tableConfig} />
} 