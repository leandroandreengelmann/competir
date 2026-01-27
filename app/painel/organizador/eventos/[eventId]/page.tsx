import { getCurrentUser } from "@/app/actions/user"
import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { EventPageClient } from "./event-page-client"

async function getEvent(id: string, userId: string) {
    const supabase = await createClient()

    const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .eq('organizer_id', userId)
        .single()

    if (error) {
        console.error('Erro ao buscar evento:', error)
        return null
    }

    return event
}

export default async function ManageEventPage({ params }: { params: Promise<{ eventId: string }> }) {
    const user = await getCurrentUser()
    const { eventId } = await params

    if (!user || user.role !== 'organizador') {
        redirect('/login')
    }

    const event = await getEvent(eventId, user.id)

    if (!event) {
        notFound()
    }

    return <EventPageClient event={event} />
}
