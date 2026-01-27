import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/app/actions/user'
import { getCategoryAthletesAction } from '@/app/actions/event-categories-view'
import { AtletasClient } from './atletas-client'

interface PageProps {
    params: Promise<{ eventId: string, categoryId: string }>
}

export default async function AtletasPage({ params }: PageProps) {
    const resolvedParams = await params
    const eventId = resolvedParams.eventId
    const categoryId = resolvedParams.categoryId

    // Validar sessão
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') {
        redirect('/login')
    }

    const supabase = await createClient()

    // Buscar dados do evento
    const { data: event } = await supabase
        .from('events')
        .select('id, name, date')
        .eq('id', eventId)
        .eq('organizer_id', user.id)
        .single()

    if (!event) {
        redirect('/painel/organizador/eventos')
    }

    // Buscar categoria e atletas
    const { category, athletes } = await getCategoryAthletesAction(eventId, categoryId)

    if (!category) {
        redirect(`/painel/organizador/eventos/${eventId}/categorias`)
    }

    return <AtletasClient event={event} category={category} athletes={athletes} />
}
