"use client"

import React, { useMemo, useState } from "react"
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
import { Calendar, CalendarDays, GitCommitVertical } from "lucide-react"

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

            <CardContent className="flex-1">
                <div className="w-full h-full flex items-center justify-center">
                    <ChartContainer config={chartConfig} className="w-full">
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
                </div>
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


// ========================================================================================
// Line Chart Example
// ========================================================================================
interface UserActivityChartProps {
    className?: string
}

type TimePeriod = "week" | "month"

export const LineChartExample = ({ className }: UserActivityChartProps) => {
    const [timePeriod, setTimePeriod] = useState<TimePeriod>("week")

    const weeklyData = [
        { period: "Mon", activeUsers: 1200, totalPrompts: 2400 },
        { period: "Tue", activeUsers: 1350, totalPrompts: 2650 },
        { period: "Wed", activeUsers: 1450, totalPrompts: 2800 },
        { period: "Thu", activeUsers: 1600, totalPrompts: 3100 },
        { period: "Fri", activeUsers: 1800, totalPrompts: 3400 },
        { period: "Sat", activeUsers: 1650, totalPrompts: 3200 },
        { period: "Sun", activeUsers: 1400, totalPrompts: 2900 },
    ]

    const monthlyData = [
        { period: "Jan", activeUsers: 8500, totalPrompts: 18200 },
        { period: "Feb", activeUsers: 9200, totalPrompts: 19800 },
        { period: "Mar", activeUsers: 10100, totalPrompts: 21500 },
        { period: "Apr", activeUsers: 11300, totalPrompts: 23800 },
        { period: "May", activeUsers: 12800, totalPrompts: 26400 },
        { period: "Jun", activeUsers: 14200, totalPrompts: 29100 },
        { period: "Jul", activeUsers: 15600, totalPrompts: 31800 },
        { period: "Aug", activeUsers: 16800, totalPrompts: 34200 },
        { period: "Sep", activeUsers: 17900, totalPrompts: 36500 },
        { period: "Oct", activeUsers: 19200, totalPrompts: 38900 },
        { period: "Nov", activeUsers: 20500, totalPrompts: 41200 },
        { period: "Dec", activeUsers: 21800, totalPrompts: 43600 },
    ]

    const getCurrentData = () => {
        return timePeriod === "week" ? weeklyData : monthlyData
    }

    const getTitle = () => {
        return timePeriod === "week"
            ? "Weekly Engagement Growth"
            : "Monthly Engagement Growth"
    }

    const getDescription = () => {
        return timePeriod === "week"
            ? "Tracks daily active users and prompts throughout the week"
            : "Tracks monthly active users and prompts throughout the year"
    }

    const chartConfig = {
        activeUsers: {
            label: "Active Users",
            color: "var(--chart-1)",
        },
        totalPrompts: {
            label: "Total Prompts",
            color: "var(--chart-2)",
        },
    } satisfies ChartConfig

    return (
        <LineChartComponent
            title={getTitle()}
            description={getDescription()}
            data={getCurrentData()}
            chartConfig={chartConfig}
            xAxisKey="period"
            yAxisConfig={{
                domain: "auto",
                padding: 0.2,
                tickCount: 5,
                formatType: "compact"
            }}
            dot={({ cx, cy, payload }) => {
                const r = 24
                return (
                    <GitCommitVertical
                        key={payload.period}
                        x={cx - r / 2}
                        y={cy - r / 2}
                        width={r}
                        height={r}
                        fill="var(--background)"
                        stroke="var(--foreground)"
                    />
                )
            }}
            toggleOptions={{
                options: [
                    {
                        value: "week",
                        label: "Week",
                        icon: <CalendarDays className="h-4 w-4" />
                    },
                    {
                        value: "month",
                        label: "Month",
                        icon: <Calendar className="h-4 w-4" />
                    }
                ],
                currentValue: timePeriod,
                onChange: (value) => setTimePeriod(value as TimePeriod),
                position: "header-right"
            }}
            className={className}
        />
    )
}
