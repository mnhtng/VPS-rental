"use client"

import React, { useMemo } from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { Button } from "@/components/ui/button"

interface ToggleOption {
    value: string
    label: string
    icon?: React.ReactNode
}

interface LineChartComponentProps {
    title?: string
    description?: string
    data: Array<Record<string, string | number>>
    chartConfig: ChartConfig
    xAxisKey?: string
    yAxisConfig?: {
        domain?: [number, number] | "auto"
        padding?: number
        tickCount?: number
        formatType?: 'auto' | 'full' | 'compact' | 'currency' | 'percentage'
        customFormatter?: (value: number) => string
        tickFormatter?: (value: number) => string // Deprecated, use customFormatter instead
    }
    lines?: Array<{
        dataKey: string
        stroke?: string
        strokeWidth?: number
        type?: "monotone" | "linear" | "step" | "stepBefore" | "stepAfter"
        dot?: boolean
    }>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dot?: boolean | ((props: any) => React.ReactElement)
    margin?: {
        top?: number
        right?: number
        bottom?: number
        left?: number
    }
    footerContent?: {
        mainText?: string
        subText?: string
        showTrending?: boolean
        trendingIcon?: React.ReactNode
        trendingColor?: string
    }
    toggleOptions?: {
        options: ToggleOption[]
        currentValue: string
        onChange: (value: string) => void
        position?: "header-right" | "header-left"
    }
    className?: string
}

//todo: ==== Format the y-axis value based on the format type ====
const formatYAxisValue = (value: number, formatType = 'auto') => {
    switch (formatType) {
        case 'percentage':
            return `${value}%`

        case 'currency':
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
            }).format(value)

        case 'full':
            return value.toLocaleString()

        case 'compact':
        case 'auto':
        default:
            if (value >= 1000000000) {
                return `${(value / 1000000000).toFixed(value % 1000000000 === 0 ? 0 : 1)}B`
            }
            if (value >= 1000000) {
                return `${(value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1)}M`
            }
            if (value >= 1000) {
                return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`
            }
            return value.toString()
    }
}

//todo: ==== Divide y-axí ticks based-on nice step size ====
function getNiceStepSize(range: number, targetSteps: number): number {
    const rawStep = range / targetSteps
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
    const normalizedStep = rawStep / magnitude

    // Choose nice step sizes: 1, 2, 5, 10
    const niceStep = normalizedStep <= 1 ? 1
        : normalizedStep <= 2 ? 2
            : normalizedStep <= 5 ? 5
                : 10

    return niceStep * magnitude
}

const calculateYAxisTicks = (domain: [number, number], tickCount: number, dataMax: number) => {
    const [min, max] = domain

    if (tickCount <= 1) return [min]

    const step = getNiceStepSize(max - min, tickCount - 1)
    const niceMin = Math.floor(min / step) * step

    // Generate ticks
    const ticks: number[] = []
    let currentTick = niceMin

    while (currentTick <= max && ticks.length < tickCount * 2) {
        if (currentTick >= min) ticks.push(currentTick)
        currentTick += step
    }

    // Auto-add extra tick if data max is too close to last tick
    const lastTick = ticks[ticks.length - 1]
    if (dataMax - lastTick > 0 && dataMax - lastTick < step * 0.1) {
        ticks.push(lastTick + step)
    }

    return ticks
}

//todo: ==== Calculate the y-axis domain with padding ====
const calculateNiceYDomain = (data: Array<Record<string, string | number>>, dataKeys: string[], padding = 0.1) => {
    let min = Infinity, max = -Infinity

    data.forEach(item => {
        dataKeys.forEach(key => {
            const value = typeof item[key] === 'number' ? item[key] as number : 0
            min = Math.min(min, value)
            max = Math.max(max, value)
        })
    })

    if (min === Infinity || max === -Infinity) return [0, 100]

    const range = max - min
    const paddedMin = Math.max(0, min - (range * padding))
    const paddedMax = max + (range * padding)

    // Smart rounding based on magnitude
    const getRoundingFactor = (value: number) =>
        value <= 100 ? 10
            : value <= 1000 ? 100
                : value <= 10000 ? 500
                    : value <= 50000 ? 1000
                        : 5000

    const niceMin = Math.floor(paddedMin / getRoundingFactor(paddedMin)) * getRoundingFactor(paddedMin)
    const niceMax = Math.ceil(paddedMax / getRoundingFactor(paddedMax)) * getRoundingFactor(paddedMax)

    return [niceMin, niceMax]
}

export function LineChartComponent({
    title = "Line Chart - Multiple",
    description = "January - June 2024",
    data,
    chartConfig,
    xAxisKey = "month",
    yAxisConfig,
    lines,
    dot = false,
    margin = {
        left: 12,
        right: 12,
    },
    footerContent,
    toggleOptions,
    className
}: LineChartComponentProps) {
    // Auto-generate lines from chartConfig if not provided
    const chartLines = lines || Object.keys(chartConfig).map(key => ({
        dataKey: key,
        stroke: chartConfig[key].color,
        strokeWidth: 2,
        type: "monotone" as const,
        dot
    }))

    // Calculate Y-axis domain
    const yDomain = useMemo(() => {
        if (yAxisConfig?.domain && yAxisConfig.domain !== "auto") {
            return yAxisConfig.domain
        }

        // Auto-calculate domain with padding
        const dataKeys = chartLines.map(line => line.dataKey)
        const padding = yAxisConfig?.padding || 0.15
        return calculateNiceYDomain(data, dataKeys, padding)
    }, [data, chartLines, yAxisConfig])

    // Calculate Y-axis ticks for even spacing
    const yAxisTicks = useMemo(() => {
        const tickCount = yAxisConfig?.tickCount || 6
        const dataKeys = chartLines.map(line => line.dataKey)

        const dataMax = Math.max(...data.flatMap(item =>
            dataKeys.map(key => typeof item[key] === 'number' ? item[key] as number : 0)
        ))

        return calculateYAxisTicks(yDomain as [number, number], tickCount, dataMax)
    }, [yDomain, yAxisConfig, data, chartLines])

    // Create Y-axis tick formatter
    const yAxisTickFormatter = useMemo(() => {
        return yAxisConfig?.customFormatter
            || yAxisConfig?.tickFormatter
            || ((value: number) => formatYAxisValue(value, yAxisConfig?.formatType))
    }, [yAxisConfig])

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="space-y-1.5">
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>

                    {toggleOptions && (
                        <div className="flex space-x-2">
                            {toggleOptions.options.map((option) => (
                                <Button
                                    key={option.value}
                                    variant={toggleOptions.currentValue === option.value ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => toggleOptions.onChange(option.value)}
                                    className="flex items-center gap-2"
                                >
                                    {option.icon}
                                    {option.label}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent>
                <ChartContainer config={chartConfig}>
                    <LineChart
                        accessibilityLayer
                        data={data}
                        margin={margin}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey={xAxisKey}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <YAxis
                            domain={yDomain}
                            ticks={yAxisTicks}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={yAxisTickFormatter}
                        />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                        {chartLines.map((line) => (
                            <Line
                                key={line.dataKey}
                                dataKey={line.dataKey}
                                type={line.type || "monotone"}
                                stroke={line.stroke}
                                strokeWidth={line.strokeWidth || 2}
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                dot={dot !== undefined ? (dot as any) : (line.dot || false)}
                            />
                        ))}
                    </LineChart>
                </ChartContainer>
            </CardContent>

            {footerContent && (
                <CardFooter>
                    <div className="flex w-full items-start gap-2 text-sm">
                        <div className="grid gap-2">
                            <div className={`flex items-center gap-2 leading-none font-medium ${footerContent.trendingColor}`}>
                                {footerContent.mainText} {footerContent.showTrending && footerContent.trendingIcon}
                            </div>
                            <div className="text-muted-foreground flex items-center gap-2 leading-none">
                                {footerContent.subText}
                            </div>
                        </div>
                    </div>
                </CardFooter>
            )}
        </Card>
    )
}
