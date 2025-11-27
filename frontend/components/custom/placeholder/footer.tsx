import { Skeleton } from '@/components/ui/skeleton';

const FooterPlaceholder = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <Skeleton className="h-25 w-25 mb-4 bg-gray-700" />
                    <Skeleton className="h-20 w-full mb-6 bg-gray-700" />
                    <div className="flex space-x-4">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-5 w-5 rounded bg-gray-700" />
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {[...Array(2)].map((_, i) => (
                        <div key={i}>
                            <Skeleton className="h-6 w-32 mb-4 bg-gray-700" />
                            <div className="space-y-2">
                                {[...Array(3)].map((_, j) => (
                                    <Skeleton key={j} className="h-4 w-full bg-gray-700" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="border-t border-gray-800 py-6">
                <Skeleton className="h-4 w-64 mx-auto bg-gray-700" />
            </div>
        </div>
    )
}

export default FooterPlaceholder
