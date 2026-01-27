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
    if (!user || user.role !== 'organizador') {
        console.log('[getEventCategoriesAction] Usuário não autenticado ou não é organizador')
        return []
    }

    try {
        const supabase = await createClient()

        // 1. Validar que o evento pertence ao organizador logado
        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('id')
            .eq('id', eventId)
            .eq('organizer_id', user.id)
            .single()

        if (eventError || !event) {
            console.log('[getEventCategoriesAction] Evento não encontrado ou não pertence ao organizador:', eventError)
            return []
        }

        // 2. Buscar IDs das categorias vinculadas ao evento
        const { data: eventCategories, error: ecError } = await supabase
            .from('event_categories')
            .select('category_id')
            .eq('event_id', eventId)

        if (ecError) {
            console.error('[getEventCategoriesAction] Erro ao buscar vínculos:', ecError)
            return []
        }

        if (!eventCategories || eventCategories.length === 0) {
            console.log('[getEventCategoriesAction] Nenhum vínculo encontrado para eventId:', eventId)
            return []
        }

        const categoryIds = eventCategories.map(ec => ec.category_id)
        console.log('[getEventCategoriesAction] IDs de categorias vinculadas:', categoryIds)

        // 3. Buscar dados das categorias (garantindo que pertencem ao organizador)
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('id, belt, min_weight, max_weight, age_group, registration_fee')
            .eq('organizer_id', user.id)
            .in('id', categoryIds)
            .order('belt')
            .order('min_weight')

        if (catError) {
            console.error('[getEventCategoriesAction] Erro ao buscar categorias:', catError)
            return []
        }

        console.log('[getEventCategoriesAction] Categorias retornadas:', categories?.length || 0)
        return (categories || []) as Category[]
    } catch (error) {
        console.error('[getEventCategoriesAction] Erro inesperado:', error)
        return []
    }
}

/**
 * Retorna categorias disponíveis para vincular ao evento
 * Exclui categorias já vinculadas
 */
export async function getAvailableCategoriesAction(eventId: string): Promise<Category[]> {
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') return []

    try {
        const supabase = await createClient()

        // Validar que o evento pertence ao organizador logado
        const { data: event } = await supabase
            .from('events')
            .select('id')
            .eq('id', eventId)
            .eq('organizer_id', user.id)
            .single()

        if (!event) return []

        // Buscar categorias já vinculadas
        const { data: linkedCategories } = await supabase
            .from('event_categories')
            .select('category_id')
            .eq('event_id', eventId)

        const linkedIds = (linkedCategories || []).map(ec => ec.category_id)

        // Buscar categorias do organizador que NÃO estão vinculadas
        let query = supabase
            .from('categories')
            .select('id, belt, min_weight, max_weight, age_group, registration_fee')
            .eq('organizer_id', user.id)
            .order('belt')
            .order('min_weight')

        if (linkedIds.length > 0) {
            query = query.not('id', 'in', `(${linkedIds.join(',')})`)
        }

        const { data: categories, error } = await query

        if (error) {
            console.error('Erro ao buscar categorias disponíveis:', error)
            return []
        }

        return (categories || []) as Category[]
    } catch (error) {
        console.error('Erro ao buscar categorias disponíveis:', error)
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
