'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './user'

type ActionState = {
    error?: string
    success?: boolean
    message?: string
}

interface Event {
    id: string
    name: string
    address: string
    description: string
    date: string
    organizer_id: string
    image_url?: string
}

/**
 * Buscar todos os eventos públicos (para página index)
 */
export async function getAllPublicEventsAction(): Promise<Event[]> {
    try {
        const supabase = await createClient()

        const { data: events, error } = await supabase
            .from('events')
            .select('id, name, address, description, date, organizer_id, image_url')
            .eq('is_published', true)
            .order('date', { ascending: true })

        if (error) {
            console.error('Erro ao buscar eventos públicos:', error)
            return []
        }

        return (events || []) as Event[]
    } catch (error) {
        console.error('Erro ao buscar eventos públicos:', error)
        return []
    }
}

/**
 * Adicionar evento aos interesses do atleta logado
 */
export async function addEventInterestAction(eventId: string): Promise<ActionState> {
    const user = await getCurrentUser()

    if (!user) {
        return { error: 'Você precisa estar autenticado.' }
    }

    if (user.role !== 'atleta') {
        return { error: 'Apenas atletas podem demonstrar interesse em eventos.' }
    }

    try {
        const supabase = await createClient()

        // Validar que o evento existe
        const { data: event } = await supabase
            .from('events')
            .select('id')
            .eq('id', eventId)
            .single()

        if (!event) {
            return { error: 'Evento não encontrado.' }
        }

        // Inserir interesse (upsert para evitar duplicatas)
        const { error } = await supabase
            .from('athlete_event_interests')
            .upsert({
                athlete_user_id: user.id,
                event_id: eventId
            }, { onConflict: 'athlete_user_id,event_id' })

        if (error) {
            console.error('Erro ao adicionar interesse:', error)
            return { error: 'Erro ao registrar interesse. Tente novamente.' }
        }

        revalidatePath('/painel/atleta')

        return {
            success: true,
            message: 'Interesse registrado com sucesso!'
        }
    } catch (error) {
        console.error('Erro ao adicionar interesse:', error)
        return { error: 'Erro ao registrar interesse. Tente novamente.' }
    }
}

/**
 * Buscar eventos de interesse do atleta logado
 */
export async function getAthleteInterestsAction(): Promise<Event[]> {
    const user = await getCurrentUser()

    if (!user || user.role !== 'atleta') {
        return []
    }

    try {
        const supabase = await createClient()

        // Buscar interesses
        const { data: interests } = await supabase
            .from('athlete_event_interests')
            .select('event_id')
            .eq('athlete_user_id', user.id)

        if (!interests || interests.length === 0) return []

        const eventIds = interests.map(i => i.event_id)

        // Buscar eventos
        const { data: events } = await supabase
            .from('events')
            .select('id, name, address, description, date, organizer_id, image_url')
            .in('id', eventIds)
            .order('date', { ascending: true })

        return (events || []) as Event[]
    } catch (error) {
        console.error('Erro ao buscar eventos de interesse:', error)
        return []
    }
}

/**
 * Verificar se atleta já tem interesse no evento
 */
export async function hasEventInterestAction(eventId: string): Promise<boolean> {
    const user = await getCurrentUser()

    if (!user || user.role !== 'atleta') {
        return false
    }

    try {
        const supabase = await createClient()

        const { data: interest } = await supabase
            .from('athlete_event_interests')
            .select('id')
            .eq('athlete_user_id', user.id)
            .eq('event_id', eventId)
            .single()

        return !!interest
    } catch (error) {
        console.error('Erro ao verificar interesse:', error)
        return false
    }
}

/**
 * Remover interesse em um evento
 */
export async function removeEventInterestAction(eventId: string): Promise<ActionState> {
    const user = await getCurrentUser()

    if (!user || user.role !== 'atleta') {
        return { error: 'Não autorizado.' }
    }

    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('athlete_event_interests')
            .delete()
            .eq('athlete_user_id', user.id)
            .eq('event_id', eventId)

        if (error) {
            console.error('Erro ao remover interesse:', error)
            return { error: 'Erro ao remover interesse.' }
        }

        revalidatePath('/painel/atleta')

        return { success: true, message: 'Interesse removido.' }
    } catch (error) {
        console.error('Erro ao remover interesse:', error)
        return { error: 'Erro ao remover interesse.' }
    }
}
