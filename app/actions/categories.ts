'use server'

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/app/actions/user"

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
    const min_weight = parseFloat(formData.get('min_weight') as string)
    const max_weight = parseFloat(formData.get('max_weight') as string)
    const registration_fee = parseFloat(formData.get('registration_fee') as string) || 0

    if (!belt_id || !age_group_id || isNaN(min_weight) || isNaN(max_weight)) {
        return { error: 'Preencha todos os campos corretamente.' }
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
    const min_weight = parseFloat(formData.get('min_weight') as string)
    const max_weight = parseFloat(formData.get('max_weight') as string)
    const registration_fee = parseFloat(formData.get('registration_fee') as string) || 0

    if (!belt_id || !age_group_id || isNaN(min_weight) || isNaN(max_weight)) {
        return { error: 'Preencha todos os campos corretamente.' }
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
