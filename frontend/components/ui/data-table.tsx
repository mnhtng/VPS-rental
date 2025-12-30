"use client"

import * as React from "react"
import {
    DndContext,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
    type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
    SortableContext,
    arrayMove,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
    ColumnDef,
    ColumnFiltersState,
    Row,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import {
    ArrowDown,
    ArrowUp,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronsLeftIcon,
    ChevronsRightIcon,
    CloudUpload,
    FolderDown,
    GripVerticalIcon,
    MoreVerticalIcon,
    RefreshCw,
    Search,
    Settings2,
    Trash2,
    Loader
} from "lucide-react"

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { useCallback, useEffect, useId, useMemo, useState } from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    BaseDataItem,
    GenericDataTableConfig,
    ImportOption,
    TableActionProps,
    DeleteHandler,
} from "@/types/data-table-types"
import { toast } from "sonner"

// Drag handle component
function DragHandle({ id }: { id: string }) {
    const { attributes, listeners } = useSortable({ id })

    return (
        <Button
            {...attributes}
            {...listeners}
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:bg-transparent"
        >
            <GripVerticalIcon className="size-3 text-muted-foreground" />
            <span className="sr-only">Drag to reorder</span>
        </Button>
    )
}

// Draggable row component
function DraggableRow<T extends BaseDataItem>({
    row,
    config
}: {
    row: Row<T>
    config: GenericDataTableConfig<T>
}) {
    const { transform, transition, setNodeRef, isDragging } = useSortable({
        id: row.original.id as string,
    })

    const handleRowClick = useCallback((e: React.MouseEvent) => {
        // Prevent click when dragging
        if (isDragging) {
            e.preventDefault()
            return
        }
        config.onRowClick?.(row.original)
    }, [isDragging, config, row.original])

    return (
        <TableRow
            data-state={row.getIsSelected() && "selected"}
            data-dragging={isDragging}
            ref={setNodeRef}
            className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80 cursor-pointer hover:bg-muted/50"
            style={{
                transform: CSS.Transform.toString(transform),
                transition: transition,
            }}
            onClick={handleRowClick}
        >
            {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
            ))}
        </TableRow>
    )
}

// Main generic data table component
export function DataTable<T extends BaseDataItem>({
    config
}: {
    config: GenericDataTableConfig<T>
}) {
    const [data, setData] = useState<T[]>(config.data || [])
    const [rowSelection, setRowSelection] = useState({})
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [sorting, setSorting] = useState<SortingState>([])
    const [globalFilter, setGlobalFilter] = useState("")
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: config.initialPageSize || 10,
    })

    const sortableId = useId()
    const [dragKey, setDragKey] = useState(0)

    const sensors = useSensors(
        useSensor(MouseSensor, {}),
        useSensor(TouchSensor, {}),
        useSensor(KeyboardSensor, {})
    )

    const [rowsAction, setRowsAction] = useState<TableActionProps>({
        selectedRows: [],
        isDelete: false,
        isDeleteSelected: false,
        isLoading: false
    })

    const [importOption, setImportOption] = useState<ImportOption<T>>({
        isOpen: false,
        data: [],
    })

    // Memoized data IDs for drag and drop
    const dataIds = useMemo<UniqueIdentifier[]>(
        () => data?.map(({ id }) => id.toString()) as UniqueIdentifier[],
        [data]
    )

    // Utility functions for ID conversion and validation
    const extractId = useCallback((item: string | number | T): string => {
        if (typeof item === 'string' || typeof item === 'number') {
            return item.toString()
        }
        if (typeof item === 'object' && item !== null && 'id' in item) {
            return (item as T).id.toString()
        }
        throw new Error('Invalid ID type')
    }, [])

    const normalizeIds = useCallback((ids: string | string[] | number | number[] | T | T[]): string[] => {
        try {
            const idsArray = Array.isArray(ids) ? ids : [ids]
            return idsArray.map(extractId)
        } catch (error) {
            throw new Error('Failed to normalize IDs: ' + (error as Error).message)
        }
    }, [extractId])

    const findItemById = useCallback((id: string): T | undefined => {
        return data.find(item => item.id.toString() === id)
    }, [data])

    // Enhanced helper function to validate delete operation
    const validateDeleteOperation = useCallback((ids: string | string[] | number | number[] | T | T[]): {
        isValid: boolean;
        error?: string;
        normalizedIds?: string[]
    } => {
        try {
            const normalizedIds = normalizeIds(ids)

            if (normalizedIds.length === 0) {
                return { isValid: false, error: 'No items selected for deletion' }
            }

            // Check if all IDs exist in current data
            const dataIds = data.map(item => item.id.toString())
            const invalidIds = normalizedIds.filter(id => !dataIds.includes(id))

            if (invalidIds.length > 0) {
                return {
                    isValid: false,
                    error: `Invalid item IDs: ${invalidIds.join(', ')}`
                }
            }

            return { isValid: true, normalizedIds }
        } catch (error) {
            return {
                isValid: false,
                error: `ID validation failed: ${(error as Error).message}`
            }
        }
    }, [normalizeIds, data])

    // Enhanced delete handler using DeleteHandler type
    const createDeleteHandler = useCallback((customDeleteFn?: DeleteHandler<T>): DeleteHandler<T> => {
        return async (ids: string | string[] | number | number[] | T | T[]) => {
            const validation = validateDeleteOperation(ids)
            if (!validation.isValid) {
                throw new Error(validation.error)
            }

            const normalizedIds = validation.normalizedIds!

            if (customDeleteFn) {
                // Use custom delete function (API call, etc.)
                await customDeleteFn(ids)
            } else {
                // Default delete behavior - remove from local state
                // Simulate async operation for consistency
                await new Promise(resolve => setTimeout(resolve, 100))

                setData(prevData =>
                    prevData.filter(item => {
                        const itemId = item.id.toString()
                        return !normalizedIds.includes(itemId)
                    })
                )
            }
        }
    }, [validateDeleteOperation])

    // Enhanced delete handlers with flexible ID support and validation
    const handleDeleteSingle = useCallback((id: string | number | T) => {
        try {
            // Normalize the ID
            const normalizedId = extractId(id)

            // Validate that the item exists
            const item = findItemById(normalizedId)
            if (!item) {
                toast.error('Item not found or has been already deleted')
                return
            }

            // Prevent delete during loading
            if (rowsAction.isLoading) {
                toast.warning('Please wait for the current operation to complete')
                return
            }

            setRowsAction({
                selectedRows: [normalizedId],
                isDelete: true,
                isDeleteSelected: false,
                isLoading: false,
            })
        } catch (error) {
            toast.error(`Invalid item ID: ${(error as Error).message}`)
        }
    }, [extractId, findItemById, rowsAction.isLoading])

    const handleDeleteMultiple = useCallback((ids: (string | number | T)[]) => {
        try {
            // Validate selection
            if (!ids.length) {
                toast.error('No items selected for deletion')
                return
            }

            // Normalize all IDs
            const normalizedIds = ids.map(extractId)

            // Check if all selected items still exist
            const existingIds = data.map(item => item.id.toString())
            const validIds = normalizedIds.filter(id => existingIds.includes(id))

            if (validIds.length === 0) {
                toast.error('Selected items no longer exist')
                return
            }

            if (validIds.length !== normalizedIds.length) {
                toast.warning(`Some selected items no longer exist. ${validIds.length} items will be deleted.`)
            }

            // Prevent delete during loading
            if (rowsAction.isLoading) {
                toast.warning('Please wait for the current operation to complete')
                return
            }

            setRowsAction({
                selectedRows: validIds,
                isDelete: false,
                isDeleteSelected: true,
                isLoading: false,
            })
        } catch (error) {
            toast.error(`Invalid item IDs: ${(error as Error).message}`)
        }
    }, [extractId, data, rowsAction.isLoading])

    // Main delete execution function with flexible ID support
    const executeDelete = useCallback(async (ids: string | string[] | number | number[] | T | T[]) => {
        try {
            // Set loading state
            setRowsAction(prev => ({ ...prev, isLoading: true }))

            // Validate and normalize IDs
            const validation = validateDeleteOperation(ids)
            if (!validation.isValid) {
                throw new Error(validation.error)
            }

            const normalizedIds = validation.normalizedIds!

            // Create appropriate delete handler
            const deleteHandler = createDeleteHandler(config.onDelete)

            // Execute delete operation
            await deleteHandler(ids)

            // Show success message with item details if possible
            const itemCount = normalizedIds.length
            let message: string

            if (itemCount === 1) {
                const item = findItemById(normalizedIds[0])
                const itemName = item && 'name' in item && typeof item.name === 'string'
                    ? `"${item.name}"`
                    : `item #${normalizedIds[0]}`
                message = `${itemName} deleted successfully`
            } else {
                message = `${itemCount} items deleted successfully`
            }

            toast.success(message)

        } catch (error) {
            // Handle different types of errors
            const errorMessage = error instanceof Error
                ? error.message
                : 'Failed to delete items'

            toast.error(errorMessage)
            console.error('Delete operation failed:', error)

            // Don't clear selection if delete failed
            return
        } finally {
            // Reset action state
            setRowsAction({
                selectedRows: [],
                isDelete: false,
                isDeleteSelected: false,
                isLoading: false,
            })

            // Clear row selection only on success
            setRowSelection({})
        }
    }, [validateDeleteOperation, createDeleteHandler, config.onDelete, findItemById])

    // Build columns with optional features
    const tableColumns = useMemo(() => {
        const cols: ColumnDef<T>[] = []

        // Add drag column if enabled
        if (config.enableDragAndDrop) {
            cols.push({
                id: "drag",
                header: () => null,
                cell: ({ row }) => <DragHandle id={row.original.id.toString()} />,
                enableSorting: false,
                enableHiding: false,
            })
        }

        // Add selection column if enabled
        if (config.enableRowSelection) {
            cols.push({
                id: "select",
                header: ({ table }) => (
                    <div className="flex items-center justify-center">
                        <Checkbox
                            checked={
                                table.getIsAllPageRowsSelected() ||
                                (table.getIsSomePageRowsSelected() && "indeterminate")
                            }
                            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                            aria-label="Select all"
                        />
                    </div>
                ),
                cell: ({ row }) => (
                    <div className="flex items-center justify-center">
                        <Checkbox
                            checked={row.getIsSelected()}
                            onCheckedChange={(value) => row.toggleSelected(!!value)}
                            aria-label="Select row"
                        />
                    </div>
                ),
                enableSorting: false,
                enableHiding: false,
            })
        }

        // Add user-defined columns
        cols.push(...config.columns)

        // Add actions column if custom row actions or delete is enabled
        if (config.customRowActions || config.enableBulkDelete) {
            cols.push({
                id: "actions",
                header: "Actions",
                cell: ({ row }) => {
                    if (config.customRowActions) {
                        return config.customRowActions(row.original, handleDeleteSingle)
                    }

                    return (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:bg-transparent hover:text-destructive disabled:opacity-50"
                            disabled={rowsAction.isLoading}
                            onClick={(e) => {
                                e.stopPropagation()
                                if (!rowsAction.isLoading) {
                                    handleDeleteSingle(row.original.id)
                                }
                            }}
                            title={rowsAction.isLoading ? "Please wait..." : "Delete item"}
                        >
                            {rowsAction.isLoading && rowsAction.selectedRows.includes(row.original.id.toString()) ? (
                                <Loader className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                        </Button>
                    )
                },
                enableSorting: false,
                enableHiding: false,
            })
        }

        return cols
    }, [config, rowsAction.isLoading, rowsAction.selectedRows, handleDeleteSingle])

    const table = useReactTable({
        data,
        columns: tableColumns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            columnFilters,
            pagination,
            globalFilter,
        },
        getRowId: (row) => row.id.toString(),
        enableRowSelection: config.enableRowSelection,
        onRowSelectionChange: setRowSelection,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onPaginationChange: setPagination,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        globalFilterFn: config.searchKey ? (row, columnId, value) => {
            const searchValue = row.original[config.searchKey as keyof T]
            return searchValue?.toString().toLowerCase().includes(value.toLowerCase()) ?? false
        } : undefined,
    })

    // Update data when config changes
    useEffect(() => {
        if (config.data) {
            setData(config.data)
        }
    }, [config.data])

    // Notify parent of data changes
    useEffect(() => {
        config.onDataChange?.(data)
    }, [config, config.onDataChange, data])

    // Drag and drop handler
    const handleDragEnd = useCallback((event: DragEndEvent) => {
        if (!config.enableDragAndDrop) return

        const { active, over } = event
        if (active && over && active.id !== over.id) {
            setData((data) => {
                const oldIndex = dataIds.indexOf(active.id)
                const newIndex = dataIds.indexOf(over.id)
                return arrayMove(data, oldIndex, newIndex)
            })
        }

        // Reset drag key to force sensors refresh
        setDragKey(prev => prev + 1)
    }, [config.enableDragAndDrop, dataIds])

    // Import/Export handlers
    const handleImport = useCallback(async (importData: T[], replaceExisting: boolean = false) => {
        try {
            setRowsAction(prev => ({ ...prev, isLoading: true }))

            if (config.onImport) {
                await config.onImport(importData)
            } else {
                // Default import behavior
                if (replaceExisting) {
                    setData(importData)
                } else {
                    setData(prevData => [...prevData, ...importData])
                }
            }

            toast.success('Data imported successfully')
        } catch (error) {
            toast.error('Failed to import data')
            console.error('Import error:', error)
        } finally {
            setRowsAction(prev => ({ ...prev, isLoading: false }))
            setImportOption({ isOpen: false, data: [] })
        }
    }, [config])

    const handleExport = useCallback(() => {
        try {
            if (config.onExport) {
                config.onExport(data)
            } else {
                // Default export behavior
                import("xlsx").then((XLSX) => {
                    const ws = XLSX.utils.json_to_sheet(data)
                    const wb = XLSX.utils.book_new()
                    XLSX.utils.book_append_sheet(wb, ws, config.exportSheetName || "Data")

                    const fileName = config.exportFileName || `${config.labels?.exportName || 'data'}_${new Date().toISOString()}.xlsx`
                    XLSX.writeFile(wb, fileName)
                }).catch(() => {
                    toast.error('Failed to export data')
                })
            }
        } catch (error) {
            toast.error('Failed to export data')
            console.error('Export error:', error)
        }
    }, [config, data])

    const selectedRowCount = Object.keys(rowSelection).length
    const hasSelectedRows = selectedRowCount > 0

    // Cleanup function
    useEffect(() => {
        return () => {
            // Reset states on unmount
            setRowsAction({
                selectedRows: [],
                isDelete: false,
                isDeleteSelected: false,
                isLoading: false
            })
            setImportOption({ isOpen: false, data: [] })
        }
    }, [])

    return (
        <div className="flex w-full flex-col justify-start gap-6">
            {/* Import Dialog */}
            {config.enableImportExport && (
                <AlertDialog open={importOption.isOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                {config.labels?.importTitle || "Import Data"}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {config.labels?.importDescription?.(importOption.data.length) ||
                                    `You are about to import ${importOption.data.length} item(s). Please choose how you want to handle the import:`}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex justify-between items-center gap-4 w-full">
                            <div className="flex-1 flex gap-3">
                                <AlertDialogAction
                                    onClick={() => handleImport(importOption.data, true)}
                                    disabled={!importOption.data.length || rowsAction.isLoading}
                                >
                                    Replace Existing
                                </AlertDialogAction>
                                <AlertDialogAction
                                    onClick={() => handleImport(importOption.data, false)}
                                    disabled={!importOption.data.length || rowsAction.isLoading}
                                >
                                    Add to Existing
                                </AlertDialogAction>
                            </div>
                            <AlertDialogCancel
                                onClick={() => setImportOption({ isOpen: false, data: [] })}
                                disabled={rowsAction.isLoading}
                            >
                                Cancel
                            </AlertDialogCancel>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            {/* Delete Single Dialog */}
            {config.enableBulkDelete && (
                <AlertDialog open={rowsAction.isDelete}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                {config.labels?.deleteTitle || "Delete Item"}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {(() => {
                                    const item = findItemById(rowsAction.selectedRows[0])
                                    if (item && config.labels?.deleteDescription) {
                                        return config.labels.deleteDescription(item)
                                    }

                                    // Show item details if available
                                    if (item) {
                                        const itemName = 'name' in item && typeof item.name === 'string'
                                            ? `"${item.name}"`
                                            : 'title' in item && typeof item.title === 'string'
                                                ? `"${item.title}"`
                                                : `item #${item.id}`
                                        return `Are you sure you want to delete ${itemName}? This action cannot be undone.`
                                    }

                                    return `Are you sure you want to delete this item? This action cannot be undone.`
                                })()}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel
                                onClick={() => setRowsAction(prev => ({
                                    ...prev,
                                    isDelete: false,
                                    selectedRows: [],
                                    isLoading: false
                                }))}
                                disabled={rowsAction.isLoading}
                            >
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => executeDelete(rowsAction.selectedRows[0])}
                                disabled={rowsAction.isLoading || !rowsAction.selectedRows.length}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {rowsAction.isLoading ? (
                                    <>
                                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </>
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            {/* Delete Multiple Dialog */}
            {config.enableBulkDelete && (
                <AlertDialog open={rowsAction.isDeleteSelected}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                {config.labels?.bulkDeleteTitle || "Delete Items"}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                {config.labels?.bulkDeleteDescription?.(rowsAction.selectedRows.length) ||
                                    `Are you sure you want to delete ${rowsAction.selectedRows.length} item(s)? This action cannot be undone.`}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel
                                onClick={() => setRowsAction(prev => ({
                                    ...prev,
                                    isDeleteSelected: false,
                                    isLoading: false,
                                    selectedRows: []
                                }))}
                                disabled={rowsAction.isLoading}
                            >
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => executeDelete(rowsAction.selectedRows)}
                                disabled={rowsAction.isLoading || !rowsAction.selectedRows.length}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {rowsAction.isLoading ? (
                                    <>
                                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                                        Deleting {rowsAction.selectedRows.length} item(s)...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete {rowsAction.selectedRows.length} item(s)
                                    </>
                                )}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-5">
                {/* Filter and visibility controls */}
                <div className="flex items-center gap-2">
                    {config.enableFiltering && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Settings2 />
                                    <span>Filter</span>
                                    <ChevronDownIcon />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                {table
                                    .getAllColumns()
                                    .filter(
                                        (column) =>
                                            typeof column.accessorFn !== "undefined" &&
                                            column.getCanHide()
                                    )
                                    .map((column) => {
                                        return (
                                            <DropdownMenuCheckboxItem
                                                key={column.id}
                                                className="capitalize"
                                                checked={column.getIsVisible()}
                                                onCheckedChange={(value) =>
                                                    column.toggleVisibility(!!value)
                                                }
                                            >
                                                {column.id}
                                            </DropdownMenuCheckboxItem>
                                        )
                                    })}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {columnVisibility && Object.values(columnVisibility).some((val) => !val) && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                                setColumnVisibility({})
                                table.resetColumnVisibility()
                            }}
                        >
                            <RefreshCw />
                            Clear Filters
                        </Button>
                    )}
                </div>

                {/* Search */}
                {config.enableSearch && config.searchKey && (
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
                            <Input
                                placeholder={config.searchPlaceholder || "Search..."}
                                value={globalFilter ?? ""}
                                onChange={(e) => setGlobalFilter(e.target.value)}
                                className="pl-8 max-w-sm"
                            />
                        </div>
                    </div>
                )}

                {/* Sorting controls */}
                {config.enableSorting && (
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                        {sorting.length > 0 && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => table.setSorting([])}
                            >
                                <RefreshCw />
                                Clear Sorting
                            </Button>
                        )}

                        <Label className="text-sm whitespace-nowrap">Sort:</Label>

                        <Select
                            value={table.getState().sorting[0]?.id ?? ""}
                            onValueChange={(value) => {
                                const newSorting = value
                                    ? [{ id: value, desc: table.getState().sorting[0]?.desc ?? false }]
                                    : []
                                table.setSorting(newSorting)
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select sort" />
                            </SelectTrigger>
                            <SelectContent>
                                {table
                                    .getAllColumns()
                                    .filter(
                                        (column) =>
                                            typeof column.accessorFn !== "undefined" &&
                                            column.getCanSort()
                                    )
                                    .map((column) => {
                                        return (
                                            <SelectItem key={column.id} value={column.id}>
                                                {column.columnDef.header as string}
                                            </SelectItem>
                                        )
                                    })}
                            </SelectContent>
                        </Select>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const currentSorting = table.getState().sorting[0]
                                if (currentSorting) {
                                    table.setSorting([
                                        {
                                            id: currentSorting.id,
                                            desc: !currentSorting.desc,
                                        },
                                    ])
                                }
                            }}
                        >
                            {table.getState().sorting[0]?.desc ? (
                                <ArrowDown className="size-4" />
                            ) : (
                                <ArrowUp className="size-4" />
                            )}
                        </Button>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="relative flex flex-col gap-4 overflow-auto">
                <div className="overflow-hidden rounded-lg border">
                    <DndContext
                        key={`dnd-${dragKey}`}
                        collisionDetection={closestCenter}
                        modifiers={config.enableDragAndDrop ? [restrictToVerticalAxis] : []}
                        onDragEnd={handleDragEnd}
                        sensors={sensors}
                        id={sortableId}
                        autoScroll={false}
                    >
                        <Table className="relative">
                            <TableHeader className="sticky top-0 z-10 bg-muted">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header, index) => {
                                            // Check if this is the last header (actions)
                                            if (index === headerGroup.headers.length - 1 &&
                                                (config.enableImportExport || config.enableBulkDelete)) {
                                                return (
                                                    <TableHead key={header.id} colSpan={header.colSpan} className="text-muted-foreground">
                                                        <DropdownMenu modal={false}>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
                                                                    size="icon"
                                                                >
                                                                    <MoreVerticalIcon />
                                                                    <span className="sr-only">Open menu</span>
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                {/* Bulk delete option */}
                                                                {config.enableBulkDelete && hasSelectedRows && (
                                                                    <>
                                                                        <DropdownMenuItem
                                                                            className="p-0"
                                                                            disabled={rowsAction.isLoading}
                                                                        >
                                                                            <Label
                                                                                className={`flex items-center gap-2 p-2 w-full rounded-md cursor-pointer transition-colors ${rowsAction.isLoading
                                                                                    ? 'opacity-50 cursor-not-allowed'
                                                                                    : 'hover:bg-destructive hover:text-destructive-foreground'
                                                                                    }`}
                                                                                onClick={(e) => {
                                                                                    e.preventDefault()
                                                                                    e.stopPropagation()
                                                                                    if (!rowsAction.isLoading) {
                                                                                        handleDeleteMultiple(Object.keys(rowSelection))
                                                                                    }
                                                                                }}
                                                                            >
                                                                                {rowsAction.isLoading ? (
                                                                                    <>
                                                                                        <Loader className="h-4 w-4 animate-spin" />
                                                                                        Processing...
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <Trash2 className="h-4 w-4" />
                                                                                        Delete Selected ({selectedRowCount})
                                                                                    </>
                                                                                )}
                                                                            </Label>
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                    </>
                                                                )}

                                                                {/* Import option */}
                                                                {config.enableImportExport && (
                                                                    <>
                                                                        <DropdownMenuItem asChild>
                                                                            <Label
                                                                                htmlFor="import-file"
                                                                                className="flex items-center gap-2 py-1.5 cursor-pointer"
                                                                                onClick={(e) => {
                                                                                    e.preventDefault()
                                                                                    e.stopPropagation()
                                                                                    const input = document.getElementById("import-file") as HTMLInputElement
                                                                                    if (input) {
                                                                                        input.click()
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <CloudUpload />
                                                                                Import
                                                                            </Label>
                                                                        </DropdownMenuItem>

                                                                        <Input
                                                                            id="import-file"
                                                                            name="import-file"
                                                                            type="file"
                                                                            accept=".csv,.xlsx,.xls"
                                                                            className="hidden"
                                                                            onChange={async (e) => {
                                                                                e.preventDefault()
                                                                                e.stopPropagation()

                                                                                const file = e.target.files?.[0]
                                                                                if (!file) {
                                                                                    toast.error('No file selected')
                                                                                    return
                                                                                }

                                                                                try {
                                                                                    const data = await file.arrayBuffer()
                                                                                    const XLSX = (await import("xlsx")).default || (await import("xlsx"))
                                                                                    const wb = XLSX.read(data)
                                                                                    const ws = wb.Sheets[wb.SheetNames[0]]
                                                                                    const jsonData = XLSX.utils.sheet_to_json<T>(ws)

                                                                                    setImportOption({
                                                                                        isOpen: true,
                                                                                        data: jsonData,
                                                                                    })
                                                                                } catch {
                                                                                    toast.error('Failed to import file')
                                                                                }
                                                                            }}
                                                                        />

                                                                        {/* Export option */}
                                                                        <DropdownMenuItem onClick={handleExport}>
                                                                            <FolderDown />
                                                                            Export
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableHead>
                                                )
                                            }

                                            return (
                                                <TableHead key={header.id} colSpan={header.colSpan}>
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                </TableHead>
                                            )
                                        })}
                                    </TableRow>
                                ))}
                            </TableHeader>

                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    config.enableDragAndDrop ? (
                                        <SortableContext
                                            key={`sortable-${dragKey}`}
                                            items={dataIds}
                                            strategy={verticalListSortingStrategy}
                                        >
                                            {table.getRowModel().rows.map((row) => (
                                                <DraggableRow key={row.id} row={row} config={config} />
                                            ))}
                                        </SortableContext>
                                    ) : (
                                        table.getRowModel().rows.map((row) => (
                                            <TableRow
                                                key={row.id}
                                                data-state={row.getIsSelected() && "selected"}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() => config.onRowClick?.(row.original)}
                                            >
                                                {row.getVisibleCells().map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        ))
                                    )
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={tableColumns.length}
                                            className="h-24 text-center"
                                        >
                                            {config.labels?.noDataMessage || "No data available."}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </DndContext>
                </div>

                {/* Pagination */}
                {config.enablePagination && (
                    <div className="flex items-center justify-between px-4">
                        <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
                            {table.getFilteredSelectedRowModel().rows.length} of{" "}
                            {table.getFilteredRowModel().rows.length} row(s) selected.
                        </div>

                        <div className="flex w-full items-center gap-8 lg:w-fit">
                            <div className="hidden items-center gap-2 lg:flex">
                                <Label htmlFor="rows-per-page" className="text-sm font-medium">
                                    Rows per page
                                </Label>
                                <Select
                                    value={`${table.getState().pagination.pageSize}`}
                                    onValueChange={(value) => {
                                        table.setPageSize(Number(value))
                                    }}
                                >
                                    <SelectTrigger className="w-20" id="rows-per-page">
                                        <SelectValue
                                            placeholder={table.getState().pagination.pageSize}
                                        />
                                    </SelectTrigger>
                                    <SelectContent side="top">
                                        {(config.pageSizeOptions || [10, 20, 30, 40, 50]).map((pageSize) => (
                                            <SelectItem key={pageSize} value={`${pageSize}`}>
                                                {pageSize}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex w-fit items-center justify-center text-sm font-medium">
                                Page {table.getState().pagination.pageIndex + 1} of{" "}
                                {table.getPageCount()}
                            </div>

                            <div className="ml-auto flex items-center gap-2 lg:ml-0">
                                <Button
                                    variant="outline"
                                    className="hidden h-8 w-8 p-0 lg:flex"
                                    onClick={() => table.setPageIndex(0)}
                                    disabled={!table.getCanPreviousPage()}
                                >
                                    <span className="sr-only">Go to first page</span>
                                    <ChevronsLeftIcon />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="size-8"
                                    size="icon"
                                    onClick={() => table.previousPage()}
                                    disabled={!table.getCanPreviousPage()}
                                >
                                    <span className="sr-only">Go to previous page</span>
                                    <ChevronLeftIcon />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="size-8"
                                    size="icon"
                                    onClick={() => table.nextPage()}
                                    disabled={!table.getCanNextPage()}
                                >
                                    <span className="sr-only">Go to next page</span>
                                    <ChevronRightIcon />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="hidden size-8 lg:flex"
                                    size="icon"
                                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                    disabled={!table.getCanNextPage()}
                                >
                                    <span className="sr-only">Go to last page</span>
                                    <ChevronsRightIcon />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
} 