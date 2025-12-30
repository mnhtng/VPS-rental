"use client"

import { useEffect, useRef, useState } from "react"
import {
    Label,
    PolarGrid,
    PolarRadiusAxis,
    RadialBar,
    RadialBarChart,
} from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { TrendingUp } from "lucide-react"

export interface RadialChartData {
    category: string
    value: number
    percentage: number
    fill?: string
}

export interface RadialChartProps {
    title?: string
    description?: string
    data: RadialChartData
    chartConfig: ChartConfig
    centerLabel?: string
    footerContent?: {
        mainText?: string
        subText?: string
        showTrending?: boolean
        trendingColor?: string
        trendingIcon?: React.ReactNode
    }
    innerRadius?: number
    outerRadius?: number
    cornerRadius?: number
    startAngle?: number
    className?: string
    numberSize?: 'sm' | 'md' | 'lg' | 'xl'
    labelSize?: 'xs' | 'sm' | 'md'
    animationDuration?: number
    centerOffset?: { x?: number; y?: number }
}

export const RadialChartShapeComponent = ({
    title,
    description,
    data,
    centerLabel,
    footerContent,
    chartConfig,
    innerRadius = 80,
    outerRadius = 130,
    cornerRadius = 50,
    startAngle = 90,
    className = "",
    numberSize = 'lg',
    labelSize = 'sm',
    animationDuration = 2.5,
    centerOffset = {}
}: RadialChartProps) => {
    const targetEndAngle = startAngle + (data.percentage * 3.6) // 360 độ tương ứng với 100%
    const chartRef = useRef<HTMLDivElement>(null)
    const [isChartVisible, setIsChartVisible] = useState(false)
    const [currentEndAngle, setCurrentEndAngle] = useState(startAngle) // Start from startAngle
    const [currentPercentage, setCurrentPercentage] = useState(0) // For synced counting
    const animationRef = useRef<number>(0)

    // Intersection Observer to trigger animation when chart is visible
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsChartVisible(true)
                    observer.disconnect() // Only trigger once
                }
            },
            { threshold: 0.3 } // Trigger when 30% of chart is visible
        )

        if (chartRef.current) {
            observer.observe(chartRef.current)
        }

        return () => observer.disconnect()
    }, [chartRef])

    // Animate RadialBar rotation and percentage counting together
    useEffect(() => {
        if (!isChartVisible) return

        const startTime = Date.now()
        const duration = animationDuration * 1000 // Convert to milliseconds
        const startEndAngle = startAngle
        const endEndAngle = targetEndAngle
        const startPercentage = 0
        const endPercentage = data.percentage

        const animate = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)

            // Easing function for smooth animation (easeOutQuart)
            const easeOutQuart = 1 - Math.pow(1 - progress, 4)

            // Calculate current values
            const newEndAngle = startEndAngle + (endEndAngle - startEndAngle) * easeOutQuart
            const newPercentage = startPercentage + (endPercentage - startPercentage) * easeOutQuart

            setCurrentEndAngle(newEndAngle)
            setCurrentPercentage(Math.round(newPercentage))

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate)
            } else {
                setCurrentEndAngle(endEndAngle)
                setCurrentPercentage(endPercentage)
            }
        }

        // Small delay to ensure chart is rendered
        const timeoutId = setTimeout(() => {
            animationRef.current = requestAnimationFrame(animate)
        }, 100)

        return () => {
            clearTimeout(timeoutId)
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [isChartVisible, targetEndAngle, startAngle, data.percentage, animationDuration])

    // Create chart data with current animated values
    const chartData = [{
        ...data,
        percentage: currentPercentage
    }]

    // Dynamic sizing based on props
    const getNumberSizeClass = (size: string) => {
        const sizeMap = {
            'sm': 'text-2xl',
            'md': 'text-3xl',
            'lg': 'text-4xl',
            'xl': 'text-5xl'
        }
        return sizeMap[size as keyof typeof sizeMap] || sizeMap.lg
    }

    const getLabelSizeClass = (size: string) => {
        const sizeMap = {
            'xs': 'text-xs',
            'sm': 'text-sm',
            'md': 'text-base'
        }
        return sizeMap[size as keyof typeof sizeMap] || sizeMap.sm
    }

    // Calculate dynamic dimensions based on content and radius
    const calculateDimensions = () => {
        const maxDigits = data.percentage.toString().length + 1 // +1 for % symbol
        const baseWidth = Math.max(120, maxDigits * 20)
        const baseHeight = 80

        // Scale based on inner radius for better fit
        const scale = innerRadius / 80 // 80 is our base inner radius

        return {
            width: Math.round(baseWidth * scale),
            height: Math.round(baseHeight * scale)
        }
    }

    return (
        <Card ref={chartRef} className={`flex flex-col ${className}`}>
            <CardHeader className="items-center pb-0 text-center">
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>

            <CardContent className="flex-1">
                <div className="w-full h-full flex items-center justify-center">
                    <ChartContainer
                        config={chartConfig}
                        className="w-full fill-foreground"
                        style={{
                            width: `${outerRadius * 2 + 50}px`,
                            height: `${outerRadius * 2 + 50}px`
                        }}
                    >
                        <RadialBarChart
                            data={chartData}
                            startAngle={startAngle}
                            endAngle={currentEndAngle} // Use animated endAngle
                            innerRadius={innerRadius}
                            outerRadius={outerRadius}
                            width={outerRadius * 2 + 50}
                            height={outerRadius * 2 + 50}
                            cx="50%"
                            cy="50%"
                        >
                            <PolarGrid
                                gridType="circle"
                                radialLines={false}
                                stroke="none"
                                className="first:fill-muted last:fill-background"
                                polarRadius={[innerRadius + 6, innerRadius - 6]}
                            />

                            <RadialBar
                                dataKey="percentage"
                                cornerRadius={cornerRadius}
                                fill={data.fill}
                            />

                            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                                <Label
                                    content={({ viewBox }) => {
                                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                            const dimensions = calculateDimensions()
                                            const centerX = (viewBox.cx || 0) + (centerOffset.x || 0)
                                            const centerY = (viewBox.cy || 0) + (centerOffset.y || 0)

                                            return (
                                                <g>
                                                    <foreignObject
                                                        x={centerX - dimensions.width / 2}
                                                        y={centerY - dimensions.height / 2}
                                                        width={dimensions.width}
                                                        height={dimensions.height}
                                                    >
                                                        <div
                                                            className="flex flex-col items-center justify-center w-full h-full"
                                                            style={{
                                                                fontFamily: 'inherit'
                                                            }}
                                                        >
                                                            <div
                                                                className={`${getNumberSizeClass(numberSize)} font-bold text-foreground text-center leading-none mb-1`}
                                                                style={{
                                                                    letterSpacing: '-0.025em'
                                                                }}
                                                            >
                                                                {currentPercentage}%
                                                            </div>

                                                            <div
                                                                className={`${getLabelSizeClass(labelSize)} text-muted-foreground text-center leading-tight`}
                                                                style={{
                                                                    marginTop: numberSize === 'xl' ? '4px' : '2px'
                                                                }}
                                                            >
                                                                {centerLabel}
                                                            </div>
                                                        </div>
                                                    </foreignObject>
                                                </g>
                                            )
                                        }
                                    }}
                                />
                            </PolarRadiusAxis>
                        </RadialBarChart>
                    </ChartContainer>
                </div>
            </CardContent>

            {footerContent && (
                <CardFooter className="flex-col gap-2 text-sm text-center mt-auto">
                    <div className="flex items-center gap-2 leading-none font-medium">
                        <span className={footerContent.trendingColor || "text-green-600"}>
                            {footerContent.mainText}
                        </span>
                        {footerContent.showTrending && footerContent.trendingIcon && (
                            <span className={`h-4 w-4 ${footerContent.trendingColor || "text-green-600"}`}>
                                {footerContent.trendingIcon}
                            </span>
                        )}
                    </div>

                    <div className="text-muted-foreground leading-none">
                        {footerContent.subText}
                    </div>
                </CardFooter>
            )}
        </Card>
    )
}


// ========================================================================================
// Radial Chart Example
// ========================================================================================
export const RadialChartExample = () => {
    const data = {
        category: "re_engagement",
        value: 450,
        percentage: 67,
        fill: "var(--chart-3)",
        reEngagedUsers: 450,
        totalReEngagements: 673
    }

    const chartConfig = {
        re_engagement: {
            label: "Re-engagement Rate",
            color: "var(--chart-3)",
        },
    } satisfies ChartConfig

    return (
        <RadialChartShapeComponent
            title="Chat Re-engagement Rate"
            description="The proportion of users who engaged in a second conversation"
            data={data}
            chartConfig={chartConfig}
            centerLabel="Re-engagement"
            innerRadius={100}
            outerRadius={150}
            footerContent={{
                mainText: "+8.2% this month",
                subText: "Compared to previous period",
                showTrending: true,
                trendingColor: "text-emerald-600",
                trendingIcon: <TrendingUp size={16} />
            }}
        />
    )
}
