import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const PlansHeaderPlaceholder = () => {
    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <Skeleton className="h-12 w-96 mx-auto" />
            <Skeleton className="h-6 w-[600px] mx-auto" />
        </div>
    )
}

export const PlansFilterPlaceholder = () => {
    return (
        <Card className="animate-in fade-in duration-500">
            <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-9 rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-40" />
                        </div>
                    </div>
                </div>
                <div className="flex gap-6 flex-col lg:flex-row">
                    <div className="flex gap-6 lg:w-[50%]">
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                    <div className="flex-1 space-y-3">
                        <Skeleton className="h-4 w-48" />
                        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                            <Skeleton className="h-2 w-full" />
                            <div className="flex justify-between">
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export const PlansListPlaceholder = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {[...Array(6)].map((_, index) => (
                <Card key={index} className="relative animate-in fade-in duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Skeleton className="h-6 w-20" />
                    </div>
                    <CardHeader className="text-center pb-4">
                        <div className="flex justify-center mb-4">
                            <Skeleton className="h-12 w-12 rounded" />
                        </div>
                        <Skeleton className="h-8 w-32 mx-auto mb-2" />
                        <Skeleton className="h-16 w-full mb-4" />
                        <div className="py-4 space-y-2">
                            <Skeleton className="h-10 w-40 mx-auto" />
                            <Skeleton className="h-4 w-24 mx-auto" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex items-center">
                                    <Skeleton className="h-4 w-4 rounded mr-2" />
                                    <Skeleton className="h-4 flex-1" />
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center">
                                    <Skeleton className="h-4 w-4 rounded-full mr-3" />
                                    <Skeleton className="h-4 flex-1" />
                                </div>
                            ))}
                        </div>
                        <Skeleton className="h-10 w-full rounded-md mt-4" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

export const PlansFeaturePlaceholder = () => {
    return (
        <Card className="mt-12 animate-in fade-in duration-500">
            <CardHeader>
                <Skeleton className="h-8 w-96 mx-auto" />
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, index) => (
                        <div key={index} className="text-center space-y-3">
                            <Skeleton className="h-8 w-8 mx-auto rounded" />
                            <Skeleton className="h-5 w-32 mx-auto" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4 mx-auto" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

export const PlanItemPlaceholder = () => {
    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content Skeleton */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Plan Header Skeleton */}
                        <Card className="border-2">
                            <CardHeader className="text-center pb-6">
                                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-4">
                                    <Skeleton className="h-20 w-20 rounded-2xl" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-6 w-20 mx-auto" />
                                        <Skeleton className="h-8 w-48" />
                                    </div>
                                </div>
                                <Skeleton className="h-16 w-full max-w-2xl mx-auto" />
                            </CardHeader>
                        </Card>

                        {/* Specifications Skeleton */}
                        <Card className="border-2">
                            <CardHeader>
                                <Skeleton className="h-7 w-48" />
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-900">
                                            <Skeleton className="h-8 w-8 mx-auto mb-2" />
                                            <Skeleton className="h-8 w-12 mx-auto mb-1" />
                                            <Skeleton className="h-4 w-16 mx-auto" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Features Skeleton */}
                        <Card className="border-2">
                            <CardHeader>
                                <Skeleton className="h-7 w-40" />
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-3">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <Skeleton className="h-5 w-5 rounded-full" />
                                            <Skeleton className="h-4 flex-1" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Skeleton */}
                    <div className="space-y-6">
                        <Card className="border border-accent">
                            <CardHeader>
                                <Skeleton className="h-7 w-48" />
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="space-y-2">
                                        <Skeleton className="h-5 w-32" />
                                        <Skeleton className="h-10 w-full" />
                                    </div>
                                ))}
                                <div className="space-y-3 pt-4">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="flex justify-between">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-4 w-20" />
                                        </div>
                                    ))}
                                </div>
                                <Skeleton className="h-12 w-full rounded-md" />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
