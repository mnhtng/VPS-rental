"use client"

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslations } from "next-intl"

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    startIndex: number;
    endIndex: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (itemsPerPage: number) => void;
    itemLabel?: string;
}

const Pagination = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    startIndex,
    endIndex,
    onPageChange,
    onItemsPerPageChange,
    itemLabel
}: PaginationProps) => {
    const t = useTranslations("pagination")
    const label = itemLabel || t('default_label')

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-4 border-t animate-in fade-in slide-in-from-bottom duration-700">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                    {t('showing', { start: startIndex + 1, end: Math.min(endIndex, totalItems), total: totalItems, label })}
                </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
                {/* Items per page selector */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{t('per_page')}</span>
                    <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) => {
                            onItemsPerPageChange(Number(value));
                            onPageChange(1);
                        }}
                    >
                        <SelectTrigger className="w-20 h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Page navigation */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1}
                    >
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <span className="flex items-center justify-center min-w-25 text-sm">
                        {t('page_of', { current: currentPage, total: totalPages })}
                    </span>

                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default Pagination