import { getCurrentUser } from "@/app/actions/user"
import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getEventInfoSummaryAction } from "@/app/actions/event-assistant"
import { InfoSummaryClient } from "./info-summary-client"

async function getEvent(id: string, userId: string) {
    const supabase = await createClient()

    const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .eq('organizer_id', userId)
        .single()

    if (error) return null
    return event
}

export default async function InfoSummaryPage({ params }: { params: Promise<{ eventId: string }> }) {
    const user = await getCurrentUser()
    const { eventId } = await params

    if (!user || user.role !== 'organizador') {
        redirect('/login')
    }

    const event = await getEvent(eventId, user.id)
    if (!event) notFound()

    const summary = await getEventInfoSummaryAction(eventId)

    if ('error' in summary) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <p className="text-destructive">{summary.error}</p>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <InfoSummaryClient
                eventId={eventId}
                event={summary.event}
                responses={summary.responses}
                customItems={summary.customItems}
            />
        </div>
    )
}
