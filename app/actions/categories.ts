'use server'

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/app/actions/user"
import { performCategoryAudit } from "@/lib/categories-checker-logic"

type ActionState = {
    success?: boolean
    message?: string
    error?: string
}

export async function createCategoryAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') return { error: 'Não autorizado.' }

    const belt_id = formData.get('belt_id') as string
    const age_group_id = formData.get('age_group_id') as string
    const min_weight_raw = formData.get('min_weight') as string
    const max_weight_raw = formData.get('max_weight') as string
    const registration_fee = parseFloat(formData.get('registration_fee') as string) || 0

    if (!belt_id || !age_group_id) {
        return { error: 'Preencha todos os campos obrigatórios.' }
    }

    // Validação condicional de peso
    const hasMinWeight = min_weight_raw && min_weight_raw.trim() !== ''
    const hasMaxWeight = max_weight_raw && max_weight_raw.trim() !== ''

    let min_weight: number
    let max_weight: number

    if (!hasMinWeight && !hasMaxWeight) {
        // Ambos vazios = categoria livre (sem limite de peso)
        min_weight = -1
        max_weight = -1
    } else if (hasMinWeight && hasMaxWeight) {
        // Ambos preenchidos = validar
        min_weight = parseFloat(min_weight_raw)
        max_weight = parseFloat(max_weight_raw)

        if (isNaN(min_weight) || isNaN(max_weight)) {
            return { error: 'Valores de peso inválidos.' }
        }

        if (min_weight > max_weight) {
            return { error: 'Peso inicial deve ser menor ou igual ao peso final.' }
        }
    } else {
        // Apenas um preenchido = erro
        return { error: 'Preencha ambos os campos de peso ou deixe ambos vazios.' }
    }

    try {
        const supabase = await createClient()

        // Buscar nomes para manter compatibilidade legada (dual-write)
        const [{ data: beltData }, { data: ageData }] = await Promise.all([
            supabase.from('belts').select('name').eq('id', belt_id).single(),
            supabase.from('age_groups').select('name').eq('id', age_group_id).single()
        ])

        const { error } = await supabase
            .from('categories')
            .insert({
                organizer_id: user.id,
                belt_id,
                age_group_id,
                belt: beltData?.name || '',
                age_group: ageData?.name || '',
                min_weight,
                max_weight,
                registration_fee
            })

        if (error) {
            console.error('Erro ao criar categoria:', error)
            return { error: 'Erro ao criar categoria.' }
        }

        revalidatePath('/painel/organizador/categorias')
        return { success: true, message: 'Categoria criada com sucesso!' }
    } catch (error) {
        console.error(error)
        return { error: 'Erro ao criar categoria.' }
    }
}

export async function updateCategoryAction(id: string, prevState: ActionState, formData: FormData): Promise<ActionState> {
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') return { error: 'Não autorizado.' }

    const belt_id = formData.get('belt_id') as string
    const age_group_id = formData.get('age_group_id') as string
    const min_weight_raw = formData.get('min_weight') as string
    const max_weight_raw = formData.get('max_weight') as string
    const registration_fee = parseFloat(formData.get('registration_fee') as string) || 0

    if (!belt_id || !age_group_id) {
        return { error: 'Preencha todos os campos obrigatórios.' }
    }

    // Validação condicional de peso
    const hasMinWeight = min_weight_raw && min_weight_raw.trim() !== ''
    const hasMaxWeight = max_weight_raw && max_weight_raw.trim() !== ''

    let min_weight: number
    let max_weight: number

    if (!hasMinWeight && !hasMaxWeight) {
        // Ambos vazios = categoria livre (sem limite de peso)
        min_weight = -1
        max_weight = -1
    } else if (hasMinWeight && hasMaxWeight) {
        // Ambos preenchidos = validar
        min_weight = parseFloat(min_weight_raw)
        max_weight = parseFloat(max_weight_raw)

        if (isNaN(min_weight) || isNaN(max_weight)) {
            return { error: 'Valores de peso inválidos.' }
        }

        if (min_weight > max_weight) {
            return { error: 'Peso inicial deve ser menor ou igual ao peso final.' }
        }
    } else {
        // Apenas um preenchido = erro
        return { error: 'Preencha ambos os campos de peso ou deixe ambos vazios.' }
    }

    try {
        const supabase = await createClient()

        // Buscar nomes para manter compatibilidade legada (dual-write)
        const [{ data: beltData }, { data: ageData }] = await Promise.all([
            supabase.from('belts').select('name').eq('id', belt_id).single(),
            supabase.from('age_groups').select('name').eq('id', age_group_id).single()
        ])

        const { error } = await supabase
            .from('categories')
            .update({
                belt_id,
                age_group_id,
                belt: beltData?.name || '',
                age_group: ageData?.name || '',
                min_weight,
                max_weight,
                registration_fee
            })
            .eq('id', id)
            .eq('organizer_id', user.id) // RLS backup

        if (error) {
            console.error('Erro ao atualizar categoria:', error)
            return { error: 'Erro ao atualizar categoria.' }
        }

        revalidatePath('/painel/organizador/categorias')
        return { success: true, message: 'Categoria atualizada com sucesso!' }
    } catch (error) {
        console.error(error)
        return { error: 'Erro ao atualizar categoria.' }
    }
}

export async function deleteCategoryAction(id: string) {
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') return { error: 'Não autorizado.' }

    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id)
            .eq('organizer_id', user.id) // RLS backup

        if (error) {
            console.error('Erro ao excluir categoria:', error)
            return { error: 'Erro ao excluir categoria.' }
        }

        revalidatePath('/painel/organizador/categorias')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: 'Erro ao excluir categoria.' }
    }
}

export async function deleteSelectedCategoriesAction(ids: string[]): Promise<ActionState> {
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') return { error: 'Não autorizado.' }

    if (!ids || ids.length === 0) {
        return { error: 'Nenhuma categoria selecionada.' }
    }

    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('categories')
            .delete()
            .in('id', ids)
            .eq('organizer_id', user.id)

        if (error) {
            console.error('Erro ao excluir categorias em lote:', error)
            return { error: 'Erro ao excluir as categorias selecionadas.' }
        }

        revalidatePath('/painel/organizador/categorias')
        return { success: true, message: `${ids.length} categorias excluídas com sucesso.` }
    } catch (error) {
        console.error(error)
        return { error: 'Erro ao processar exclusão em lote.' }
    }
}

export async function updateAllCategoriesFeeAction(newFee: number): Promise<ActionState> {
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') return { error: 'Não autorizado.' }

    if (newFee < 0) {
        return { error: 'O preço não pode ser negativo.' }
    }

    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('categories')
            .update({ registration_fee: newFee })
            .eq('organizer_id', user.id)

        if (error) {
            console.error('Erro ao atualizar preços em lote:', error)
            return { error: 'Erro ao atualizar os preços de todas as categorias.' }
        }

        revalidatePath('/painel/organizador/categorias')
        return { success: true, message: `Preço de todas as categorias atualizado para R$ ${newFee.toFixed(2)}.` }
    } catch (error) {
        console.error(error)
        return { error: 'Erro ao processar atualização em massa.' }
    }
}

export async function deleteAllCategoriesAction(): Promise<ActionState> {
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') return { error: 'Não autorizado.' }

    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('organizer_id', user.id)

        if (error) {
            console.error('Erro ao excluir todas as categorias:', error)
            return { error: 'Erro ao excluir todas as categorias. Verifique se existem categorias sendo usadas em eventos ativos.' }
        }

        revalidatePath('/painel/organizador/categorias')
        return { success: true, message: 'Todas as categorias foram excluídas com sucesso.' }
    } catch (error) {
        console.error(error)
        return { error: 'Erro ao processar exclusão em massa.' }
    }
}

export async function auditCategoriesAction() {
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') return { error: 'Não autorizado.' }

    try {
        const supabase = await createClient()

        const [
            { data: categories },
            { data: belts },
            { data: ageGroups }
        ] = await Promise.all([
            supabase.from('categories').select('*').eq('organizer_id', user.id),
            supabase.from('belts').select('id, name').order('name'),
            supabase.from('age_groups').select('id, name').order('name')
        ])

        if (!categories || !belts || !ageGroups) {
            return { error: 'Falha ao buscar dados para auditoria.' }
        }

        const report = performCategoryAudit(categories, belts, ageGroups)

        return { success: true, report }
    } catch (error) {
        console.error('Erro na auditoria:', error)
        return { error: 'Erro ao processar auditoria.' }
    }
}
