"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Bot } from "lucide-react"

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
    Sheet,
    SheetClose,
    SheetContentCustom,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup
} from "@/components/ui/resizable"
import Tiptap from "@/components/custom/text-editor/tiptap"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useState } from "react"
import { toast } from "sonner"
import {
    GenericDataTableConfig,
    ArticleDataType
} from "@/types/data-table-types"
import { DataTable } from "@/components/ui/data-table"

// Table cell viewer component for article details
function ArticleTableCellViewer({ item }: { item: ArticleDataType }) {
    const [validation, setValidation] = useState<{
        error: string
        loading: boolean
    }>({
        error: "",
        loading: false
    })
    const [prompt, setPrompt] = useState<string>("")

    const handleEditArticle = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setValidation({
            ...validation,
            loading: true
        })

        const formData = new FormData(e.currentTarget)
        const data = Object.fromEntries(formData.entries())

        try {
            setValidation({
                ...validation,
                error: "",
                loading: true,
            })

            console.log("Updating article:", data)
            toast.success('Article updated successfully')
        } catch {
            setValidation({
                ...validation,
                error: "Failed to update article. Please try again.",
                loading: false,
            })

            toast.error('Failed to update article')
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
                    <p className="truncate max-w-[200px]">
                        {item.title}
                    </p>
                </Button>
            </SheetTrigger>

            <SheetContentCustom
                side="right"
                size="100vw"
                onInteractOutside={e => {
                    e.preventDefault()
                }}
                className="flex flex-col z-1000 bg-background/0 border-none shadow-none"
            >
                <ResizablePanelGroup
                    direction="horizontal"
                    className="h-full w-full overflow-auto"
                >
                    <ResizablePanel defaultSize={50} />

                    <ResizableHandle withHandle />

                    <ResizablePanel className="flex flex-col bg-background">
                        <SheetHeader className="gap-1">
                            <SheetTitle>Edit Article</SheetTitle>

                            <SheetDescription>
                                You can edit the article details below. Make sure to save your changes.
                            </SheetDescription>
                        </SheetHeader>

                        <Separator />

                        <div className="flex flex-1 flex-col gap-4 overflow-y-auto max-h-fit p-4 text-sm">
                            <form
                                onSubmit={handleEditArticle}
                                className="flex flex-1 h-full overflow-auto"
                            >
                                <div className="flex flex-1 flex-col justify-between items-stretch gap-4 overflow-y-auto p-4 text-sm">
                                    <div className="flex flex-col gap-4 flex-1">
                                        <div className="flex flex-col gap-3">
                                            <Label htmlFor="title">Title</Label>

                                            <div className="flex gap-3">
                                                <Input
                                                    id="title"
                                                    name="title"
                                                    type="text"
                                                    placeholder="Article title..."
                                                    onChange={(e) => setPrompt(e.target.value)}
                                                    required
                                                    disabled={validation.loading}
                                                />

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        {prompt.trim() ? (
                                                            <Button
                                                                variant="ghost"
                                                                disabled={validation.loading || !prompt.trim()}
                                                            >
                                                                <Bot className="size-4" />
                                                            </Button>
                                                        ) : (
                                                            <div className="flex justify-center items-center px-3 py-2">
                                                                <Bot className="size-4 opacity-50" />
                                                            </div>
                                                        )}
                                                    </TooltipTrigger>

                                                    <TooltipContent className="z-2000">
                                                        <p className="text-xs">
                                                            Generate Content
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            <Label htmlFor="content">Content</Label>
                                            <Tiptap
                                                content=""
                                                onChange={(content) => {
                                                    console.log('Content changed:', content)
                                                }}
                                            />
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
                    </ResizablePanel>
                </ResizablePanelGroup>
            </SheetContentCustom>
        </Sheet>
    )
}

// Define columns for the article data table
const articleColumns: ColumnDef<ArticleDataType>[] = [
    {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => {
            return <ArticleTableCellViewer item={row.original} />
        },
        enableHiding: false,
    },
    {
        accessorKey: "content",
        header: "Content",
        cell: ({ row }) => (
            <p className="truncate max-w-[200px]">
                {row.original.content}
            </p>
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
        accessorKey: "updatedAt",
        header: "Updated At",
        cell: ({ row }) => (
            <span>
                {new Date(row?.original?.updatedAt as Date).toLocaleDateString("en-US", {
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
]

export function ArticleDataTable({
    initialData,
}: {
    initialData: ArticleDataType[];
}) {
    // Custom delete handler for articles
    const handleDeleteArticle = async (ids: string | string[] | number | number[] | ArticleDataType | ArticleDataType[]) => {
        try {
            // Here you would typically make an API call to delete articles
            console.log("Deleting articles:", ids)

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            // In a real app, you'd refetch data or update state from parent
            return Promise.resolve()
        } catch (error) {
            console.error("Error deleting articles:", error)
            throw error
        }
    }

    // Custom import handler for articles
    const handleImportArticle = async (data: ArticleDataType[]) => {
        try {
            // Here you would typically validate and save imported articles
            console.log("Importing articles:", data)

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000))

            return Promise.resolve()
        } catch (error) {
            console.error("Error importing articles:", error)
            throw error
        }
    }

    // Custom export handler for articles
    const handleExportArticle = (data: ArticleDataType[]) => {
        // Custom export logic if needed
        import("xlsx").then((XLSX) => {
            const exportData = data.map(article => ({
                Title: article.title,
                Content: article.content,
                "Created At": new Date(article.createdAt as Date).toLocaleDateString(),
                "Updated At": new Date(article.updatedAt as Date).toLocaleDateString(),
            }))

            const ws = XLSX.utils.json_to_sheet(exportData)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, "Articles")

            const fileName = `articles_export_${new Date().toISOString().split('T')[0]}.xlsx`
            XLSX.writeFile(wb, fileName)
        })
    }

    // Configure the generic data table
    const tableConfig: GenericDataTableConfig<ArticleDataType> = {
        data: initialData,
        columns: articleColumns,

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
        // searchKey: "title",
        // searchPlaceholder: "Search articles by title...",

        // Pagination settings
        initialPageSize: 10,
        pageSizeOptions: [10, 20, 30, 50, 100],

        // Export configuration
        exportFileName: `articles_${new Date().toISOString().split('T')[0]}.xlsx`,
        exportSheetName: "Articles",

        // Event handlers
        onDelete: handleDeleteArticle,
        onImport: handleImportArticle,
        onExport: handleExportArticle,

        // Custom labels
        labels: {
            deleteTitle: "Delete Article",
            deleteDescription: (article) => `Are you sure you want to delete "${article.title}"? This action cannot be undone.`,
            bulkDeleteTitle: "Delete Articles",
            bulkDeleteDescription: (count) => `Are you sure you want to delete ${count} article(s)? This action cannot be undone.`,
            importTitle: "Import Articles",
            importDescription: (count) => `You are about to import ${count} article(s). Please choose how you want to handle the import:`,
            noDataMessage: "No articles found.",
            exportName: "articles"
        }
    }

    return <DataTable config={tableConfig} />
} 