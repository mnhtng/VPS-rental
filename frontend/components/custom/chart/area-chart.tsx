"use client"

import { useMemo } from "react"
import {
    Area,
    AreaChart,
    CartesianGrid,
    XAxis,
    YAxis,
} from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"
import { TrendingUp } from "lucide-react"

export type AreaChartVariant =
    | 'default'
    | 'linear'
    | 'step'
    | 'stacked'
    | 'stacked-expanded'
    | 'gradient'
    | 'legend'
    | 'interactive'

export type AreaCurveType = 'monotone' | 'linear' | 'step' | 'stepBefore' | 'stepAfter' | 'natural' | 'basis'

export interface AreaConfig {
    dataKey: string
    fill?: string
    stroke?: string
    stackId?: string
    type?: AreaCurveType
    fillOpacity?: number
}

export interface AreaChartComponentProps {
    title?: string
    description?: string
    data: Array<Record<string, string | number>>
    chartConfig: ChartConfig
    className?: string

    variant?: AreaChartVariant

    areas?: AreaConfig[]

    xAxisKey?: string
    xAxisFormatter?: (value: string) => string
    yAxisConfig?: {
        domain?: [number, number] | 'auto'
        tickFormatter?: (value: number) => string
        hide?: boolean
    }

    showGrid?: boolean
    showTooltip?: boolean
    showLegend?: boolean
    showDots?: boolean
    showActiveDot?: boolean

    useGradient?: boolean
    gradientOpacity?: { start: number; end: number }

    margin?: { top?: number; right?: number; bottom?: number; left?: number }

    footerContent?: {
        mainText?: string
        subText?: string
        showTrending?: boolean
        trendingIcon?: React.ReactNode
        trendingColor?: string
    }
}

const getCurveType = (variant: AreaChartVariant): AreaCurveType => {
    switch (variant) {
        case 'linear':
            return 'linear'
        case 'step':
            return 'step'
        default:
            return 'monotone'
    }
}

const isStackedVariant = (variant: AreaChartVariant): boolean => {
    return variant === 'stacked' || variant === 'stacked-expanded'
}

export const AreaChartComponent = ({
    title,
    description,
    data,
    chartConfig,
    className = "",
    variant = 'default',
    areas,
    xAxisKey = "month",
    xAxisFormatter = (value) => typeof value === 'string' ? value.slice(0, 3) : String(value),
    yAxisConfig,
    showGrid = true,
    showTooltip = true,
    showLegend,
    showDots,
    showActiveDot = true,
    useGradient,
    gradientOpacity = { start: 0.8, end: 0.1 },
    margin = { left: 12, right: 12 },
    footerContent,
}: AreaChartComponentProps) => {
    // Determine curve type based on variant
    const curveType = getCurveType(variant)

    // Determine if stacked
    const isStacked = isStackedVariant(variant)

    // Auto determine showLegend based on variant
    const shouldShowLegend = showLegend ?? (variant === 'legend' || variant === 'stacked' || variant === 'stacked-expanded')

    // Auto determine showDots based on variant
    const shouldShowDots = showDots ?? (variant === 'interactive')

    // Auto determine showActiveDot (dot only on hover)
    const shouldShowActiveDot = showActiveDot ?? true  // Default true: show dot on hover

    // Auto determine gradient based on variant
    const shouldUseGradient = useGradient ?? (variant === 'gradient')

    // Auto-generate areas from chartConfig if not provided
    const chartAreas = useMemo(() => {
        if (areas) return areas

        return Object.keys(chartConfig).map((key, index) => ({
            dataKey: key,
            fill: shouldUseGradient ? `url(#fill${key})` : chartConfig[key].color || `var(--chart-${index + 1})`,
            stroke: chartConfig[key].color || `var(--chart-${index + 1})`,
            stackId: isStacked ? 'stack' : undefined,
            type: curveType,
            fillOpacity: shouldUseGradient ? 1 : 0.4,
        }))
    }, [areas, chartConfig, isStacked, curveType, shouldUseGradient])

    // Prepare data for stacked-expanded (normalize to 100%)
    const normalizedData = useMemo(() => {
        if (variant !== 'stacked-expanded') return data

        return data.map(item => {
            const newItem = { ...item }
            const dataKeys = chartAreas.map(a => a.dataKey)
            const total = dataKeys.reduce((sum, key) => sum + (Number(item[key]) || 0), 0)

            if (total > 0) {
                dataKeys.forEach(key => {
                    newItem[key] = ((Number(item[key]) || 0) / total) * 100
                })
            }
            return newItem
        })
    }, [data, variant, chartAreas])

    // Render gradients if needed
    const renderGradients = () => {
        if (!shouldUseGradient) return null

        return (
            <defs>
                {chartAreas.map((area) => (
                    <linearGradient key={area.dataKey} id={`fill${area.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                        <stop
                            offset="5%"
                            stopColor={chartConfig[area.dataKey]?.color || `var(--chart-1)`}
                            stopOpacity={gradientOpacity.start}
                        />
                        <stop
                            offset="95%"
                            stopColor={chartConfig[area.dataKey]?.color || `var(--chart-1)`}
                            stopOpacity={gradientOpacity.end}
                        />
                    </linearGradient>
                ))}
            </defs>
        )
    }

    // Render Y Axis
    const renderYAxis = () => {
        if (yAxisConfig?.hide) return null

        const tickFormatter = variant === 'stacked-expanded'
            ? (value: number) => `${value}%`
            : yAxisConfig?.tickFormatter

        if (!tickFormatter && variant !== 'stacked-expanded') return null

        return (
            <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={tickFormatter}
            />
        )
    }

    return (
        <Card className={`flex flex-col h-full ${className}`}>
            {(title || description) && (
                <CardHeader>
                    {title && <CardTitle>{title}</CardTitle>}
                    {description && <CardDescription>{description}</CardDescription>}
                </CardHeader>
            )}

            <CardContent className="flex-1">
                <div className="w-full h-full flex items-center justify-center">
                    <ChartContainer config={chartConfig} className="w-full">
                        <AreaChart
                            accessibilityLayer
                            data={normalizedData}
                            margin={margin}
                        >
                            {renderGradients()}

                            {showGrid && <CartesianGrid vertical={false} />}

                            <XAxis
                                dataKey={xAxisKey}
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tickFormatter={xAxisFormatter}
                            />

                            {renderYAxis()}

                            {showTooltip && (
                                <ChartTooltip
                                    cursor={false}
                                    content={
                                        <ChartTooltipContent
                                            indicator={isStacked ? "dot" : "line"}
                                        />
                                    }
                                />
                            )}

                            {shouldShowLegend && <ChartLegend content={<ChartLegendContent />} />}

                            {chartAreas.map((area) => (
                                <Area
                                    key={area.dataKey}
                                    dataKey={area.dataKey}
                                    type={area.type || curveType}
                                    fill={area.fill || `var(--color-${area.dataKey})`}
                                    stroke={area.stroke || `var(--color-${area.dataKey})`}
                                    fillOpacity={area.fillOpacity ?? 0.4}
                                    stackId={area.stackId}
                                    dot={shouldShowDots ? {
                                        fill: area.stroke || `var(--color-${area.dataKey})`,
                                        r: 4,
                                    } : false}
                                    activeDot={(shouldShowDots || shouldShowActiveDot) ? {
                                        r: 6,
                                        fill: area.stroke || `var(--color-${area.dataKey})`,
                                    } : false}
                                />
                            ))}
                        </AreaChart>
                    </ChartContainer>
                </div>
            </CardContent>

            {footerContent && (
                <CardFooter className="flex-col items-start gap-2 text-sm">
                    <div className={`flex gap-2 leading-none font-medium ${footerContent.trendingColor || ''}`}>
                        {footerContent.mainText}
                        {footerContent.showTrending && footerContent.trendingIcon}
                    </div>
                    {footerContent.subText && (
                        <div className="text-muted-foreground leading-none">
                            {footerContent.subText}
                        </div>
                    )}
                </CardFooter>
            )}
        </Card>
    )
}

// ========================================================================================
// Area Chart Example
// ========================================================================================
export const AreaChartExample = () => {
    const chartData = [
        { month: "January", desktop: 186, mobile: 80 },
        { month: "February", desktop: 305, mobile: 200 },
        { month: "March", desktop: 237, mobile: 120 },
        { month: "April", desktop: 73, mobile: 190 },
        { month: "May", desktop: 209, mobile: 130 },
        { month: "June", desktop: 214, mobile: 140 },
    ]

    const chartConfig = {
        desktop: {
            label: "Desktop",
            color: "var(--chart-1)",
        },
        mobile: {
            label: "Mobile",
            color: "var(--chart-2)",
        },
    } satisfies ChartConfig

    return (
        <AreaChartComponent
            title="Area Chart - Stacked with Gradient"
            description="Showing total visitors for the last 6 months"
            data={chartData}
            chartConfig={chartConfig}
            xAxisKey="month"
            variant="gradient"
            useGradient={true}
            showLegend={true}
            showDots={true}
            showGrid={true}
            showTooltip={true}
            xAxisFormatter={(value) => typeof value === 'string' ? value.slice(0, 3) : String(value)}
            yAxisConfig={{
                domain: [0, 400],
                tickFormatter: (value) => String(value),
            }}
            footerContent={{
                mainText: "Trending up by 5.2% this month",
                subText: "January - June 2024",
                showTrending: true,
                trendingIcon: <TrendingUp className="h-4 w-4" />,
                trendingColor: "text-emerald-600"
            }}
        />
    )
}
