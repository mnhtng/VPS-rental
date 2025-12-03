import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const CartPlaceholder = () => {
    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header Skeleton */}
                <div className="mb-8 animate-in fade-in duration-500">
                    <Skeleton className="h-10 w-64 mb-3" />
                    <Skeleton className="h-6 w-96" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items Skeleton */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="shadow-xl backdrop-blur-sm animate-in fade-in duration-500 delay-100">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div className="flex items-center">
                                    <Skeleton className="h-9 w-9 rounded-lg mr-3" />
                                    <Skeleton className="h-6 w-48" />
                                </div>
                                <Skeleton className="h-8 w-24" />
                            </CardHeader>
                            <CardContent className="p-4 space-y-6">
                                {[...Array(2)].map((_, index) => (
                                    <div key={index} className="rounded-xl p-4 bg-background border">
                                        {/* Plan Header */}
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="flex-1">
                                                <Skeleton className="h-6 w-48 mb-2" />
                                                <Skeleton className="h-5 w-32" />
                                            </div>
                                        </div>
                                        <Separator className="my-4" />
                                        {/* Specs */}
                                        <div className="mb-4">
                                            <Skeleton className="h-4 w-40 mb-3" />
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {[...Array(4)].map((_, i) => (
                                                    <div key={i} className="p-3 bg-muted rounded-lg">
                                                        <Skeleton className="h-5 w-5 mx-auto mb-2" />
                                                        <Skeleton className="h-4 w-12 mx-auto mb-1" />
                                                        <Skeleton className="h-3 w-16 mx-auto" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <Separator className="my-4" />
                                        {/* Configuration */}
                                        <div>
                                            <Skeleton className="h-4 w-32 mb-3" />
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                {[...Array(3)].map((_, i) => (
                                                    <div key={i} className="p-3 bg-muted rounded-lg">
                                                        <Skeleton className="h-3 w-16 mb-2" />
                                                        <Skeleton className="h-4 w-24" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order Summary Skeleton */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-16.5 shadow-2xl border border-accent backdrop-blur-sm animate-in fade-in duration-500 delay-200">
                            <CardHeader>
                                <div className="flex items-center">
                                    <Skeleton className="h-6 w-6 rounded mr-3" />
                                    <Skeleton className="h-6 w-32" />
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                {/* Promo Code */}
                                <div className="space-y-4">
                                    <Skeleton className="h-5 w-24 mb-3" />
                                    <div className="grid grid-cols-2 gap-3">
                                        {[...Array(4)].map((_, i) => (
                                            <Skeleton key={i} className="h-16 rounded-md" />
                                        ))}
                                    </div>
                                </div>
                                <Separator />
                                {/* Pricing */}
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <Skeleton className="h-5 w-20" />
                                        <Skeleton className="h-5 w-24" />
                                    </div>
                                    <div className="flex justify-between">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-20" />
                                    </div>
                                </div>
                                <Separator />
                                <div className="rounded-xl p-4 border-2">
                                    <div className="flex justify-between items-center">
                                        <Skeleton className="h-6 w-16" />
                                        <Skeleton className="h-8 w-32" />
                                    </div>
                                </div>
                                <div className="rounded-xl p-4 border border-dashed space-y-3">
                                    <Skeleton className="h-5 w-32 mb-3" />
                                    {[...Array(5)].map((_, i) => (
                                        <Skeleton key={i} className="h-4 w-full" />
                                    ))}
                                </div>
                                <Skeleton className="h-14 w-full rounded-xl" />
                                <Skeleton className="h-12 w-full rounded-xl" />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CartPlaceholder