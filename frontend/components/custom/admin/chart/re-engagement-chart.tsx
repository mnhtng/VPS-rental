"use client"

import { ChartConfig } from '@/components/ui/chart'
import { RadialChartShapeComponent } from '@/components/custom/chart/chart-radial-shape'
import { TrendingUp } from 'lucide-react'
import React from 'react'

const ReEngagementChart = () => {
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

export default ReEngagementChart
