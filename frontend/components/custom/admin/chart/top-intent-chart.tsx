import { ChartConfig } from '@/components/ui/chart'
import { PieChartComponent } from '@/components/custom/chart/pie-chart'
import React from 'react'

const TopIntentChart = () => {
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

export default TopIntentChart
