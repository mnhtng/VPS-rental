"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts"
import { useTranslations } from "next-intl"
import { VPSRRDDataPoint } from "@/types/types"
import { Loader } from "lucide-react"

interface UsageChartProps {
  data: VPSRRDDataPoint[];
  loading?: boolean;
}

export function UsageChart({ data, loading = false }: UsageChartProps) {
  const t = useTranslations("usage_chart")

  // Process RRD data to chart format
  const chartData = data.map((point: VPSRRDDataPoint) => {
    const date = new Date(point.time * 1000)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')

    return {
      time: `${hours}:${minutes}`,
      cpu: point.maxcpu > 0 ? ((point.cpu / point.maxcpu) * 100) : 0,
      memory: point.maxmem > 0 ? ((point.mem / point.maxmem) * 100) : 0,
      networkIn: (point.netin / 1024 / 1024).toFixed(2), // Convert to MB/s
      networkOut: (point.netout / 1024 / 1024).toFixed(2), // Convert to MB/s
      diskRead: (point.diskread / 1024 / 1024).toFixed(2), // Convert to MB/s
      diskWrite: (point.diskwrite / 1024 / 1024).toFixed(2), // Convert to MB/s
    }
  })

  if (loading) {
    return (
      <div className="relative w-full h-87.5 animate-in fade-in duration-300">
        {/* Loading Overlay */}
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/50 backdrop-blur-sm rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <Loader className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground font-medium">{t('loading')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-87.5 gap-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="rounded-full bg-muted p-4">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
            />
          </svg>
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-foreground">{t('no_data')}</p>
          <p className="text-xs text-muted-foreground">{t('no_data_desc')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-87.5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis
            dataKey="time"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            minTickGap={30}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              borderColor: "hsl(var(--border))",
              borderRadius: "8px"
            }}
            itemStyle={{ color: "hsl(var(--foreground))" }}
            formatter={(value: number) => `${(Number(value) || 0).toFixed(2)}%`}
          />
          <Legend
            wrapperStyle={{ paddingTop: "20px" }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="cpu"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            name={t('cpu_usage')}
          />
          <Line
            type="monotone"
            dataKey="memory"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            name={t('memory_usage')}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
