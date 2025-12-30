import { Card, CardContent, CardHeader } from "@/components/ui/card"

import { Skeleton } from "@/components/ui/skeleton"

export const AnalyticsPlaceholder = () => {
    return (
        <div className="space-y-6 pb-8">
            {/* Summary Stats Skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[0, 1, 2, 3].map((i) => (
                    <Card key={i} className="animate-in fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 mb-2">
                                <Skeleton className="h-4 w-4 rounded" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-20" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Row 1 Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart Skeleton */}
                <Card className="animate-in fade-in slide-in-from-left-4" style={{ animationDelay: '200ms' }}>
                    <CardHeader>
                        <Skeleton className="h-5 w-40 mb-2" />
                        <Skeleton className="h-4 w-60" />
                    </CardHeader>
                    <CardContent>
                        <div className="h-75 flex items-end gap-2">
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                    <Skeleton
                                        className="w-full animate-pulse"
                                        style={{
                                            height: `${Math.random() * 60 + 20}%`,
                                            animationDelay: `${i * 100}ms`
                                        }}
                                    />
                                    <Skeleton className="h-3 w-8" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* User Growth Chart Skeleton */}
                <Card className="animate-in fade-in slide-in-from-right-4" style={{ animationDelay: '200ms' }}>
                    <CardHeader>
                        <Skeleton className="h-5 w-40 mb-2" />
                        <Skeleton className="h-4 w-60" />
                    </CardHeader>
                    <CardContent>
                        <div className="h-75 flex items-center justify-center">
                            <Skeleton className="h-full w-full rounded-lg" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2 Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* VPS by Plan Bar Chart */}
                <Card className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '300ms' }}>
                    <CardHeader>
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent>
                        <div className="h-50 flex flex-col gap-3">
                            {[...Array(3)].map((_, i) => (
                                <Skeleton
                                    key={i}
                                    className="h-8 animate-pulse"
                                    style={{
                                        width: `${70 + Math.random() * 30}%`,
                                        animationDelay: `${i * 100}ms`
                                    }}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* VPS by OS Pie Chart */}
                <Card className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '350ms' }}>
                    <CardHeader>
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                        <Skeleton className="h-40 w-40 rounded-full" />
                    </CardContent>
                </Card>

                {/* Payment Methods Pie Chart */}
                <Card className="animate-in fade-in slide-in-from-bottom-4 md:col-span-2 lg:col-span-1" style={{ animationDelay: '400ms' }}>
                    <CardHeader>
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                        <Skeleton className="h-40 w-40 rounded-full" />
                    </CardContent>
                </Card>
            </div>

            {/* Table Skeleton */}
            <Card className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '500ms' }}>
                <CardHeader>
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {/* Table Header */}
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-20 hidden sm:block" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-20 hidden md:block" />
                        </div>
                        {/* Table Rows */}
                        {[0, 1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between p-3 border rounded-lg animate-in fade-in"
                                style={{ animationDelay: `${550 + i * 50}ms` }}
                            >
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-12" />
                                <Skeleton className="h-4 w-16 hidden sm:block" />
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-16 hidden md:block" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}