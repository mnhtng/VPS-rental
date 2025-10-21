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

export function PieChartComponent({
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
}: PieChartProps) {
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
                            width: `${(outerRadius + strokeWidth) * 2 + 50}px`,
                            height: `${(outerRadius + strokeWidth) * 2 + 50}px`
                        }}
                    >
                        <PieChart
                            width={(outerRadius + strokeWidth) * 2 + 50}
                            height={(outerRadius + strokeWidth) * 2 + 50}
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


// const desktopData = [
//     { month: "january", desktop: 186, fill: "var(--color-january)" },
//     { month: "february", desktop: 305, fill: "var(--color-february)" },
//     { month: "march", desktop: 237, fill: "var(--color-march)" },
//     { month: "april", desktop: 173, fill: "var(--color-april)" },
//     { month: "may", desktop: 209, fill: "var(--color-may)" },
// ]
// const chartConfig = {
//     visitors: {
//         label: "Visitors",
//     },
//     desktop: {
//         label: "Desktop",
//     },
//     mobile: {
//         label: "Mobile",
//     },
//     january: {
//         label: "January",
//         color: "var(--chart-1)",
//     },
//     february: {
//         label: "February",
//         color: "var(--chart-2)",
//     },
//     march: {
//         label: "March",
//         color: "var(--chart-3)",
//     },
//     april: {
//         label: "April",
//         color: "var(--chart-4)",
//     },
//     may: {
//         label: "May",
//         color: "var(--chart-5)",
//     },
// } satisfies ChartConfig
// export function ChartPieInteractive() {
//     const id = "pie-interactive"
//     const [activeMonth, setActiveMonth] = React.useState(desktopData[0].month)
//     const activeIndex = React.useMemo(
//         () => desktopData.findIndex((item) => item.month === activeMonth),
//         [activeMonth]
//     )
//     const months = React.useMemo(() => desktopData.map((item) => item.month), [])
//
//     return (
//         <Card data-chart={id} className="flex flex-col">
//             <ChartStyle id={id} config={chartConfig} />
//
//             <CardHeader className="flex-row items-start space-y-0 pb-0">
//                 <div className="grid gap-1">
//                     <CardTitle>Pie Chart - Interactive</CardTitle>
//                     <CardDescription>January - June 2024</CardDescription>
//                 </div>
//
//                 <Select value={activeMonth} onValueChange={setActiveMonth}>
//                     <SelectTrigger
//                         className="ml-auto h-7 w-[130px] rounded-lg pl-2.5"
//                         aria-label="Select a value"
//                     >
//                         <SelectValue placeholder="Select month" />
//                     </SelectTrigger>
//                     <SelectContent align="end" className="rounded-xl">
//                         {months.map((key) => {
//                             const config = chartConfig[key as keyof typeof chartConfig]
//                             if (!config) {
//                                 return null
//                             }
//                             return (
//                                 <SelectItem
//                                     key={key}
//                                     value={key}
//                                     className="rounded-lg [&_span]:flex"
//                                 >
//                                     <div className="flex items-center gap-2 text-xs">
//                                         <span
//                                             className="flex h-3 w-3 shrink-0 rounded-xs"
//                                             style={{
//                                                 backgroundColor: `var(--color-${key})`,
//                                             }}
//                                         />
//                                         {config?.label}
//                                     </div>
//                                 </SelectItem>
//                             )
//                         })}
//                     </SelectContent>
//                 </Select>
//             </CardHeader>
//
//             <CardContent className="flex flex-1 justify-center pb-0">
//                 <ChartContainer
//                     id={id}
//                     config={chartConfig}
//                     className="mx-auto aspect-square w-full max-w-[300px]"
//                 >
//                     <PieChart>
//                         <ChartTooltip
//                             cursor={false}
//                             content={<ChartTooltipContent hideLabel />}
//                         />
//                         <Pie
//                             data={desktopData}
//                             dataKey="desktop"
//                             nameKey="month"
//                             innerRadius={60}
//                             strokeWidth={5}
//                             activeIndex={activeIndex}
//                             activeShape={({
//                                 outerRadius = 0,
//                                 ...props
//                             }: PieSectorDataItem) => (
//                                 <g>
//                                     <Sector {...props} outerRadius={outerRadius + 10} />
//                                     <Sector
//                                         {...props}
//                                         outerRadius={outerRadius + 25}
//                                         innerRadius={outerRadius + 12}
//                                     />
//                                 </g>
//                             )}
//                         >
//                             <Label
//                                 content={({ viewBox }) => {
//                                     if (viewBox && "cx" in viewBox && "cy" in viewBox) {
//                                         return (
//                                             <text
//                                                 x={viewBox.cx}
//                                                 y={viewBox.cy}
//                                                 textAnchor="middle"
//                                                 dominantBaseline="middle"
//                                             >
//                                                 <tspan
//                                                     x={viewBox.cx}
//                                                     y={viewBox.cy}
//                                                     className="fill-foreground text-3xl font-bold"
//                                                 >
//                                                     {desktopData[activeIndex].desktop.toLocaleString()}
//                                                 </tspan>
//                                                 <tspan
//                                                     x={viewBox.cx}
//                                                     y={(viewBox.cy || 0) + 24}
//                                                     className="fill-muted-foreground"
//                                                 >
//                                                     Visitors
//                                                 </tspan>
//                                             </text>
//                                         )
//                                     }
//                                 }}
//                             />
//                         </Pie>
//                     </PieChart>
//                 </ChartContainer>
//             </CardContent>
//         </Card>
//     )
// }
