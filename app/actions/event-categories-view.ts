'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './user'

type CategoryWithCounts = {
    id: string
    belt: string
    min_weight: number
    max_weight: number
    age_group: string
    registration_fee: number
    total_inscricoes: number
    total_pagas: number
    total_pendentes: number
    total_canceladas: number
}

type CategoryAthlete = {
    registration_id: string
    athlete_name: string
    athlete_email: string
    status: string
    amount_cents: number
    created_at: string
}

/**
 * Retorna categorias vinculadas ao evento com contadores de inscrições
 * Valida que o evento pertence ao organizador logado
 */
export async function getEventCategoriesWithCountsAction(
    eventId: string
): Promise<CategoryWithCounts[]> {
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') return []

    try {
        const supabase = await createClient()

        // 1. Validar evento
        const { data: event } = await supabase
            .from('events')
            .select('id')
            .eq('id', eventId)
            .eq('organizer_id', user.id)
            .single()

        if (!event) return []

        // 2. Buscar categorias vinculadas (com detalhes via JOIN)
        const { data: linkedData } = await supabase
            .from('event_categories')
            .select(`
                category:categories (
                    id, belt, min_weight, max_weight, age_group, registration_fee, organizer_id
                )
            `)
            .eq('event_id', eventId)

        const linkedCategories = (linkedData || []).map(ld => {
            const cat = ld.category
            return Array.isArray(cat) ? cat[0] : cat
        }).filter(c => !!c && c.organizer_id === user.id)

        // 3. Buscar todas as inscrições do evento
        const { data: registrations } = await supabase
            .from('registrations')
            .select('category_id, status')
            .eq('event_id', eventId)

        const regs = registrations || []

        // 4. Identificar categorias que têm inscrições mas talvez não estejam vinculadas
        const linkedIds = new Set(linkedCategories.map(c => c.id))
        const unlinkedRegIds = Array.from(new Set(
            regs.filter(r => !linkedIds.has(r.category_id)).map(r => r.category_id)
        ))

        let allCategories = [...linkedCategories]

        if (unlinkedRegIds.length > 0) {
            const { data: unlinkedCats } = await supabase
                .from('categories')
                .select('id, belt, min_weight, max_weight, age_group, registration_fee, organizer_id')
                .in('id', unlinkedRegIds)
                .eq('organizer_id', user.id)

            if (unlinkedCats) {
                allCategories = [...allCategories, ...unlinkedCats]
            }
        }

        // 5. Agrupar contadores
        const result = allCategories.map(cat => {
            const catRegs = regs.filter(r => r.category_id === cat.id)
            return {
                id: cat.id,
                belt: cat.belt,
                min_weight: cat.min_weight,
                max_weight: cat.max_weight,
                age_group: cat.age_group,
                registration_fee: cat.registration_fee,
                total_inscricoes: catRegs.length,
                total_pagas: catRegs.filter(r => r.status === 'paid').length,
                total_pendentes: catRegs.filter(r => r.status === 'pending_payment').length,
                total_canceladas: catRegs.filter(r => r.status === 'cancelled').length
            }
        })

        // Ordenar
        return result.sort((a, b) => {
            const beltComp = (a.belt || '').localeCompare(b.belt || '')
            if (beltComp !== 0) return beltComp
            return (a.min_weight || 0) - (b.min_weight || 0)
        })
    } catch (error) {
        console.error('Erro ao buscar categorias com contadores:', error)
        return []
    }
}

/**
 * Retorna atletas inscritos em uma categoria específica de um evento
 * Valida ownership do evento, categoria e vínculo
 */
export async function getCategoryAthletesAction(
    eventId: string,
    categoryId: string
): Promise<{ athletes: CategoryAthlete[], category: CategoryWithCounts | null }> {
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') {
        return { athletes: [], category: null }
    }

    try {
        const supabase = await createClient()

        // Validar que o evento pertence ao organizador logado
        const { data: event } = await supabase
            .from('events')
            .select('id')
            .eq('id', eventId)
            .eq('organizer_id', user.id)
            .single()

        if (!event) {
            return { athletes: [], category: null }
        }

        // Validar que a categoria pertence ao organizador
        const { data: categoryData } = await supabase
            .from('categories')
            .select('id, belt, min_weight, max_weight, age_group, registration_fee')
            .eq('id', categoryId)
            .eq('organizer_id', user.id)
            .single()

        if (!categoryData) {
            return { athletes: [], category: null }
        }

        // Validar que a categoria está vinculada ao evento
        const { data: categoryLink } = await supabase
            .from('event_categories')
            .select('id')
            .eq('event_id', eventId)
            .eq('category_id', categoryId)
            .single()

        if (!categoryLink) {
            return { athletes: [], category: null }
        }

        // Buscar registrations com perfis
        const { data: registrations } = await supabase
            .from('registrations')
            .select(`
                id,
                status,
                amount_cents,
                created_at,
                profiles!registrations_athlete_user_id_fkey(name, email)
            `)
            .eq('event_id', eventId)
            .eq('category_id', categoryId)
            .order('created_at', { ascending: false })

        const regs = registrations || []

        // Montar contadores
        const category: CategoryWithCounts = {
            id: categoryData.id,
            belt: categoryData.belt,
            min_weight: categoryData.min_weight,
            max_weight: categoryData.max_weight,
            age_group: categoryData.age_group,
            registration_fee: categoryData.registration_fee,
            total_inscricoes: regs.length,
            total_pagas: regs.filter(r => r.status === 'paid').length,
            total_pendentes: regs.filter(r => r.status === 'pending_payment').length,
            total_canceladas: regs.filter(r => r.status === 'cancelled').length
        }

        // Montar lista de atletas
        const athletes: CategoryAthlete[] = regs.map((r: any) => ({
            registration_id: r.id,
            athlete_name: r.profiles?.name || '',
            athlete_email: r.profiles?.email || '',
            status: r.status,
            amount_cents: r.amount_cents,
            created_at: r.created_at
        }))

        return { athletes, category }
    } catch (error) {
        console.error('Erro ao buscar atletas da categoria:', error)
        return { athletes: [], category: null }
    }
}
