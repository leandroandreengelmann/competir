import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/app/actions/user'
import { BracketPageClient } from './chaves-client'

interface PageProps {
    params: Promise<{ eventId: string, categoryId: string }>
}

export default async function CategoryBracketPage({ params }: PageProps) {
    const resolvedParams = await params
    const eventId = resolvedParams.eventId
    const categoryId = resolvedParams.categoryId

    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') {
        redirect('/login')
    }

    const supabase = await createClient()

    const { data: event } = await supabase
        .from('events')
        .select('name')
        .eq('id', eventId)
        .eq('organizer_id', user.id)
        .single()

    if (!event) redirect('/painel/organizador/eventos')

    // Buscar categoria via event_categories join
    const { data: eventCategory } = await supabase
        .from('event_categories')
        .select('category_id')
        .eq('event_id', eventId)
        .eq('category_id', categoryId)
        .single()

    if (!eventCategory) redirect(`/painel/organizador/eventos/${eventId}/categorias`)

    const { data: category } = await supabase
        .from('categories')
        .select('belt, age_group, min_weight, max_weight')
        .eq('id', categoryId)
        .single()

    if (!category) redirect(`/painel/organizador/eventos/${eventId}/categorias`)

    return (
        <BracketPageClient
            eventId={eventId}
            categoryId={categoryId}
            event={event}
            category={category}
        />
    )
}
