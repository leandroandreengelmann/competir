'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from './user'
import { repairNullSlots } from '@/lib/bracket-utils'

type ActionState = {
    error?: string
    success?: boolean
    message?: string
}

type RegistrationSlot = {
    bracket_slot: number
    athlete_name: string
    athlete_id: string
}

type ComputedMatch = {
    id: string
    event_id: string
    category_id: string
    round: number
    match_no: number
    slot_a: number
    slot_b: number
    athlete_a_id: string | null
    athlete_b_id: string | null
    winner_id: string | null
    is_bye: boolean
    status: string
    is_preview?: boolean
    athlete_a_name?: string
    athlete_b_name?: string
}

// Gera matches em memória (não persistidos) - função helper interna
function buildMatchesFromSlots(
    eventId: string,
    categoryId: string,
    bracketSize: number,
    registrations: RegistrationSlot[],
    isPreview: boolean = false
): ComputedMatch[] {
    const matches: ComputedMatch[] = []
    const totalRounds = Math.log2(bracketSize)

    // Criar mapa de slots para atletas
    const slotToAthlete = new Map<number, { id: string; name: string }>()
    for (const reg of registrations) {
        if (reg.bracket_slot) {
            slotToAthlete.set(reg.bracket_slot, { id: reg.athlete_id, name: reg.athlete_name })
        }
    }

    let matchNo = 1

    // Gerar matches da primeira rodada
    for (let i = 1; i <= bracketSize; i += 2) {
        const slotA = i
        const slotB = i + 1
        const athleteA = slotToAthlete.get(slotA)
        const athleteB = slotToAthlete.get(slotB)

        const isBye = !athleteA || !athleteB
        const winnerId = isBye ? (athleteA?.id || athleteB?.id || null) : null

        matches.push({
            id: `preview-${matchNo}`,
            event_id: eventId,
            category_id: categoryId,
            round: 1,
            match_no: matchNo,
            slot_a: slotA,
            slot_b: slotB,
            athlete_a_id: athleteA?.id || null,
            athlete_b_id: athleteB?.id || null,
            winner_id: winnerId,
            is_bye: isBye,
            status: isBye ? 'completed' : 'pending',
            is_preview: isPreview,
            athlete_a_name: athleteA?.name,
            athlete_b_name: athleteB?.name
        })

        matchNo++
    }

    // Gerar matches das rodadas seguintes (vazios)
    for (let round = 2; round <= totalRounds; round++) {
        const matchesInRound = bracketSize / Math.pow(2, round)
        for (let i = 0; i < matchesInRound; i++) {
            matches.push({
                id: `preview-r${round}-${i + 1}`,
                event_id: eventId,
                category_id: categoryId,
                round,
                match_no: matchNo,
                slot_a: 0,
                slot_b: 0,
                athlete_a_id: null,
                athlete_b_id: null,
                winner_id: null,
                is_bye: false,
                status: 'pending',
                is_preview: isPreview
            })
            matchNo++
        }
    }

    return matches
}

// Para as inscrições de um evento e trava todas as suas categorias
export async function stopEventRegistrationsAction(eventId: string): Promise<ActionState> {
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') {
        return { error: 'Não autorizado.' }
    }

    try {
        const supabase = await createClient()

        // Validar ownership
        const { data: event } = await supabase
            .from('events')
            .select('id, organizer_id')
            .eq('id', eventId)
            .eq('organizer_id', user.id)
            .single()

        if (!event) {
            return { error: 'Evento não encontrado ou não autorizado.' }
        }

        // Fechar inscrições do evento
        await supabase
            .from('events')
            .update({ is_open_for_inscriptions: false })
            .eq('id', eventId)

        // Buscar categorias vinculadas
        const { data: eventCategories } = await supabase
            .from('event_categories')
            .select('category_id')
            .eq('event_id', eventId)

        if (!eventCategories || eventCategories.length === 0) {
            revalidatePath(`/painel/organizador/eventos/${eventId}`)
            return { success: true, message: 'Inscrições encerradas.' }
        }

        const categoryIds = eventCategories.map(ec => ec.category_id)

        // Travar todas as categorias
        await supabase
            .from('categories')
            .update({
                is_locked: true,
                lock_at: new Date().toISOString()
            })
            .in('id', categoryIds)

        // Gerar matches para cada categoria
        for (const categoryId of categoryIds) {
            await generateMatchesForCategory(eventId, categoryId)
        }

        revalidatePath(`/painel/organizador/eventos/${eventId}`)
        return { success: true, message: 'Inscrições encerradas e chaves geradas!' }
    } catch (error) {
        console.error('Erro ao encerrar inscrições:', error)
        return { error: 'Erro ao processar. Tente novamente.' }
    }
}

// Reabre as inscrições de um evento
export async function reopenEventRegistrationsAction(eventId: string): Promise<ActionState> {
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') {
        return { error: 'Não autorizado.' }
    }

    try {
        const supabase = await createClient()

        // Validar ownership
        const { data: event } = await supabase
            .from('events')
            .select('id, organizer_id')
            .eq('id', eventId)
            .eq('organizer_id', user.id)
            .single()

        if (!event) {
            return { error: 'Evento não encontrado ou não autorizado.' }
        }

        // Reabrir inscrições
        await supabase
            .from('events')
            .update({ is_open_for_inscriptions: true })
            .eq('id', eventId)

        // Deletar matches do evento
        await supabase
            .from('matches')
            .delete()
            .eq('event_id', eventId)

        revalidatePath(`/painel/organizador/eventos/${eventId}`)
        return { success: true, message: 'Inscrições reabertas!' }
    } catch (error) {
        console.error('Erro ao reabrir inscrições:', error)
        return { error: 'Erro ao processar. Tente novamente.' }
    }
}

// Gera os matches definitivos para uma categoria
async function generateMatchesForCategory(eventId: string, categoryId: string) {
    const adminClient = createAdminClient()

    // Buscar categoria
    const { data: category } = await adminClient
        .from('categories')
        .select('bracket_size')
        .eq('id', categoryId)
        .single()

    if (!category) return

    const bracketSize = category.bracket_size || 4

    // Buscar inscrições pagas com slots
    const { data: registrations } = await adminClient
        .from('registrations')
        .select('bracket_slot, athlete_user_id, profiles!registrations_athlete_user_id_fkey(name)')
        .eq('event_id', eventId)
        .eq('category_id', categoryId)
        .eq('status', 'paid')
        .not('bracket_slot', 'is', null)
        .order('bracket_slot')

    if (!registrations || registrations.length === 0) return

    const slots: RegistrationSlot[] = registrations.map((r: any) => ({
        bracket_slot: r.bracket_slot,
        athlete_id: r.athlete_user_id,
        athlete_name: r.profiles?.name || ''
    }))

    // Gerar matches
    const matches = buildMatchesFromSlots(eventId, categoryId, bracketSize, slots, false)

    // Filtrar apenas primeira rodada para persistir
    const round1Matches = matches.filter(m => m.round === 1)

    // Inserir no banco
    for (const match of round1Matches) {
        await adminClient
            .from('matches')
            .insert({
                event_id: eventId,
                category_id: categoryId,
                round: match.round,
                match_no: match.match_no,
                slot_a: match.slot_a,
                slot_b: match.slot_b,
                athlete_a_id: match.athlete_a_id,
                athlete_b_id: match.athlete_b_id,
                winner_id: match.winner_id,
                is_bye: match.is_bye,
                status: match.status
            })
    }
}

// Obtém o bracket computado em tempo real (para UI)
export async function getBracketDataAction(eventId: string, categoryId: string) {
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') {
        return { error: 'Não autorizado.' }
    }

    try {
        const supabase = await createClient()

        // Validar ownership do evento
        const { data: event } = await supabase
            .from('events')
            .select('id, organizer_id, is_open_for_inscriptions')
            .eq('id', eventId)
            .eq('organizer_id', user.id)
            .single()

        if (!event) {
            return { error: 'Evento não encontrado.' }
        }

        // Buscar categoria
        const { data: category } = await supabase
            .from('categories')
            .select('id, bracket_size, is_locked')
            .eq('id', categoryId)
            .single()

        if (!category) {
            return { error: 'Categoria não encontrada.' }
        }

        const bracketSize = category.bracket_size || 4
        const isLocked = category.is_locked
        const adminClient = createAdminClient()

        // Se locked, buscar matches persistidos com nomes dos atletas
        if (isLocked) {
            const { data: matches } = await adminClient
                .from('matches')
                .select(`
                    id,
                    event_id,
                    category_id,
                    round,
                    match_no,
                    slot_a,
                    slot_b,
                    athlete_a_id,
                    athlete_b_id,
                    winner_id,
                    is_bye,
                    status,
                    athlete_a:profiles!matches_athlete_a_id_fkey(name),
                    athlete_b:profiles!matches_athlete_b_id_fkey(name)
                `)
                .eq('event_id', eventId)
                .eq('category_id', categoryId)
                .order('round')
                .order('match_no')

            // Ajustar formato para o frontend (incluindo nomes)
            const formattedMatches = (matches || []).map((m: any) => ({
                ...m,
                athlete_a_name: m.athlete_a?.name || '',
                athlete_b_name: m.athlete_b?.name || ''
            }))

            return {
                success: true,
                bracketSize,
                isLocked: true,
                matches: formattedMatches
            }
        }

        // Se não locked, buscar registrations pagas (incluindo slots nulos) para preview usando Admin (RLS bypass)
        const { data: registrations } = await adminClient
            .from('registrations')
            .select('id, bracket_slot, athlete_user_id, created_at, profiles!registrations_athlete_user_id_fkey(name)')
            .eq('event_id', eventId)
            .eq('category_id', categoryId)
            .eq('status', 'paid')
            .order('created_at')

        const regs = registrations || []
        const hasNullSlots = regs.some(r => r.bracket_slot === null)

        // Se houver slots nulos, reparar e persistir no banco (atribuição automática)
        if (hasNullSlots && regs.length > 0) {
            const adminClient = createAdminClient()
            const { repairs, newBracketSize } = repairNullSlots(
                regs.map(r => ({ id: r.id, bracket_slot: r.bracket_slot, created_at: r.created_at })),
                bracketSize
            )

            // Persistir reparos de slot
            for (const repair of repairs) {
                await adminClient
                    .from('registrations')
                    .update({ bracket_slot: repair.newSlot })
                    .eq('id', repair.id)
            }

            // Se o tamanho do bracket mudou devido ao reparo, atualizar categoria
            if (newBracketSize > bracketSize) {
                await adminClient
                    .from('categories')
                    .update({ bracket_size: newBracketSize })
                    .eq('id', categoryId)
            }

            // Recarregar registrations para garantir que temos os dados com os novos slots usando Admin
            const { data: updatedRegs } = await adminClient
                .from('registrations')
                .select('bracket_slot, athlete_user_id, profiles!registrations_athlete_user_id_fkey(name)')
                .eq('event_id', eventId)
                .eq('category_id', categoryId)
                .eq('status', 'paid')
                .not('bracket_slot', 'is', null)
                .order('bracket_slot')

            const slots: RegistrationSlot[] = (updatedRegs || []).map((r: any) => ({
                bracket_slot: r.bracket_slot,
                athlete_id: r.athlete_user_id,
                athlete_name: r.profiles?.name || ''
            }))

            return {
                success: true,
                bracketSize: Math.max(bracketSize, newBracketSize),
                isLocked: false,
                matches: buildMatchesFromSlots(eventId, categoryId, Math.max(bracketSize, newBracketSize), slots, true),
                registrations: slots
            }
        }

        // Caso padrão: todos já possuem slots
        const slots: RegistrationSlot[] = regs
            .filter(r => r.bracket_slot !== null)
            .map((r: any) => ({
                bracket_slot: r.bracket_slot,
                athlete_id: r.athlete_user_id,
                athlete_name: r.profiles?.name || ''
            }))

        const finalBracketSize = bracketSize
        const previewMatches = buildMatchesFromSlots(eventId, categoryId, finalBracketSize, slots, true)

        return {
            success: true,
            bracketSize: finalBracketSize,
            isLocked: false,
            matches: previewMatches,
            registrations: slots
        }
    } catch (error) {
        console.error('Erro ao buscar bracket:', error)
        return { error: 'Erro ao buscar dados do chaveamento.' }
    }
}
