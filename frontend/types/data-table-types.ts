/**
 * Type definitions for Generic Data Table Component
 * 
 * Export all interfaces and types needed to use GenericDataTable
 */

import { ColumnDef } from "@tanstack/react-table"
import { ReactNode } from "react"

// Base interface that all data types must extend
export interface BaseDataItem {
    id: string | number
    [key: string]: unknown
}

// Table action state interface
export interface TableActionProps {
    selectedRows: string[]
    isDelete: boolean
    isDeleteSelected?: boolean
    isLoading: boolean
}

// Import options interface
export interface ImportOption<T> {
    isOpen: boolean
    data: T[]
}

// Labels and text customization interface
export interface DataTableLabels<T extends BaseDataItem> {
    deleteTitle?: string
    deleteDescription?: (item: T) => string
    bulkDeleteTitle?: string
    bulkDeleteDescription?: (count: number) => string
    importTitle?: string
    importDescription?: (count: number) => string
    noDataMessage?: string
    exportName?: string
}

// Main configuration interface for GenericDataTable
export interface GenericDataTableConfig<T extends BaseDataItem> {
    // Required properties
    data: T[]
    columns: ColumnDef<T>[]

    // Feature toggles
    enableDragAndDrop?: boolean
    enableRowSelection?: boolean
    enablePagination?: boolean
    enableSorting?: boolean
    enableFiltering?: boolean
    enableImportExport?: boolean
    enableBulkDelete?: boolean
    enableSearch?: boolean

    // Pagination configuration
    initialPageSize?: number
    pageSizeOptions?: number[]

    // Search configuration
    searchKey?: keyof T
    searchPlaceholder?: string

    // Export configuration
    exportFileName?: string
    exportSheetName?: string

    // Custom renderers
    customCellRenderer?: (item: T) => ReactNode
    customRowActions?: (item: T, onDelete: (id: string | number | T) => void) => ReactNode

    // Event handlers
    onDataChange?: (data: T[]) => void
    onRowClick?: (item: T) => void
    onDelete?: DeleteHandler<T>
    onImport?: (data: T[]) => Promise<void>
    onExport?: (data: T[]) => void

    // Customization
    labels?: DataTableLabels<T>
}

// Common data types for reference
export interface UserDataType extends BaseDataItem {
    id: string
    name?: string
    email?: string
    password?: string
    role?: string
    provider?: string
    createdAt?: Date | string
    status?: "online" | "offline"
}

export interface ArticleDataType extends BaseDataItem {
    id: string
    title?: string
    content?: string
    createdAt?: Date | string
    updatedAt?: Date | string
}

export interface ProductDataType extends BaseDataItem {
    id: string
    name: string
    price: number
    category: string
    stock: number
    description?: string
    imageUrl?: string
}

// Utility types
export type DataTableFeature =
    | 'dragAndDrop'
    | 'rowSelection'
    | 'pagination'
    | 'sorting'
    | 'filtering'
    | 'importExport'
    | 'bulkDelete'
    | 'search'

export type DataTableFeatures = Partial<Record<DataTableFeature, boolean>>

// Event handler types
export type DeleteHandler<T extends BaseDataItem> = (ids: string | string[] | number | number[] | T | T[]) => Promise<void>
export type ImportHandler<T extends BaseDataItem> = (data: T[]) => Promise<void>
export type ExportHandler<T extends BaseDataItem> = (data: T[]) => void
export type RowClickHandler<T extends BaseDataItem> = (item: T) => void
export type DataChangeHandler<T extends BaseDataItem> = (data: T[]) => void

// Column helper types
export type DataTableColumn<T extends BaseDataItem> = ColumnDef<T>
export type DataTableColumns<T extends BaseDataItem> = ColumnDef<T>[]

// Configuration builder helper type is just Partial<GenericDataTableConfig<T>>

// Feature preset configurations
export const FEATURE_PRESETS = {
    MINIMAL: {
        enablePagination: true,
        enableSorting: true,
    },
    STANDARD: {
        enableDragAndDrop: true,
        enableRowSelection: true,
        enablePagination: true,
        enableSorting: true,
        enableFiltering: true,
        enableSearch: true,
    },
    FULL: {
        enableDragAndDrop: true,
        enableRowSelection: true,
        enablePagination: true,
        enableSorting: true,
        enableFiltering: true,
        enableImportExport: true,
        enableBulkDelete: true,
        enableSearch: true,
    },
} as const

export type FeaturePreset = keyof typeof FEATURE_PRESETS

// Helper function to create config with preset
export function createDataTableConfig<T extends BaseDataItem>(
    data: T[],
    columns: ColumnDef<T>[],
    preset: FeaturePreset = 'STANDARD',
    customConfig?: Partial<GenericDataTableConfig<T>>
): GenericDataTableConfig<T> {
    return {
        data,
        columns,
        ...FEATURE_PRESETS[preset],
        ...customConfig,
    }
}

// Validation helpers
export function validateDataTableConfig<T extends BaseDataItem>(
    config: GenericDataTableConfig<T>
): string[] {
    const errors: string[] = []

    if (!config.data) {
        errors.push('Data is required')
    }

    if (!config.columns || config.columns.length === 0) {
        errors.push('At least one column is required')
    }

    if (config.enableSearch && !config.searchKey) {
        errors.push('searchKey is required when enableSearch is true')
    }

    if (config.initialPageSize && config.initialPageSize <= 0) {
        errors.push('initialPageSize must be greater than 0')
    }

    return errors
}

// Type guards
export function isValidDataItem(item: unknown): item is BaseDataItem {
    return (
        typeof item === 'object' &&
        item !== null &&
        'id' in item &&
        (typeof (item as BaseDataItem).id === 'string' || typeof (item as BaseDataItem).id === 'number')
    )
}

export function hasRequiredId<T extends BaseDataItem>(data: T[]): boolean {
    return data.every(item =>
        item.id !== undefined &&
        item.id !== null &&
        item.id !== ''
    )
}

// All types and functions are already exported above 