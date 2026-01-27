export const dynamic = 'force-dynamic'
import { getCurrentUser } from "@/app/actions/user"
import { redirect } from "next/navigation"
import {
    getDashboardMetricsAction,
    getDashboardChartDataAction,
    getOrganizerEventsAction
} from "@/app/actions/dashboard"
import { DashboardClient } from "./dashboard-client"

export default async function OrganizerDashboard() {
    const user = await getCurrentUser()

    if (!user || user.role !== 'organizador') {
        redirect('/login')
    }

    // Busca dados iniciais em paralelo para performance
    const [metricsRes, chartRes, eventsRes] = await Promise.all([
        getDashboardMetricsAction("all"),
        getDashboardChartDataAction({
            period: 'dia',
            metric: 'inscricoes',
            eventId: 'all'
        }),
        getOrganizerEventsAction()
    ])

    return (
        <div className="space-y-8 pb-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Bem-vindo, {user.name}
                </h1>
                <p className="text-muted-foreground text-sm">
                    Aqui está o resumo do desempenho dos seus eventos e inscrições.
                </p>
            </div>

            <DashboardClient
                initialMetrics={metricsRes.metrics}
                initialChartData={chartRes.data}
                events={eventsRes.events}
            />
        </div>
    )
}
