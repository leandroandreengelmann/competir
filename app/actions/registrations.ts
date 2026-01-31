'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './user'

type ActionState = {
    error?: string
    success?: boolean
    registrationId?: string
}

type Category = {
    id: string
    belt: string
    min_weight: number
    max_weight: number
    age_group: string
    registration_fee: number
}

type Registration = {
    id: string
    athlete_user_id: string
    event_id: string
    category_id: string
    status: string
    amount_cents: number
    created_at: string
    event_name?: string
    belt?: string
    age_group?: string
}

type AthleteRegistration = {
    registration_id: string
    status: string
    amount_cents: number
    created_at: string
    event_id: string
    event_name: string
    event_date: string
    event_address: string
    is_open_for_inscriptions: boolean
    category_id: string
    belt: string
    age_group: string
    min_weight: number
    max_weight: number
    hasMatch: boolean
    isBye: boolean
}

// Buscar categorias disponíveis para inscrição em um evento
export async function getEventCategoriesForRegistrationAction(eventId: string): Promise<Category[]> {
    const user = await getCurrentUser()
    if (!user || user.role !== 'atleta') return []

    try {
        const supabase = await createClient()

        // Verificar se evento está aberto
        const { data: event } = await supabase
            .from('events')
            .select('id, is_open_for_inscriptions')
            .eq('id', eventId)
            .single()

        if (!event || !event.is_open_for_inscriptions) return []

        // Buscar categorias vinculadas ao evento via JOIN para evitar In clause gigante
        // NOTA: Usamos a query direta na tabela categories com filtro via event_categories
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select(`
                id, 
                belt, 
                min_weight, 
                max_weight, 
                age_group, 
                registration_fee,
                event_categories!inner(event_id)
            `)
            .eq('event_categories.event_id', eventId)
            .order('belt')
            .order('min_weight')

        if (catError) {
            console.error('Erro ao buscar categorias via JOIN:', catError)
            return []
        }

        return (categories || []).map(c => ({
            id: c.id,
            belt: c.belt,
            min_weight: c.min_weight,
            max_weight: c.max_weight,
            age_group: c.age_group,
            registration_fee: c.registration_fee
        })) as Category[]
    } catch (error) {
        console.error('Erro ao buscar categorias para inscrição:', error)
        return []
    }
}

// Criar inscrição de atleta em evento
export async function createRegistrationAction(eventId: string, categoryId: string): Promise<ActionState> {
    const user = await getCurrentUser()

    if (!user) {
        return { error: 'Você precisa estar logado para se inscrever.' }
    }

    if (user.role !== 'atleta') {
        return { error: 'Apenas atletas podem se inscrever em eventos.' }
    }

    try {
        const supabase = await createClient()

        // Verificar se evento está aberto
        const { data: event } = await supabase
            .from('events')
            .select('id, is_open_for_inscriptions')
            .eq('id', eventId)
            .single()

        if (!event) {
            return { error: 'Evento não encontrado.' }
        }

        if (!event.is_open_for_inscriptions) {
            return { error: 'As inscrições para este evento estão encerradas.' }
        }

        // Verificar se categoria está vinculada ao evento
        const { data: eventCategory } = await supabase
            .from('event_categories')
            .select('id')
            .eq('event_id', eventId)
            .eq('category_id', categoryId)
            .single()

        if (!eventCategory) {
            return { error: 'Esta categoria não está disponível para este evento.' }
        }

        // Verificar se atleta já tem inscrição nesta categoria deste evento
        const { data: existingReg } = await supabase
            .from('registrations')
            .select('id')
            .eq('athlete_user_id', user.id)
            .eq('event_id', eventId)
            .eq('category_id', categoryId)
            .single()

        if (existingReg) {
            return { error: 'Você já possui uma inscrição nesta categoria.' }
        }

        // Buscar valor da categoria (snapshot)
        const { data: category } = await supabase
            .from('categories')
            .select('registration_fee')
            .eq('id', categoryId)
            .single()

        const amountCents = Math.round((category?.registration_fee || 0) * 100)

        // Criar inscrição
        const { data: registration, error } = await supabase
            .from('registrations')
            .insert({
                athlete_user_id: user.id,
                event_id: eventId,
                category_id: categoryId,
                status: 'pending_payment',
                amount_cents: amountCents
            })
            .select('id')
            .single()

        if (error) {
            if (error.code === '23505') { // UNIQUE violation
                return { error: 'Você já possui uma inscrição neste evento.' }
            }
            console.error('Erro ao criar inscrição:', error)
            return { error: 'Erro ao criar inscrição. Tente novamente.' }
        }

        // Remover interesse se existir (já está inscrito)
        await supabase
            .from('athlete_event_interests')
            .delete()
            .eq('athlete_user_id', user.id)
            .eq('event_id', eventId)

        revalidatePath('/painel/atleta')

        return {
            success: true,
            registrationId: registration.id
        }
    } catch (error) {
        console.error('Erro ao criar inscrição:', error)
        return { error: 'Erro ao processar inscrição. Tente novamente.' }
    }
}

// Buscar detalhes de uma inscrição
export async function getRegistrationAction(registrationId: string): Promise<Registration | null> {
    const user = await getCurrentUser()
    if (!user || user.role !== 'atleta') return null

    try {
        const supabase = await createClient()

        const { data: registration } = await supabase
            .from('registrations')
            .select(`
                id,
                athlete_user_id,
                event_id,
                category_id,
                status,
                amount_cents,
                created_at,
                events(name),
                categories(belt, age_group)
            `)
            .eq('id', registrationId)
            .eq('athlete_user_id', user.id)
            .single()

        if (!registration) return null

        return {
            id: registration.id,
            athlete_user_id: registration.athlete_user_id,
            event_id: registration.event_id,
            category_id: registration.category_id,
            status: registration.status,
            amount_cents: registration.amount_cents,
            created_at: registration.created_at,
            event_name: (registration.events as any)?.name,
            belt: (registration.categories as any)?.belt,
            age_group: (registration.categories as any)?.age_group
        }
    } catch (error) {
        console.error('Erro ao buscar inscrição:', error)
        return null
    }
}

// Buscar todas as inscrições do atleta logado
export async function getAthleteRegistrationsAction(): Promise<AthleteRegistration[]> {
    const user = await getCurrentUser()
    if (!user || user.role !== 'atleta') return []

    try {
        const supabase = await createClient()

        const { data: registrations, error } = await supabase
            .from('registrations')
            .select(`
                id,
                status,
                amount_cents,
                created_at,
                event_id,
                category_id,
                events(name, date, address, is_open_for_inscriptions),
                categories(belt, age_group, min_weight, max_weight)
            `)
            .eq('athlete_user_id', user.id)
            .order('created_at', { ascending: false })

        if (error || !registrations) return []

        // Verificar se atleta tem match em cada inscrição
        const result: AthleteRegistration[] = []

        for (const reg of registrations) {
            const event = reg.events as any
            const category = reg.categories as any

            // Verificar matches
            const { data: matches } = await supabase
                .from('matches')
                .select('id, is_bye')
                .eq('event_id', reg.event_id)
                .eq('category_id', reg.category_id)
                .or(`athlete_a_id.eq.${user.id},athlete_b_id.eq.${user.id}`)
                .limit(1)

            const hasMatch = matches && matches.length > 0
            const isBye = hasMatch && matches[0].is_bye

            result.push({
                registration_id: reg.id,
                status: reg.status,
                amount_cents: reg.amount_cents,
                created_at: reg.created_at,
                event_id: reg.event_id,
                event_name: event?.name || '',
                event_date: event?.date || '',
                event_address: event?.address || '',
                is_open_for_inscriptions: event?.is_open_for_inscriptions || false,
                category_id: reg.category_id,
                belt: category?.belt || '',
                age_group: category?.age_group || '',
                min_weight: category?.min_weight || 0,
                max_weight: category?.max_weight || 0,
                hasMatch: !!hasMatch,
                isBye: !!isBye
            })
        }

        return result
    } catch (error) {
        console.error('Erro ao buscar inscrições:', error)
        return []
    }
}
