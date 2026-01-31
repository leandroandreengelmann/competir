'use server'

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/app/actions/user"

type ActionState = {
    success?: boolean
    message?: string
    error?: string
}

interface Category {
    id: string
    belt: string
    min_weight: number
    max_weight: number
    age_group: string
    registration_fee: number
}

/**
 * Retorna as categorias vinculadas a um evento específico
 * Valida que o evento pertence ao organizador logado
 */
export async function getEventCategoriesAction(eventId: string): Promise<Category[]> {
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') return []

    try {
        const supabase = await createClient()

        // 1. Buscar categorias vinculadas usando query relacional (JOIN)
        // Isso evita o uso de cláusula IN com milhares de IDs na URL
        const { data: eventCategories, error: ecError } = await supabase
            .from('event_categories')
            .select(`
                category:categories (
                    id, belt, min_weight, max_weight, age_group, registration_fee, organizer_id
                )
            `)
            .eq('event_id', eventId)

        if (ecError) {
            console.error('[getEventCategoriesAction] Erro ao buscar categorias vinculadas:', ecError)
            return []
        }

        // 2. Extrair categorias e filtrar por organizer_id (garantia extra além do RLS)
        const categories = eventCategories
            .map(ec => {
                const cat = ec.category
                return Array.isArray(cat) ? cat[0] : cat
            })
            .filter((c): c is any => !!c && c.organizer_id === user.id)
            .sort((a, b) => {
                const beltComp = (a.belt || '').localeCompare(b.belt || '')
                if (beltComp !== 0) return beltComp
                return (a.min_weight || 0) - (b.min_weight || 0)
            })

        return categories as Category[]
    } catch (error) {
        console.error('[getEventCategoriesAction] Erro inesperado:', error)
        return []
    }
}

/**
 * Retorna categorias disponíveis para vincular ao evento
 * Exclui categorias já vinculadas (Filtragem em memória para evitar HeadersOverflow)
 */
export async function getAvailableCategoriesAction(eventId: string): Promise<Category[]> {
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') return []

    try {
        const supabase = await createClient()

        // Buscar dados em paralelo para eficiência
        const [
            { data: allCategories, error: allErr },
            { data: linkedCategories, error: linkedErr }
        ] = await Promise.all([
            // Todas as categorias do organizador
            supabase
                .from('categories')
                .select('id, belt, min_weight, max_weight, age_group, registration_fee')
                .eq('organizer_id', user.id),
            // Apenas os IDs das categorias já vinculadas
            supabase
                .from('event_categories')
                .select('category_id')
                .eq('event_id', eventId)
        ])

        if (allErr || linkedErr) {
            console.error('Erro ao buscar dados para categorias disponíveis:', allErr || linkedErr)
            return []
        }

        if (!allCategories) return []

        const linkedIds = new Set((linkedCategories || []).map(ec => ec.category_id))

        // Filtrar em memória (Server-side) evite cláusula NOT IN massiva na URL
        const available = allCategories
            .filter(cat => !linkedIds.has(cat.id))
            .sort((a, b) => {
                const beltComp = (a.belt || '').localeCompare(b.belt || '')
                if (beltComp !== 0) return beltComp
                return (a.min_weight || 0) - (b.min_weight || 0)
            })

        return available as Category[]
    } catch (error) {
        console.error('Erro ao processar categorias disponíveis:', error)
        return []
    }
}

/**
 * Adiciona categorias ao evento
 * Valida ownership e usa upsert para evitar duplicatas
 */
export async function addCategoriesToEventAction(
    eventId: string,
    categoryIds: string[]
): Promise<ActionState> {
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') {
        return { error: 'Não autorizado.' }
    }

    if (!categoryIds || categoryIds.length === 0) {
        return { error: 'Selecione pelo menos uma categoria.' }
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
            return { error: 'Evento não encontrado ou não autorizado.' }
        }

        // Validar que TODAS as categorias pertencem ao organizador logado
        const { data: validCategories, error: validationError } = await supabase
            .from('categories')
            .select('id')
            .eq('organizer_id', user.id)
            .in('id', categoryIds)

        if (validationError || !validCategories || validCategories.length !== categoryIds.length) {
            return { error: 'Uma ou mais categorias não pertencem a você.' }
        }

        // Inserir vínculos (upsert para evitar duplicatas)
        const inserts = categoryIds.map(categoryId => ({
            event_id: eventId,
            category_id: categoryId
        }))

        const { error } = await supabase
            .from('event_categories')
            .upsert(inserts, {
                onConflict: 'event_id,category_id',
                ignoreDuplicates: true
            })

        if (error) {
            console.error('Erro ao vincular categorias:', error)
            return { error: 'Erro ao vincular categorias. Tente novamente.' }
        }

        revalidatePath(`/painel/organizador/eventos/${eventId}`)

        return {
            success: true,
            message: `${categoryIds.length} categoria(s) adicionada(s) com sucesso!`
        }
    } catch (error) {
        console.error('Erro ao adicionar categorias ao evento:', error)
        return { error: 'Erro ao vincular categorias. Tente novamente.' }
    }
}

/**
 * Remove uma categoria de um evento
 */
export async function removeCategoryFromEventAction(
    eventId: string,
    categoryId: string
): Promise<ActionState> {
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') {
        return { error: 'Não autorizado.' }
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
            return { error: 'Evento não encontrado ou não autorizado.' }
        }

        const { error } = await supabase
            .from('event_categories')
            .delete()
            .eq('event_id', eventId)
            .eq('category_id', categoryId)

        if (error) {
            console.error('Erro ao remover categoria:', error)
            return { error: 'Erro ao remover categoria.' }
        }

        revalidatePath(`/painel/organizador/eventos/${eventId}`)

        return { success: true, message: 'Categoria removida com sucesso!' }
    } catch (error) {
        console.error('Erro ao remover categoria do evento:', error)
        return { error: 'Erro ao remover categoria.' }
    }
}
