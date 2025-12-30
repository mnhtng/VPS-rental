import { Skeleton } from '@/components/ui/skeleton';
import {
    TableCell,
    TableRow,
} from '@/components/ui/table';

const SupportPlaceholder = () => {
    return (
        Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
                <TableCell>
                    <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                    <Skeleton className="h-4 w-full" />
                </TableCell>
                <TableCell>
                    <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                    <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                    <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                    <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                    <Skeleton className="h-8 w-8" />
                </TableCell>
            </TableRow>
        ))
    )
}

export default SupportPlaceholder