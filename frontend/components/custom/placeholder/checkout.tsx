import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const CheckoutPlaceholder = () => {
    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header Skeleton */}
                <div className="mb-10 animate-in fade-in duration-500">
                    <Skeleton className="h-10 w-32 mb-6" />
                    <Skeleton className="h-10 w-64 mb-3" />
                    <Skeleton className="h-6 w-96" />
                </div>

                {/* Progress Steps Skeleton */}
                <div className="mb-12 animate-in fade-in duration-500 delay-100">
                    <div className="flex items-center justify-center space-x-8">
                        <div className="flex items-center space-x-3">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <Skeleton className="h-5 w-16" />
                        </div>
                        <Skeleton className="h-2 w-32 rounded-full" />
                        <div className="flex items-center space-x-3">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <Skeleton className="h-5 w-20" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Form Skeleton */}
                    <div className="lg:col-span-2">
                        <Card className="backdrop-blur-sm border-0 shadow-2xl animate-in fade-in duration-500 delay-200">
                            <CardHeader>
                                <div className="flex items-center">
                                    <Skeleton className="h-6 w-6 rounded mr-3" />
                                    <Skeleton className="h-7 w-48" />
                                </div>
                                <Skeleton className="h-5 w-full mt-2" />
                            </CardHeader>
                            <CardContent className="space-y-8 p-8">
                                {/* Personal Info */}
                                <div className="space-y-4">
                                    <Skeleton className="h-6 w-40 mb-4" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-12 w-full" />
                                        </div>
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-12 w-full" />
                                        </div>
                                    </div>
                                </div>
                                {/* Contact Info */}
                                <div className="space-y-4">
                                    <Skeleton className="h-6 w-40 mb-4" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-12 w-full" />
                                    </div>
                                </div>
                                {/* Address */}
                                <div className="space-y-4">
                                    <Skeleton className="h-6 w-40 mb-4" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-24 w-full" />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-6">
                                    <Skeleton className="h-12 w-48 rounded-xl" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order Summary Skeleton */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-16.5 backdrop-blur-sm border-2 shadow-2xl animate-in fade-in duration-500 delay-300">
                            <CardHeader>
                                <div className="flex items-center">
                                    <Skeleton className="h-8 w-8 rounded-full mr-3" />
                                    <Skeleton className="h-7 w-32" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 p-8">
                                {/* VPS Items */}
                                <div className="space-y-4">
                                    {[...Array(2)].map((_, index) => (
                                        <div key={index} className="bg-muted rounded-2xl p-6">
                                            <Skeleton className="h-6 w-32 mb-3" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-full" />
                                                <Skeleton className="h-4 w-3/4" />
                                                <Skeleton className="h-8 w-24 mt-4" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Separator />
                                {/* Pricing */}
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                    <div className="flex justify-between">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-16" />
                                    </div>
                                </div>
                                <Separator />
                                {/* Total */}
                                <div className="bg-muted rounded-2xl p-6">
                                    <Skeleton className="h-8 w-32 mx-auto mb-3" />
                                    <Skeleton className="h-10 w-40 mx-auto" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
