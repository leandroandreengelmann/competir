'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from './user'

type ActionState = {
    success?: boolean
    error?: string
    registrations?: Registration[]
}

type Registration = {
    registration_id: string
    status: string
    amount_cents: number
    created_at: string
    athlete_id: string
    athlete_name: string
    athlete_email: string
    belt: string
    age_group: string
    min_weight: number
    max_weight: number
}

/**
 * Buscar todas as inscrições de um evento
 * Apenas o organizador dono do evento pode acessar
 */
export async function getOrganizerEventRegistrationsAction(
    eventId: string
): Promise<ActionState> {
    const user = await getCurrentUser()

    if (!user || user.role !== 'organizador') {
        return { error: 'Acesso negado. Apenas organizadores podem acessar.' }
    }

    try {
        const supabase = await createClient()

        // Validar ownership do evento
        const { data: event } = await supabase
            .from('events')
            .select('id, organizer_id')
            .eq('id', eventId)
            .single()

        if (!event) {
            return { error: 'Evento não encontrado.' }
        }

        if (event.organizer_id !== user.id) {
            return { error: 'Acesso negado. Este evento não pertence a você.' }
        }

        // Buscar inscrições com JOINs usando Admin Client para ver perfis (RLS bypass)
        const adminClient = createAdminClient()
        const { data: registrations, error } = await adminClient
            .from('registrations')
            .select(`
                id,
                status,
                amount_cents,
                created_at,
                athlete_user_id,
                profiles!registrations_athlete_user_id_fkey(id, name, email),
                categories(belt, age_group, min_weight, max_weight)
            `)
            .eq('event_id', eventId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Erro ao buscar inscrições:', error)
            return { error: 'Erro ao buscar inscrições.' }
        }

        const result: Registration[] = (registrations || []).map((r: any) => ({
            registration_id: r.id,
            status: r.status,
            amount_cents: r.amount_cents,
            created_at: r.created_at,
            athlete_id: r.athlete_user_id,
            athlete_name: r.profiles?.name || '',
            athlete_email: r.profiles?.email || '',
            belt: r.categories?.belt || '',
            age_group: r.categories?.age_group || '',
            min_weight: r.categories?.min_weight || 0,
            max_weight: r.categories?.max_weight || 0
        }))

        return { success: true, registrations: result }
    } catch (error) {
        console.error('Erro ao buscar inscrições:', error)
        return { error: 'Erro ao buscar inscrições.' }
    }
}

/**
 * @deprecated Ação desabilitada por segurança.
 * O cancelamento deve ocorrer via fluxo oficial de atendimento ou regras automáticas.
 */
export async function cancelRegistrationByOrganizerAction(
    registrationId: string
): Promise<ActionState> {
    return { error: 'AÇÃO DESABILITADA. O cancelamento manual de inscrições não é permitido.' }
}

/**
 * @deprecated Ação desabilitada por segurança.
 * O status de pagamento é atualizado automaticamente via integração com Asaas.
 */
export async function markRegistrationPaidByOrganizerAction(
    registrationId: string
): Promise<ActionState> {
    return { error: 'AÇÃO DESABILITADA. A confirmação de pagamento manual não é permitida.' }
}
