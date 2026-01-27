import { getCurrentUser } from "@/app/actions/user"
import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { EventRegistrationsClient } from "./page-client"

export default async function EventRegistrationsPage({
    params
}: {
    params: Promise<{ eventId: string }>
}) {
    const user = await getCurrentUser()

    if (!user) redirect('/login')

    if (user.role !== 'organizador') {
        redirect('/painel')
    }

    const { eventId } = await params

    const supabase = await createClient()

    // Validar ownership do evento
    const { data: event, error } = await supabase
        .from('events')
        .select('id, name, date, address, description')
        .eq('id', eventId)
        .eq('organizer_id', user.id)
        .single()

    if (error || !event) {
        notFound()
    }

    return <EventRegistrationsClient event={event} />
}
