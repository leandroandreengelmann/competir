import { getCurrentUser } from "@/app/actions/user"
import { getSuperAdminMetricsAction } from "@/app/actions/super-admin-dashboard"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Building2, Calendar, CheckCircle, XCircle } from "lucide-react"

export default async function AdminDashboard() {
    const user = await getCurrentUser()

    if (!user) redirect('/login')

    const metricsData = await getSuperAdminMetricsAction()

    const metrics = [
        {
            title: "Total de Usuários",
            value: metricsData.totalUsers.toString(),
            icon: Users,
            description: "Todos os usuários cadastrados",
            color: "text-primary",
            bgColor: "bg-primary/10"
        },
        {
            title: "Total de Organizadores",
            value: metricsData.totalOrganizers.toString(),
            icon: Building2,
            description: "Organizadores de eventos",
            color: "text-blue-600",
            bgColor: "bg-blue-50"
        },
        {
            title: "Total de Eventos",
            value: metricsData.totalEvents.toString(),
            icon: Calendar,
            description: "Base total de competições",
            color: "text-amber-600",
            bgColor: "bg-amber-50"
        },
        {
            title: "Eventos Ativos",
            value: metricsData.activeEvents.toString(),
            icon: CheckCircle,
            description: "Eventos futuros ou em aberto",
            color: "text-emerald-600",
            bgColor: "bg-emerald-50"
        },
        {
            title: "Eventos Inativos",
            value: metricsData.inactiveEvents.toString(),
            icon: XCircle,
            description: "Eventos finalizados",
            color: "text-rose-600",
            bgColor: "bg-rose-50"
        }
    ]

    return (
        <div className="space-y-8 max-w-7xl mx-auto p-2">
            {/* Page Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Dashboard</h1>
                <p className="text-muted-foreground text-lg font-medium">
                    Gestão centralizada do ecossistema do Jiu-Jitsu
                </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {metrics.map((metric, index) => (
                    <Card key={index} className="border-border/50 hover:border-primary/20 transition-all duration-300">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                                {metric.title}
                            </CardTitle>
                            <div className={`p-2 rounded-lg ${metric.bgColor} ${metric.color}`}>
                                <metric.icon className="h-5 w-5" />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className={`text-4xl font-black ${metric.color}`}>
                                {metric.value}
                            </div>
                            <p className="text-sm font-medium text-muted-foreground mt-2">
                                {metric.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
