export const dynamic = 'force-dynamic'
import { getCurrentUser } from "@/app/actions/user"
import { getAllPublicEventsAction } from "@/app/actions/athlete-interests"
import { getAthleteRegistrationsAction } from "@/app/actions/registrations"
import { redirect } from "next/navigation"
import { DashboardClient } from "./dashboard-client"

export default async function AthleteDashboardPage() {
    const user = await getCurrentUser()

    if (!user) redirect('/login')

    // Buscar todos os eventos públicos e inscrições do atleta
    const allEvents = await getAllPublicEventsAction()
    const registrations = await getAthleteRegistrationsAction()

    return (
        <DashboardClient
            allEvents={allEvents}
            registrations={registrations}
        />
    )
}
