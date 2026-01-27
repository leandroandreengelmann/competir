"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Users,
    CreditCard,
    Clock,
    Ban,
    TrendingUp,
    Calendar,
    Filter
} from "lucide-react"
import {
    getDashboardMetricsAction,
    getDashboardChartDataAction,
    DashboardMetrics,
    ChartDataPoint
} from "@/app/actions/dashboard"
import { toast } from "sonner"
import dynamic from "next/dynamic"

// Carregamento dinâmico do componente de gráficos (pesado) para reduzir bundle inicial
const DashboardCharts = dynamic(() => import("./dashboard-charts").then(mod => mod.DashboardCharts), {
    ssr: false,
    loading: () => <div className="h-[350px] w-full bg-muted/5 animate-pulse rounded-xl" />
})

interface Event {
    id: number
    name: string
}

interface DashboardClientProps {
    initialMetrics: DashboardMetrics
    initialChartData: ChartDataPoint[]
    events: Event[]
}

export function DashboardClient({
    initialMetrics,
    initialChartData,
    events
}: DashboardClientProps) {
    const [selectedEvent, setSelectedEvent] = React.useState<string>("all")
    const [selectedPeriod, setSelectedPeriod] = React.useState<'dia' | 'semana' | 'mes'>('dia')
    const [selectedMetric, setSelectedMetric] = React.useState<'inscricoes' | 'pagas' | 'pendentes'>('inscricoes')

    const [metrics, setMetrics] = React.useState<DashboardMetrics>(initialMetrics)
    const [chartData, setChartData] = React.useState<ChartDataPoint[]>(initialChartData)
    const [isLoading, setIsLoading] = React.useState(false)

    async function updateData() {
        setIsLoading(true)
        try {
            const [metricsRes, chartRes] = await Promise.all([
                getDashboardMetricsAction(selectedEvent),
                getDashboardChartDataAction({
                    eventId: selectedEvent,
                    period: selectedPeriod,
                    metric: selectedMetric
                })
            ])

            if (metricsRes.success) setMetrics(metricsRes.metrics)
            if (chartRes.success) setChartData(chartRes.data)
        } catch (error) {
            toast.error("Erro ao atualizar dados do dashboard")
        } finally {
            setIsLoading(false)
        }
    }

    React.useEffect(() => {
        // Evita a primeira chamada duplicada se já temos os iniciais
        if (selectedEvent === 'all' && selectedPeriod === 'dia' && selectedMetric === 'inscricoes') return
        updateData()
    }, [selectedEvent, selectedPeriod, selectedMetric])

    const formatCurrency = (cents: number) => {
        return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    }

    return (
        <div className="space-y-8">
            {/* Filtros Superiores */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface p-4 md:p-6 rounded-xl border border-border shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Filter className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">Filtros da Dashboard</h2>
                        <p className="text-xs text-muted-foreground italic">Analise o desempenho geral ou por evento</p>
                    </div>
                </div>

                <div className="w-full md:w-auto">
                    <Select
                        value={selectedEvent}
                        onValueChange={setSelectedEvent}
                        disabled={events.length <= 1 && events.length !== 0}
                    >
                        <SelectTrigger className="w-full md:w-[240px]">
                            <SelectValue placeholder="Selecionar Evento" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os eventos</SelectItem>
                            {events.map(event => (
                                <SelectItem key={event.id} value={event.id.toString()}>
                                    {event.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Cards de Métricas */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="overflow-hidden border-none shadow-sm bg-surface">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total de Inscrições</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.total}</div>
                        <p className="text-xs text-muted-foreground mt-1">Acumulado no período</p>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden border-none shadow-sm bg-surface">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-success">Inscrições Pagas</CardTitle>
                        <CreditCard className="h-4 w-4 text-success" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-success">{metrics.paid}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {metrics.total > 0 ? ((metrics.paid / metrics.total) * 100).toFixed(1) : 0}% de conversão
                        </p>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden border-none shadow-sm bg-surface">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-warning">Aguardando Pagto.</CardTitle>
                        <Clock className="h-4 w-4 text-warning" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-warning">{metrics.pending}</div>
                        <p className="text-xs text-muted-foreground mt-1">Pendentes de confirmação</p>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden border-none shadow-sm bg-surface">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Receita Confirmada</CardTitle>
                        <TrendingUp className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">{formatCurrency(metrics.totalCents)}</div>
                        <p className="text-xs text-muted-foreground mt-1">Líquido pendente de saque</p>
                    </CardContent>
                </Card>
            </div>

            {/* Seção do Gráfico */}
            <Card className="border-none shadow-sm bg-surface overflow-hidden">
                <CardHeader className="flex flex-col xl:flex-row xl:items-center justify-between space-y-4 xl:space-y-0 border-b pb-6 p-4 md:p-6">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Evolução das Inscrições
                        </CardTitle>
                        <CardDescription>Acompanhe o crescimento do seu evento ao longo do tempo</CardDescription>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <Tabs
                            value={selectedMetric}
                            onValueChange={(v) => setSelectedMetric(v as any)}
                            className="w-full sm:w-auto"
                        >
                            <TabsList className="bg-muted/50 border w-full sm:w-auto grid grid-cols-3 h-11">
                                <TabsTrigger value="inscricoes" className="text-xs">Todas</TabsTrigger>
                                <TabsTrigger value="pagas" className="text-xs">Pagas</TabsTrigger>
                                <TabsTrigger value="pendentes" className="text-xs">Pendentes</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <Tabs
                            value={selectedPeriod}
                            onValueChange={(v) => setSelectedPeriod(v as any)}
                            className="w-full sm:w-auto"
                        >
                            <TabsList className="bg-muted/50 border w-full sm:w-auto grid grid-cols-3 h-11">
                                <TabsTrigger value="dia" className="text-xs">Dia</TabsTrigger>
                                <TabsTrigger value="semana" className="text-xs">Semana</TabsTrigger>
                                <TabsTrigger value="mes" className="text-xs">Mês</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className={`transition-opacity duration-300 ${isLoading ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                        <DashboardCharts data={chartData} period={selectedPeriod} />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
