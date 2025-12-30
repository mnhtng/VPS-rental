export const SearchResultPlaceholder = () => {
    return (
        <div className="flex flex-col items-center w-full">
            <div className="w-full max-w-md space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-border/50 cursor-default transition-colors">
                    <div className="w-8 h-8 rounded-full bg-border animate-pulse" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 bg-border rounded animate-pulse" />
                        <div className="h-3 w-1/2 bg-border rounded animate-pulse" />
                    </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-border/50 cursor-default transition-colors">
                    <div className="w-8 h-8 rounded-full bg-border animate-pulse" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-2/3 bg-border rounded animate-pulse" />
                        <div className="h-3 w-1/3 bg-border rounded animate-pulse" />
                    </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-border/50 cursor-default transition-colors">
                    <div className="w-8 h-8 rounded-full bg-border animate-pulse" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-4/5 bg-border rounded animate-pulse" />
                        <div className="h-3 w-2/5 bg-border rounded animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
}
