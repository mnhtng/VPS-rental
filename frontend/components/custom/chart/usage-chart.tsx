"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  { time: "00:00", cpu: 10, ram: 20 },
  { time: "04:00", cpu: 15, ram: 22 },
  { time: "08:00", cpu: 45, ram: 35 },
  { time: "12:00", cpu: 30, ram: 30 },
  { time: "16:00", cpu: 55, ram: 45 },
  { time: "20:00", cpu: 25, ram: 28 },
  { time: "23:59", cpu: 15, ram: 25 },
]

export function UsageChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <XAxis dataKey="time" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip
          contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
          itemStyle={{ color: "hsl(var(--foreground))" }}
        />
        <Line type="monotone" dataKey="cpu" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} name="CPU Usage" />
        <Line type="monotone" dataKey="ram" stroke="#82ca9d" strokeWidth={2} name="RAM Usage" />
      </LineChart>
    </ResponsiveContainer>
  )
}
