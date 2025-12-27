"use client"

import { useMemo } from "react"
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    LabelList,
    XAxis,
    YAxis,
    Rectangle,
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

export type BarChartVariant =
    | 'default'
    | 'horizontal'
    | 'multiple'
    | 'stacked'
    | 'stacked-legend'
    | 'label'
    | 'negative'
    | 'mixed'
    | 'interactive'

export interface BarConfig {
    dataKey: string
    fill?: string
    radius?: number | [number, number, number, number]
    stackId?: string
    name?: string
}

export interface BarChartComponentProps {
    title?: string
    description?: string
    data: Array<Record<string, string | number>>
    chartConfig: ChartConfig
    className?: string

    variant?: BarChartVariant

    bars?: BarConfig[]

    xAxisKey?: string
    xAxisFormatter?: (value: string) => string
    yAxisConfig?: {
        dataKey?: string // for horizontal layout
        domain?: [number, number] | 'auto'
        tickFormatter?: (value: number) => string
        hide?: boolean
    }

    // Features
    showGrid?: boolean
    showTooltip?: boolean
    showLegend?: boolean
    showLabels?: boolean
    labelPosition?: 'top' | 'center' | 'bottom' | 'inside' | 'insideTop' | 'insideBottom'
    labelFormatter?: (value: number) => string
    tooltipNameKey?: string  // Key to use for tooltip name lookup (for mixed variant)

    // Layout
    layout?: 'vertical' | 'horizontal'
    margin?: { top?: number; right?: number; bottom?: number; left?: number }
    barRadius?: number | [number, number, number, number]
    barGap?: number
    barCategoryGap?: string | number

    // Negative bar colors
    positiveColor?: string
    negativeColor?: string

    footerContent?: {
        mainText?: string
        subText?: string
        showTrending?: boolean
        trendingIcon?: React.ReactNode
        trendingColor?: string
    }
}

const getDefaultRadius = (variant: BarChartVariant): number | [number, number, number, number] => {
    switch (variant) {
        case 'stacked':
        case 'stacked-legend':
            return 0
        case 'horizontal':
            return [0, 4, 4, 0]
        default:
            return 8
    }
}

const getDefaultLayout = (variant: BarChartVariant): 'vertical' | 'horizontal' | undefined => {
    // In Recharts: 'vertical' layout = horizontal bars (bars grow to the right)
    // undefined/default = vertical bars (bars grow upward) 
    return variant === 'horizontal' ? 'vertical' : undefined
}

export const BarChartComponent = ({
    title,
    description,
    data,
    chartConfig,
    className = "",
    variant = 'default',
    bars,
    xAxisKey = "month",
    xAxisFormatter = (value) => typeof value === 'string' ? value.slice(0, 3) : String(value),
    yAxisConfig,
    showGrid = true,
    showTooltip = true,
    showLegend,
    showLabels,
    labelPosition = 'top',
    labelFormatter,
    tooltipNameKey,
    layout,
    margin = { left: 12, right: 12 },
    barRadius,
    barGap,
    barCategoryGap,
    positiveColor = "var(--chart-1)",
    negativeColor = "var(--chart-2)",
    footerContent,
}: BarChartComponentProps) => {

    // Determine layout based on variant
    // Note: In Recharts, layout="vertical" = horizontal bars (bars grow to the right)
    const isHorizontalBars = variant === 'horizontal' || layout === 'vertical'
    const chartLayout = layout ?? getDefaultLayout(variant)

    // Determine radius
    const defaultRadius = barRadius ?? getDefaultRadius(variant)

    // Auto determine showLegend based on variant
    const shouldShowLegend = showLegend ?? (variant === 'stacked-legend' || variant === 'multiple')

    // Auto determine showLabels based on variant
    const shouldShowLabels = showLabels ?? (variant === 'label')

    // Auto-generate bars from chartConfig if not provided
    const chartBars = useMemo(() => {
        if (bars) return bars

        return Object.keys(chartConfig).map((key, index) => ({
            dataKey: key,
            fill: chartConfig[key].color || `var(--chart-${index + 1})`,
            radius: defaultRadius,
            stackId: (variant === 'stacked' || variant === 'stacked-legend') ? 'stack' : undefined,
        }))
    }, [bars, chartConfig, variant, defaultRadius])

    // Render bars based on variant
    const renderBars = () => {
        switch (variant) {
            case 'mixed':
                // Mixed: Each bar has different color from data's fill property
                return (
                    <Bar
                        dataKey={chartBars[0]?.dataKey || 'value'}
                        radius={defaultRadius}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.fill as string || `var(--chart-${(index % 5) + 1})`}
                            />
                        ))}
                    </Bar>
                )

            case 'negative':
                // Negative: Different colors for positive/negative values
                return (
                    <Bar dataKey={chartBars[0]?.dataKey || 'value'} radius={defaultRadius}>
                        {data.map((entry, index) => {
                            const value = entry[chartBars[0]?.dataKey || 'value'] as number
                            return (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={value >= 0 ? positiveColor : negativeColor}
                                />
                            )
                        })}
                    </Bar>
                )

            case 'interactive':
                // Interactive: Active bar on hover
                return chartBars.map((bar) => (
                    <Bar
                        key={bar.dataKey}
                        dataKey={bar.dataKey}
                        fill={bar.fill || `var(--color-${bar.dataKey})`}
                        radius={bar.radius ?? defaultRadius}
                        stackId={bar.stackId}
                        activeBar={({ ...props }) => (
                            <Rectangle
                                {...props}
                                fillOpacity={0.8}
                                stroke={props.fill}
                                strokeDasharray={4}
                                strokeDashoffset={4}
                            />
                        )}
                    >
                        {shouldShowLabels && (
                            <LabelList
                                dataKey={bar.dataKey}
                                position={labelPosition}
                                offset={8}
                                className="fill-foreground"
                                fontSize={12}
                                formatter={labelFormatter}
                            />
                        )}
                    </Bar>
                ))

            case 'stacked':
            case 'stacked-legend':
            case 'multiple':
            default:
                // Default, Multiple, Stacked variants
                return chartBars.map((bar) => (
                    <Bar
                        key={bar.dataKey}
                        dataKey={bar.dataKey}
                        fill={bar.fill || `var(--color-${bar.dataKey})`}
                        radius={bar.radius ?? defaultRadius}
                        stackId={bar.stackId}
                    >
                        {shouldShowLabels && (
                            <LabelList
                                dataKey={bar.dataKey}
                                position={labelPosition}
                                offset={8}
                                className="fill-foreground"
                                fontSize={12}
                                formatter={labelFormatter}
                            />
                        )}
                    </Bar>
                ))
        }
    }

    // Render X Axis
    const renderXAxis = () => {
        if (isHorizontalBars) {
            return (
                <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    hide={yAxisConfig?.hide}
                    tickFormatter={yAxisConfig?.tickFormatter}
                />
            )
        }

        return (
            <XAxis
                dataKey={xAxisKey}
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={xAxisFormatter}
            />
        )
    }

    // Render Y Axis
    const renderYAxis = () => {
        if (isHorizontalBars) {
            return (
                <YAxis
                    dataKey={yAxisConfig?.dataKey || xAxisKey}
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={xAxisFormatter}
                />
            )
        }

        if (yAxisConfig?.hide !== true && (variant === 'negative' || yAxisConfig?.tickFormatter)) {
            return (
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={yAxisConfig?.tickFormatter}
                />
            )
        }

        return null
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
                        <BarChart
                            accessibilityLayer
                            data={data}
                            layout={chartLayout}
                            margin={margin}
                            barGap={barGap}
                            barCategoryGap={barCategoryGap}
                        >
                            {showGrid && <CartesianGrid vertical={!isHorizontalBars} horizontal={isHorizontalBars} />}

                            {renderXAxis()}
                            {renderYAxis()}

                            {showTooltip && (
                                <ChartTooltip
                                    cursor={false}
                                    content={
                                        <ChartTooltipContent
                                            hideLabel={variant === 'mixed' || chartBars.length === 1}
                                            indicator={variant === 'mixed' ? 'dot' : 'line'}
                                            nameKey={variant === 'mixed' ? tooltipNameKey : undefined}
                                        />
                                    }
                                />
                            )}

                            {shouldShowLegend && <ChartLegend content={<ChartLegendContent />} />}

                            {renderBars()}
                        </BarChart>
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
// Bar Chart Example
// ========================================================================================
export const BarChartExample = () => {
    const monthlyData = [
        { period: "Jan", newSubscriptions: 1245, revenue: 18500, churnedUsers: 32 },
        { period: "Feb", newSubscriptions: 1289, revenue: 21200, churnedUsers: 28 },
        { period: "Mar", newSubscriptions: 1312, revenue: 24800, churnedUsers: 35 },
        { period: "Apr", newSubscriptions: 1378, revenue: 29100, churnedUsers: 41 },
        { period: "May", newSubscriptions: 1425, revenue: 33600, churnedUsers: 38 },
        { period: "Jun", newSubscriptions: 1468, revenue: 37800, churnedUsers: 45 },
        { period: "Jul", newSubscriptions: 1512, revenue: 42300, churnedUsers: 49 },
        { period: "Aug", newSubscriptions: 1498, revenue: 41200, churnedUsers: 52 },
        { period: "Sep", newSubscriptions: 1542, revenue: 45900, churnedUsers: 47 },
        { period: "Oct", newSubscriptions: 1589, revenue: 49800, churnedUsers: 51 },
        { period: "Nov", newSubscriptions: 1634, revenue: 54200, churnedUsers: 48 },
        { period: "Dec", newSubscriptions: 1701, revenue: 61500, churnedUsers: 55 },
    ]

    const chartConfig = {
        newSubscriptions: {
            label: "New Subscriptions",
            color: "var(--chart-1)",
        },
        revenue: {
            label: "Revenue ($)",
            color: "var(--chart-2)",
        },
    } satisfies ChartConfig

    return (
        <BarChartComponent
            title="Monthly VPS Performance"
            description="New subscriptions and revenue breakdown by month"
            data={monthlyData}
            chartConfig={chartConfig}
            layout="horizontal"
            xAxisKey="period"
            variant="label"
            bars={[
                {
                    dataKey: "newSubscriptions",
                    fill: "var(--chart-1)",
                    radius: [4, 4, 0, 0],
                },
                {
                    dataKey: "revenue",
                    fill: "var(--chart-2)",
                    radius: [4, 4, 0, 0],
                },
            ]}
            showGrid={true}
            showTooltip={true}
            showLegend={true}
            yAxisConfig={{
                tickFormatter: (value) => {
                    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
                    return value.toString()
                }
            }}
            margin={{ top: 20, right: 30, bottom: 5, left: 20 }}
            footerContent={{
                mainText: "Trending up by 12.5% this period",
                subText: `Showing monthly performance metrics for 2024`,
                showTrending: true,
                trendingIcon: <TrendingUp className="h-4 w-4" />,
                trendingColor: "text-emerald-600"
            }}
        />
    )
}
