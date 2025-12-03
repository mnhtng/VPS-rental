import { Skeleton } from '@/components/ui/skeleton';

const HeaderPlaceHolder = () => {
    return (
        <div className="hidden lg:flex items-center space-x-4">
            <Skeleton className="h-9 w-9 rounded-md" />
            <div className="w-[1px] h-6 bg-accent/50" />
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md" />
            <div className="w-[1px] h-6 bg-accent/50" />
            <Skeleton className="h-8 w-8 rounded-full" />
        </div>
    )
}

export default HeaderPlaceHolder
