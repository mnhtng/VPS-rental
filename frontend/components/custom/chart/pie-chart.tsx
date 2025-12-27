"use client"

import { Pie, PieChart, Sector, Label } from "recharts"

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
    ChartStyle,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { useMemo, useState } from "react"
import { motion } from "framer-motion"

export interface PieChartData {
    category: string
    value: number
    percentage: number
    fill?: string
    [key: string]: unknown
}

export interface PieChartProps {
    title?: string
    description?: string
    data: PieChartData[]
    chartConfig: ChartConfig
    className?: string
    dataKey?: string
    nameKey?: string
    legendKey?: string
    innerRadius?: number
    outerRadius?: number
    cornerRadius?: number
    paddingAngle?: number
    strokeWidth?: number
    stroke?: string
    animationDuration?: number
    enableAnimation?: boolean
    showLegend?: boolean
    showTooltip?: boolean
    showActiveSection?: boolean
    footerContent?: {
        mainText?: string
        subText?: string
        showTrending?: boolean
        trendingColor?: string
        trendingIcon?: React.ReactNode
    }
}

export const PieChartComponent = ({
    title,
    description,
    data,
    chartConfig,
    className = "",
    dataKey = "value",
    nameKey = "category",
    legendKey = "category",
    innerRadius = 0,
    outerRadius = 100,
    strokeWidth = 0,
    cornerRadius = 0,
    paddingAngle = 0,
    stroke = "var(--background)",
    showLegend = true,
    showTooltip = true,
    showActiveSection = false,
    footerContent
}: PieChartProps) => {
    const [hoverIndex, setHoverIndex] = useState<number | null>(null)

    const activeIndex = useMemo(() => {
        return showActiveSection ? hoverIndex : null
    }, [hoverIndex, showActiveSection])

    const handleActiveSection = (_: unknown, index: number) => {
        if (showActiveSection) {
            setHoverIndex(index)
        }
    }

    const handleUnActiveSection = () => {
        if (showActiveSection) {
            setHoverIndex(null)
        }
    }

    const renderLegend = () => {
        if (!showLegend) return null;

        return (
            <div className="flex flex-wrap justify-center gap-3 px-4">
                {data.map((item, index) => {
                    const legendValue = String(item[legendKey] || "")
                    const color = item.fill || chartConfig[legendValue as keyof typeof chartConfig]?.color || `var(--chart-${index + 1})`

                    return (
                        <div key={legendValue} className="flex items-center gap-2 text-sm">
                            <span
                                className="flex h-3 w-3 shrink-0 rounded-sm"
                                style={{ backgroundColor: color }}
                            />
                            <span className="text-muted-foreground">
                                {chartConfig[legendValue as keyof typeof chartConfig]?.label || legendValue}
                            </span>
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <Card className={`flex flex-col h-full ${className}`}>
            <ChartStyle id={`pie-chart-${title}`} config={chartConfig} />

            <CardHeader className="items-center pb-4 text-center">
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>

            <CardContent className="flex flex-col flex-1 justify-between gap-6">
                <div className="flex justify-center items-center flex-1">
                    <ChartContainer
                        config={chartConfig}
                        className="flex justify-center items-center"
                        style={{
                            width: `${(outerRadius + strokeWidth) * 2 + 100}px`,
                            height: `${(outerRadius + strokeWidth) * 2 + 100}px`
                        }}
                    >
                        <PieChart
                            width={(outerRadius + strokeWidth) * 2 + 100}
                            height={(outerRadius + strokeWidth) * 2 + 100}
                        >
                            {showTooltip && (
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                            )}

                            <Pie
                                data={data}
                                dataKey={dataKey}
                                nameKey={nameKey}
                                innerRadius={innerRadius}
                                outerRadius={outerRadius}
                                cornerRadius={cornerRadius}
                                paddingAngle={paddingAngle}
                                strokeWidth={strokeWidth}
                                stroke={stroke}
                                cx="50%"
                                cy="50%"
                                activeIndex={showActiveSection ? (activeIndex ?? undefined) : undefined}
                                onMouseEnter={showActiveSection ? handleActiveSection : undefined}
                                onMouseLeave={showActiveSection ? handleUnActiveSection : undefined}
                                activeShape={showActiveSection ? (props: unknown) => {
                                    const typedProps = props as { outerRadius?: number;[key: string]: unknown }
                                    const { outerRadius = 100, ...otherProps } = typedProps
                                    return (
                                        <motion.g
                                            initial={{ scale: 1 }}
                                            animate={activeIndex !== null ? { scale: 1.1 } : { scale: 1 }}
                                            transition={{
                                                type: "spring",
                                                stiffness: 300,
                                                damping: 10,
                                                mass: 0.8,
                                                bounce: 0.4,
                                                duration: 0.3
                                            }}
                                        >
                                            <Sector {...otherProps} outerRadius={outerRadius + 1} />
                                            <Sector
                                                {...otherProps}
                                                outerRadius={outerRadius + 15}
                                                innerRadius={outerRadius + 5}
                                            />
                                        </motion.g>
                                    )
                                } : undefined}
                            >
                                {showActiveSection && innerRadius > 0 && activeIndex !== null && (
                                    <Label
                                        content={({ viewBox }) => {
                                            if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                const activeData = data[activeIndex]
                                                if (!activeData) return null

                                                return (
                                                    <text
                                                        x={viewBox.cx}
                                                        y={viewBox.cy}
                                                        textAnchor="middle"
                                                        dominantBaseline="middle"
                                                    >
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={viewBox.cy}
                                                            className="fill-foreground text-2xl font-bold"
                                                        >
                                                            {String(activeData[dataKey] || '').toLocaleString()}
                                                        </tspan>
                                                        <tspan
                                                            x={viewBox.cx}
                                                            y={(viewBox.cy || 0) + 20}
                                                            className="fill-muted-foreground text-sm"
                                                        >
                                                            {String(
                                                                chartConfig[activeData[nameKey] as keyof typeof chartConfig]?.label
                                                                ?? activeData[nameKey]
                                                                ?? ''
                                                            )}
                                                        </tspan>
                                                    </text>
                                                )
                                            }
                                        }}
                                    />
                                )}
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                </div>

                {renderLegend()}
            </CardContent>

            {footerContent && (
                <CardFooter className="flex-col gap-2 text-sm text-center pt-4">
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
// Pie Chart Example
// ========================================================================================
export const PieChartExample = () => {
    const rawData = [
        { intent: "product_inquiry", interactions: 1250, fill: "var(--chart-1)" },
        { intent: "technical_support", interactions: 892, fill: "var(--chart-2)" },
        { intent: "pricing_question", interactions: 654, fill: "var(--chart-3)" },
        { intent: "booking_service", interactions: 487, fill: "var(--chart-4)" },
        { intent: "general_greeting", interactions: 398, fill: "var(--chart-5)" },
        { intent: "complaint_feedback", interactions: 234, fill: "var(--chart-6)" },
    ]
    const total = rawData.reduce((sum, d) => sum + d.interactions, 0)
    const data = rawData.map(d => ({
        category: d.intent,
        value: d.interactions,
        percentage: Math.round((d.interactions / total) * 1000) / 10, // 1 chữ số thập phân
        fill: d.fill
    }))

    const chartConfig = {
        interactions: {
            label: "Interactions",
        },
        product_inquiry: {
            label: "Product",
            color: "var(--chart-1)",
        },
        technical_support: {
            label: "Technical Support",
            color: "var(--chart-2)",
        },
        pricing_question: {
            label: "Pricing Questions",
            color: "var(--chart-3)",
        },
        booking_service: {
            label: "Booking Service",
            color: "var(--chart-4)",
        },
        general_greeting: {
            label: "General Greeting",
            color: "var(--chart-5)",
        },
        complaint_feedback: {
            label: "Complaints & Feedback",
            color: "var(--chart-6)",
        },
    } satisfies ChartConfig

    return (
        <PieChartComponent
            title="Top Popular Intent"
            description="Most frequently detected intents from recent user interactions"
            data={data}
            chartConfig={chartConfig}
            innerRadius={80}
            outerRadius={120}
            paddingAngle={2}
            cornerRadius={3}
            showLegend={true}
            showTooltip={false}
            showActiveSection={true}
        />
    )
}