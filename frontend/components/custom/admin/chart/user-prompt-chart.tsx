"use client"

import { useState } from "react"
import { ChartConfig } from "@/components/ui/chart"
import { LineChartComponent } from "@/components/custom/chart/line-chart"
import { Calendar, CalendarDays, GitCommitVertical } from "lucide-react"

interface UserActivityChartProps {
    className?: string
}

type TimePeriod = "week" | "month"

const UserPromptChart = ({ className }: UserActivityChartProps) => {
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

export default UserPromptChart;