import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export const VPSPlaceholder = () => {
    return (
        <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border-b animate-in fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-20 ml-auto" />
                </div>
            ))}
        </div>
    )
}

export const VPSItemPlaceholder = () => {
    return (
        <div className="space-y-6 w-full">
            {/* Header Skeleton */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between animate-in fade-in">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-48" />
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-80" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-28" />
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="space-y-4">
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-10 w-24" />
                    ))}
                </div>

                {/* Stats Cards Skeleton */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="animate-in fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-4 rounded" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-20 mb-2" />
                                <Skeleton className="h-3 w-16" />
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Chart & Info Skeleton */}
                <div className="grid gap-4 lg:grid-cols-7">
                    <Card className="lg:col-span-4 animate-in fade-in" style={{ animationDelay: '200ms' }}>
                        <CardHeader>
                            <Skeleton className="h-6 w-40 mb-2" />
                            <Skeleton className="h-4 w-64" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-end gap-2 h-[250px]">
                                    {[40, 65, 45, 80, 55, 70, 60, 75, 50, 85, 65, 70].map((height, i) => (
                                        <Skeleton
                                            key={i}
                                            className="flex-1 rounded-t animate-pulse"
                                            style={{ height: `${height}%`, animationDelay: `${i * 50}ms` }}
                                        />
                                    ))}
                                </div>
                                <div className="flex justify-between">
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <Skeleton key={i} className="h-3 w-8" />
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="lg:col-span-3 animate-in fade-in" style={{ animationDelay: '250ms' }}>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="grid grid-cols-2 gap-4 animate-in fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
