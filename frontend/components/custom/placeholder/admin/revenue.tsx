import {
    Tabs,
} from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton";

export const RevenuePlaceholder = () => {
    return (
        <div className="space-y-6 pb-8">
            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[0, 1, 2, 3].map((i) => (
                    <Card key={i} className="animate-in fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                        <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-24 mb-2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-32 mb-2" />
                            <Skeleton className="h-3 w-20" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Skeleton */}
            <Tabs defaultValue="monthly" className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <Skeleton className="h-10 w-50" />
                    <Skeleton className="h-10 w-45" />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {[0, 1].map((chartIndex) => (
                        <Card key={chartIndex}>
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
                    ))}
                </div>
            </Tabs>

            {/* Orders Table Skeleton */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <Skeleton className="h-6 w-32 mb-2" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                        <Skeleton className="h-10 w-75" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between p-4 rounded-lg border animate-in fade-in"
                                style={{ animationDelay: `${i * 30}ms` }}
                            >
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-48" />
                                </div>
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-6 w-16" />
                                    <Skeleton className="h-5 w-20" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}