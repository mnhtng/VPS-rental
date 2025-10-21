import React, {
    useRef,
    useState,
    ReactNode,
    UIEvent,
} from "react";
import { motion, useInView } from "framer-motion";
import "@/styles/scrollbar.scss";

interface AnimatedScrollItemProps {
    children: ReactNode;
    index: number;
    delay?: number;
}

const AnimatedScrollItem: React.FC<AnimatedScrollItemProps> = ({
    children,
    index,
    delay = 0.05
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { amount: 0.3, once: false });

    return (
        <motion.div
            ref={ref}
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={inView ? { scale: 1, opacity: 1, y: 0 } : { scale: 0.8, opacity: 0, y: 20 }}
            transition={{ duration: 0.4, delay: index * delay }}
        >
            {children}
        </motion.div>
    );
};

interface AnimatedScrollListProps {
    children: ReactNode;
    showGradients?: boolean;
    showScrollbar?: boolean;
    className?: string;
    containerClassName?: string;
    maxHeight: string;
    onScroll?: (e: UIEvent<HTMLDivElement>) => void;
    itemDelay?: number;
}

const AnimatedScrollList: React.FC<AnimatedScrollListProps> = ({
    children,
    showGradients = true,
    showScrollbar = true,
    className = "",
    containerClassName = "",
    maxHeight,
    onScroll,
    itemDelay = 0
}) => {
    const listRef = useRef<HTMLDivElement>(null);
    const [topGradientOpacity, setTopGradientOpacity] = useState<number>(0);
    const [bottomGradientOpacity, setBottomGradientOpacity] = useState<number>(0);

    const handleScroll = (e: UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target as HTMLDivElement;

        // Calculate gradient opacities
        setTopGradientOpacity(Math.min(scrollTop / 50, 1));
        const bottomDistance = scrollHeight - (scrollTop + clientHeight);
        setBottomGradientOpacity(
            scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1)
        );

        // Call external onScroll if provided
        onScroll?.(e);
    };

    // Convert children to array and add animation wrapper
    const animatedChildren = React.Children.map(children, (child, index) => (
        <AnimatedScrollItem key={index} index={index} delay={itemDelay}>
            {child}
        </AnimatedScrollItem>
    ));

    return (
        <div className={`max-w-4xl mx-auto w-full ${className}`}>
            <div className={`rounded-xl sm:rounded-2xl border-2 border-secondary-foreground p-3 relative w-full ${containerClassName}`}>
                {/* Gradient overlays */}
                {showGradients && (
                    <>
                        <div
                            className="absolute top-3 left-3 right-3 h-[50px] bg-gradient-to-b from-background to-transparent pointer-events-none transition-opacity duration-300 ease-in-out z-10 rounded-t-lg"
                            style={{ opacity: topGradientOpacity }}
                        />
                        <div
                            className="absolute bottom-3 left-3 right-3 h-[80px] bg-gradient-to-t from-background to-transparent pointer-events-none transition-opacity duration-300 ease-in-out z-10 rounded-b-lg"
                            style={{ opacity: bottomGradientOpacity }}
                        />
                    </>
                )}

                <div
                    ref={listRef}
                    className={`${showScrollbar ? "scrollbar-thin" : "scrollbar-hidden"} ${maxHeight} overflow-y-auto overflow-x-hidden relative w-full px-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border/50 hover:scrollbar-thumb-border/80`}
                    onScroll={handleScroll}
                >
                    {animatedChildren}
                </div>
            </div>
        </div>
    );
};

export { AnimatedScrollList };
