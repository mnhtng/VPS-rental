'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const ProfilePlaceholder = () => {
    return (
        <div className="min-h-screen max-w-4xl mx-auto py-8 px-4">
            <div className="mb-8">
                <Skeleton className="h-10 w-64 mb-2" />
                <Skeleton className="h-5 w-96" />
            </div>
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-10 w-24" />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center space-x-4">
                            <Skeleton className="w-20 h-20 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-36" />
                            </div>
                        </div>
                        <Skeleton className="h-px w-full" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ))}
                            <div className="md:col-span-2 space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-24 w-full" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default ProfilePlaceholder;