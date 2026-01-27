"use client"

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Cell } from "recharts"
import { ChartDataPoint } from "@/app/actions/dashboard"
import { BarChart3 } from "lucide-react"

interface DashboardChartsProps {
    data: ChartDataPoint[]
    period: 'dia' | 'semana' | 'mes'
}

export function DashboardCharts({ data, period }: DashboardChartsProps) {
    // Verificar se há dados significativos (pelo menos um valor maior que zero)
    const hasData = data && data.length > 0 && data.some(item => item.value > 0)

    if (!hasData) {
        return (
            <div className="h-[350px] w-full flex flex-col items-center justify-center border border-dashed rounded-xl bg-muted/5 space-y-3">
                <div className="h-12 w-12 rounded-full bg-muted/10 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-muted-foreground/40" />
                </div>
                <div className="text-center">
                    <p className="text-foreground font-medium">Sem dados suficientes</p>
                    <p className="text-muted-foreground text-xs px-8">
                        Assim que houver inscrições no período selecionado, a evolução aparecerá aqui.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-[350px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="hsl(var(--border))"
                        opacity={0.5}
                    />
                    <XAxis
                        dataKey="label"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                        interval={period === 'mes' ? 2 : 0} // Espaçamento maior para o mês
                    />
                    <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                        allowDecimals={false}
                    />
                    <Tooltip
                        cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                        content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="bg-surface border border-border rounded-lg shadow-lg p-3 min-w-[120px]">
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                                            {label}
                                        </p>
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="text-xs text-foreground">Inscrições:</span>
                                            <span className="text-sm font-bold text-primary">
                                                {payload[0].value}
                                            </span>
                                        </div>
                                    </div>
                                )
                            }
                            return null
                        }}
                    />
                    <Bar
                        dataKey="value"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                        barSize={period === 'dia' ? 12 : period === 'semana' ? 40 : 16}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                className="hover:opacity-80 transition-opacity cursor-pointer"
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
