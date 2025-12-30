/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { colorsRGB } from '@/utils/color';
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
                    '--glow-color': Array.isArray(colorsRGB[color])
                        ? `linear-gradient(135deg, rgb(${colorsRGB[color][0]} / 5%), rgb(${colorsRGB[color][1]} / 5%))`
                        : `rgb(${colorsRGB[color]} / 5%)`,
                    '--glow-size': `${glowArea}px`,
                    '--glow-blur': `${glowArea * 2}px`,
                    '--glow-spread': `${glowArea}px`,
                    borderImage: Array.isArray(colorsRGB[color])
                        ? `linear-gradient(135deg, rgb(${colorsRGB[color][0]}), rgb(${colorsRGB[color][1]}))`
                        : undefined,
                    '--border-color': !Array.isArray(colorsRGB[color])
                        ? `rgb(${colorsRGB[color]})`
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

export interface GlowCardProps {
    /** URL của hình ảnh hiển thị */
    imageUrl: string;
    /** Tiêu đề của card */
    title: string;
    /** Màu nền chính của card (HSL format, ví dụ: "200 80% 60%") */
    color?: string;
    /** Độ mờ của icon (blur radius) */
    iconBlur?: number;
    /** Độ bão hòa màu của icon */
    iconSaturate?: number;
    /** Độ sáng của icon */
    iconBrightness?: number;
    /** Độ tương phản của icon */
    iconContrast?: number;
    /** Kích thước scale của icon nền */
    iconScale?: number;
    /** Độ mờ đục của icon */
    iconOpacity?: number;
    /** Độ rộng của viền */
    borderWidth?: number;
    /** Độ mờ của viền */
    borderBlur?: number;
    /** Độ bão hòa của viền */
    borderSaturate?: number;
    /** Độ sáng của viền */
    borderBrightness?: number;
    /** Độ tương phản của viền */
    borderContrast?: number;
    /** Chiều rộng của card */
    width?: number;
    /** Tỷ lệ khung hình (aspect ratio) */
    aspectRatio?: string;
    /** Custom className */
    className?: string;
    /** Callback khi click vào card */
    onClick?: () => void;
}

export const GlowCard = ({
    imageUrl,
    title,
    color,
    iconBlur = 28,
    iconSaturate = 5,
    iconBrightness = 1.3,
    iconContrast = 1.4,
    iconScale = 3.4,
    iconOpacity = 0.25,
    borderWidth = 3,
    borderBlur = 0,
    borderSaturate = 4.2,
    borderBrightness = 2.5,
    borderContrast = 2.5,
    width = 300,
    aspectRatio = "4 / 3",
    className,
    onClick,
}: GlowCardProps) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [pointerX, setPointerX] = useState(-10);
    const [pointerY, setPointerY] = useState(-10);

    useEffect(() => {
        const handlePointerMove = (event: PointerEvent) => {
            if (!cardRef.current) return;

            const rect = cardRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const relativeX = event.clientX - centerX;
            const relativeY = event.clientY - centerY;

            // Normalize to -1 to 1 range
            const x = relativeX / (rect.width / 2);
            const y = relativeY / (rect.height / 2);

            setPointerX(x);
            setPointerY(y);
        };

        document.addEventListener("pointermove", handlePointerMove);
        return () => document.removeEventListener("pointermove", handlePointerMove);
    }, []);

    return (
        <article
            ref={cardRef}
            className={cn(
                "relative cursor-pointer rounded-xl transition-all duration-[120ms] ease-out",
                "active:brightness-95",
                className
            )}
            style={{
                width: `${width}px`,
                aspectRatio,
                outline: `2px solid hsl(var(--card-color) / 0.4)`,
                background: `linear-gradient(135deg, hsl(var(--glow-card-bg)), hsl(var(--card-color) / 0.08))`,
                containerType: "size",
                // CSS custom properties cho hiệu ứng
                ["--pointer-x" as string]: pointerX,
                ["--pointer-y" as string]: pointerY,
                ["--icon-blur" as string]: `${iconBlur}px`,
                ["--icon-saturate" as string]: iconSaturate,
                ["--icon-brightness" as string]: iconBrightness,
                ["--icon-contrast" as string]: iconContrast,
                ["--icon-scale" as string]: iconScale,
                ["--icon-opacity" as string]: iconOpacity,
                ["--border-width" as string]: `${borderWidth}px`,
                ["--border-blur" as string]: `${borderBlur}px`,
                ["--border-saturate" as string]: borderSaturate,
                ["--border-brightness" as string]: borderBrightness,
                ["--border-contrast" as string]: borderContrast,
                ["--card-color" as string]: color || "200 80% 60%",
            }}
            onClick={onClick}
        >
            <div
                className="absolute inset-0 grid place-items-center gap-2 overflow-hidden rounded-xl"
                style={{
                    clipPath: "inset(0 round 12px)",
                    alignContent: "center",
                }}
            >
                {/* Background glow image that follows mouse */}
                <div
                    className="absolute inset-0 grid place-items-center"
                    style={{
                        transform: "translateZ(0)",
                        filter: `blur(var(--icon-blur)) saturate(var(--icon-saturate)) brightness(var(--icon-brightness)) contrast(var(--icon-contrast))`,
                        translate: `calc(var(--pointer-x) * 50cqi) calc(var(--pointer-y) * 50cqh)`,
                        scale: `var(--icon-scale)`,
                        opacity: `var(--icon-opacity)`,
                        willChange: "transform, filter",
                    }}
                >
                    <div
                        className="grid place-items-center"
                        style={{
                            filter: `drop-shadow(0 0 50px hsl(var(--card-color) / 0.9)) drop-shadow(0 0 80px hsl(var(--card-color) / 0.6))`,
                        }}
                    >
                        <img
                            src={imageUrl}
                            alt=""
                            className="w-[100px] select-none"
                            draggable={false}
                        />
                    </div>
                </div>

                {/* Main image */}
                <img
                    src={imageUrl}
                    alt={title}
                    className="relative z-[2] w-[100px] select-none"
                    draggable={false}
                />

                {/* Title */}
                <h2 className="relative z-[4] m-0 select-none text-base font-medium">
                    {title}
                </h2>
            </div>

            {/* Glassmorphism border effect */}
            <div
                className="pointer-events-none absolute inset-0 z-[2] rounded-[inherit]"
                style={{
                    clipPath: "inset(0 round 12px)",
                    transform: "translateZ(0)",
                    border: `var(--border-width) solid transparent`,
                    backdropFilter: `blur(var(--border-blur)) saturate(var(--border-saturate)) brightness(var(--border-brightness)) contrast(var(--border-contrast))`,
                    WebkitMask:
                        "linear-gradient(#fff 0 100%) border-box, linear-gradient(#fff 0 100%) padding-box",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                    background: `linear-gradient(135deg, hsl(var(--card-color) / 0.2), hsl(var(--card-color) / 0.08))`,
                }}
            />
        </article>
    );
};

// Helper function to generate random HSL color
export const getRandomColor = (): string => {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 75 + Math.floor(Math.random() * 25); // 75-100%
    const lightness = 55 + Math.floor(Math.random() * 15); // 55-70%
    return `${hue} ${saturation}% ${lightness}%`;
};