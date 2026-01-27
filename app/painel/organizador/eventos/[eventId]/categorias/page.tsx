import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/app/actions/user'
import { getEventCategoriesWithCountsAction } from '@/app/actions/event-categories-view'
import { CategoriasClient } from './categorias-client'

interface PageProps {
    params: Promise<{ eventId: string }>
}

export default async function CategoriasPage({ params }: PageProps) {
    const resolvedParams = await params
    const eventId = resolvedParams.eventId

    // Validar sessão
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') {
        redirect('/login')
    }

    const supabase = await createClient()

    // Buscar dados do evento
    const { data: event } = await supabase
        .from('events')
        .select('id, name, date, address')
        .eq('id', eventId)
        .eq('organizer_id', user.id)
        .single()

    if (!event) {
        redirect('/painel/organizador/eventos')
    }

    // Buscar categorias com contadores
    const categories = await getEventCategoriesWithCountsAction(eventId)

    return <CategoriasClient event={event} categories={categories} />
}
