'use server'

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/app/actions/user"

type ActionState = {
    success?: boolean
    message?: string
    error?: string
}

export async function createBeltAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const user = await getCurrentUser()
    if (!user || user.role !== 'super_admin') return { error: 'Não autorizado.' }

    const name = formData.get('name') as string

    if (!name) {
        return { error: 'O nome da faixa é obrigatório.' }
    }

    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('belts')
            .insert({ name })

        if (error) {
            if (error.code === '23505') return { error: 'Esta faixa já está cadastrada.' }
            console.error('Erro ao criar faixa:', error)
            return { error: 'Erro ao criar faixa.' }
        }

        revalidatePath('/painel/super-admin/faixas')
        return { success: true, message: 'Faixa criada com sucesso!' }
    } catch (error) {
        console.error(error)
        return { error: 'Erro ao criar faixa.' }
    }
}

export async function updateBeltAction(id: string, prevState: ActionState, formData: FormData): Promise<ActionState> {
    const user = await getCurrentUser()
    if (!user || user.role !== 'super_admin') return { error: 'Não autorizado.' }

    const name = formData.get('name') as string

    if (!name) {
        return { error: 'O nome da faixa é obrigatório.' }
    }

    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('belts')
            .update({ name })
            .eq('id', id)

        if (error) {
            if (error.code === '23505') return { error: 'Esta faixa já está cadastrada.' }
            console.error('Erro ao atualizar faixa:', error)
            return { error: 'Erro ao atualizar faixa.' }
        }

        revalidatePath('/painel/super-admin/faixas')
        return { success: true, message: 'Faixa atualizada com sucesso!' }
    } catch (error) {
        console.error(error)
        return { error: 'Erro ao atualizar faixa.' }
    }
}

export async function deleteBeltAction(id: string): Promise<ActionState> {
    const user = await getCurrentUser()
    if (!user || user.role !== 'super_admin') return { error: 'Não autorizado.' }

    try {
        const supabase = await createClient()

        // Verificar se está em uso
        const { count, error: checkError } = await supabase
            .from('categories')
            .select('*', { count: 'exact', head: true })
            .eq('belt_id', id)

        if (count && count > 0) {
            return { error: 'Esta faixa não pode ser excluída pois está sendo usada em categorias.' }
        }

        const { error } = await supabase
            .from('belts')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Erro ao excluir faixa:', error)
            return { error: 'Erro ao excluir faixa.' }
        }

        revalidatePath('/painel/super-admin/faixas')
        return { success: true, message: 'Faixa excluída com sucesso!' }
    } catch (error) {
        console.error(error)
        return { error: 'Erro ao excluir faixa.' }
    }
}

export async function getBeltsAction() {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('belts')
            .select('*')
            .order('name')

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Erro ao buscar faixas:', error)
        return []
    }
}
