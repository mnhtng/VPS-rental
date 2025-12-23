import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const MyOrderPlaceholder = () => {
    return (
        <div className="min-h-screen max-w-7xl mx-auto py-8 px-4">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <Skeleton className="h-9 w-48 mb-2" />
                    <Skeleton className="h-5 w-72" />
                </div>

                <Button variant="outline" size="lg" disabled>
                    <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
                    Refresh
                </Button>
            </div>

            {/* Search and Filter Skeleton */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-full sm:w-48" />
            </div>

            {/* Order Cards Skeleton */}
            <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="mb-4">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                    <Skeleton className="h-4 w-4 rounded-full" />
                                    <Skeleton className="h-6 w-40" />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Skeleton className="h-6 w-20" />
                                    <Skeleton className="h-8 w-8 rounded" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map((j) => (
                                    <div key={j} className="flex items-center space-x-2">
                                        <Skeleton className="h-4 w-4" />
                                        <div className="flex-1">
                                            <Skeleton className="h-4 w-20 mb-2" />
                                            <Skeleton className="h-5 w-32" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

export default MyOrderPlaceholder