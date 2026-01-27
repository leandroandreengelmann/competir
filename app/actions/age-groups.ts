'use server'

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/app/actions/user"

type ActionState = {
    success?: boolean
    message?: string
    error?: string
}

export async function createAgeGroupAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const user = await getCurrentUser()
    if (!user || user.role !== 'super_admin') return { error: 'Não autorizado.' }

    const name = formData.get('name') as string

    if (!name) {
        return { error: 'O nome da faixa etária é obrigatório.' }
    }

    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('age_groups')
            .insert({ name })

        if (error) {
            if (error.code === '23505') return { error: 'Esta faixa etária já está cadastrada.' }
            console.error('Erro ao criar faixa etária:', error)
            return { error: 'Erro ao criar faixa etária.' }
        }

        revalidatePath('/painel/super-admin/faixas-etarias')
        return { success: true, message: 'Faixa etária criada com sucesso!' }
    } catch (error) {
        console.error(error)
        return { error: 'Erro ao criar faixa etária.' }
    }
}

export async function updateAgeGroupAction(id: string, prevState: ActionState, formData: FormData): Promise<ActionState> {
    const user = await getCurrentUser()
    if (!user || user.role !== 'super_admin') return { error: 'Não autorizado.' }

    const name = formData.get('name') as string

    if (!name) {
        return { error: 'O nome da faixa etária é obrigatório.' }
    }

    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('age_groups')
            .update({ name })
            .eq('id', id)

        if (error) {
            if (error.code === '23505') return { error: 'Esta faixa etária já está cadastrada.' }
            console.error('Erro ao atualizar faixa etária:', error)
            return { error: 'Erro ao atualizar faixa etária.' }
        }

        revalidatePath('/painel/super-admin/faixas-etarias')
        return { success: true, message: 'Faixa etária atualizada com sucesso!' }
    } catch (error) {
        console.error(error)
        return { error: 'Erro ao atualizar faixa etária.' }
    }
}

export async function deleteAgeGroupAction(id: string): Promise<ActionState> {
    const user = await getCurrentUser()
    if (!user || user.role !== 'super_admin') return { error: 'Não autorizado.' }

    try {
        const supabase = await createClient()

        // Verificar se está em uso
        const { count, error: checkError } = await supabase
            .from('categories')
            .select('*', { count: 'exact', head: true })
            .eq('age_group_id', id)

        if (count && count > 0) {
            return { error: 'Esta faixa etária não pode ser excluída pois está sendo usada em categorias.' }
        }

        const { error } = await supabase
            .from('age_groups')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Erro ao excluir faixa etária:', error)
            return { error: 'Erro ao excluir faixa etária.' }
        }

        revalidatePath('/painel/super-admin/faixas-etarias')
        return { success: true, message: 'Faixa etária excluída com sucesso!' }
    } catch (error) {
        console.error(error)
        return { error: 'Erro ao excluir faixa etária.' }
    }
}

export async function getAgeGroupsAction() {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('age_groups')
            .select('*')
            .order('name')

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Erro ao buscar faixas etárias:', error)
        return []
    }
}
