"use client";

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { colorsHex } from '@/utils/color';
import styles from '@/styles/glowing-card.module.css';

export interface GlowingCardProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    description?: string;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gold';
    glowArea?: number;
    children?: React.ReactNode;
    className?: string;
    contentClassName?: string;
}

const GlowingCard = ({
    title = "",
    description = "",
    color = 'blue',
    glowArea = 50,
    children,
    className,
    contentClassName,
    ...props
}: GlowingCardProps) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isGlowing, setIsGlowing] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!cardRef.current) return;
            const rect = cardRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Kiểm tra nếu con trỏ nằm trong vùng mở rộng
            const inGlowArea =
                x >= -glowArea &&
                y >= -glowArea &&
                x <= rect.width + glowArea &&
                y <= rect.height + glowArea;

            if (inGlowArea) {
                // Clamp mouse position vào vùng card để glowing không bị lệch
                const clampedX = Math.max(0, Math.min(x, rect.width));
                const clampedY = Math.max(0, Math.min(y, rect.height));
                setMousePosition({ x: clampedX, y: clampedY });
                setIsGlowing(true);
            } else {
                setIsGlowing(false);
            }
        };

        const onMove = (e: MouseEvent) => {
            requestAnimationFrame(() => handleMouseMove(e));
        };

        window.addEventListener('mousemove', onMove);

        return () => {
            window.removeEventListener('mousemove', onMove);
        }
    }, [glowArea]);

    return (
        <Card
            ref={cardRef}
            className={cn(
                "relative flex-1 min-w-max p-2 rounded-xl border transition-all duration-300 overflow-hidden group",
                className
            )}
            {...props}
        >
            <div
                className={cn(
                    styles.overlay,
                    "absolute inset-0 rounded-xl transition-opacity duration-300 ease-out pointer-events-none",
                    "bg-[var(--glow-bg)]",
                    isGlowing ? "opacity-100" : "opacity-0"
                )}
                style={{
                    '--mouse-x': `${mousePosition.x}px`,
                    '--mouse-y': `${mousePosition.y}px`,
                    '--glow-color': Array.isArray(colorsHex[color])
                        ? `linear-gradient(135deg, rgb(${colorsHex[color][0]} / 5%), rgb(${colorsHex[color][1]} / 5%))`
                        : `rgb(${colorsHex[color]} / 5%)`,
                    '--glow-size': `${glowArea}px`,
                    '--glow-blur': `${glowArea * 2}px`,
                    '--glow-spread': `${glowArea}px`,
                    borderImage: Array.isArray(colorsHex[color])
                        ? `linear-gradient(135deg, rgb(${colorsHex[color][0]}), rgb(${colorsHex[color][1]}))`
                        : undefined,
                    '--border-color': !Array.isArray(colorsHex[color])
                        ? `rgb(${colorsHex[color]})`
                        : undefined,
                } as React.CSSProperties}
            />

            <div className="relative z-10 flex flex-col h-full">
                {title || description && (
                    <CardHeader>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </CardHeader>
                )}

                <CardContent className={cn(
                    "p-3",
                    contentClassName
                )}>
                    {children}
                </CardContent>
            </div>
        </Card>
    );
};

export default GlowingCard;