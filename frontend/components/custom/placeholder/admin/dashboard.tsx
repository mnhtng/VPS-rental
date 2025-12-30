import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const DashboardPlaceholder = () => {
    return (
        <div className="space-y-6 pb-8">
            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[0, 1, 2, 3].map((i) => (
                    <Card key={i} className="animate-in fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center gap-3 mb-4">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-10 w-10 rounded-lg" />
                            </div>
                            <Skeleton className="h-8 w-24 mb-3" />
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-4 w-4" />
                                <Skeleton className="h-4 w-28" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Skeleton */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Revenue Chart Skeleton */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-4 w-48" />
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

                {/* Pie Chart Skeleton */}
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-24 mb-2" />
                        <Skeleton className="h-4 w-40" />
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                        <Skeleton className="h-60 w-60 rounded-full" />
                    </CardContent>
                </Card>
            </div>

            {/* Recent Orders Skeleton */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[0, 1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between p-4 rounded-lg border animate-in fade-in"
                                style={{ animationDelay: `${i * 50}ms` }}
                            >
                                <div className="flex-1">
                                    <Skeleton className="h-4 w-32 mb-2" />
                                    <Skeleton className="h-3 w-48" />
                                </div>
                                <div className="text-right">
                                    <Skeleton className="h-5 w-20 mb-1" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}