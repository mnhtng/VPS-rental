import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const HeroSectionPlaceholder = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center z-1">
            <div className="relative md:min-h-[calc(100vh-4rem)] w-full flex items-center justify-center py-10">
                <div className="w-full grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Left side skeleton */}
                    <div className="space-y-6">
                        <Skeleton className="h-12 w-3/4" />
                        <Skeleton className="h-32 w-full" />
                        <div className="flex gap-4">
                            <Skeleton className="h-12 w-32" />
                            <Skeleton className="h-12 w-32" />
                        </div>
                        <div className="flex gap-6 pt-4">
                            <Skeleton className="h-16 w-24" />
                            <Skeleton className="h-16 w-24" />
                            <Skeleton className="h-16 w-24" />
                        </div>
                    </div>
                    {/* Right side skeleton */}
                    <div className="relative hidden lg:block">
                        <Skeleton className="h-96 w-full rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export const FeaturesSectionPlaceholder = () => {
    return (
        [...Array(4)].map((_, index) => (
            <Card key={index} className="text-center border border-accent">
                <CardHeader>
                    <div className="flex justify-center mb-4">
                        <Skeleton className="h-8 w-8 rounded" />
                    </div>
                    <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-16 w-full" />
                </CardContent>
            </Card>
        ))
    )
}

export const PopularSectionPlaceholder = () => {
    return (
        [...Array(3)].map((_, index) => (
            <Card key={index} className="relative">
                <CardHeader className="text-center">
                    <Skeleton className="h-8 w-32 mx-auto mb-4" />
                    <Skeleton className="h-12 w-40 mx-auto" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex items-center">
                                <Skeleton className="h-5 w-5 rounded-full mr-3" />
                                <Skeleton className="h-4 flex-1" />
                            </div>
                        ))}
                    </div>
                    <Skeleton className="h-10 w-full rounded-md mt-4" />
                </CardContent>
            </Card>
        ))
    )
}

export const WhyChooseUsPlaceholder = () => {
    return (
        [...Array(4)].map((_, index) => (
            <div key={index} className="flex items-start space-x-4">
                <Skeleton className="h-16 w-16 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-16 w-full" />
                </div>
            </div>
        ))
    )
}