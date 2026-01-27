'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './user'

export type KnowledgeEntry = {
    id: string // Alterado para UUID
    label: string | null
    content: string
    created_at: string
    updated_at: string | null
}

export type ActionState = {
    success?: boolean
    message?: string
    error?: string
}

async function validateSuperAdmin() {
    const user = await getCurrentUser()
    if (!user || user.role !== 'super_admin') {
        throw new Error('Não autorizado. Apenas super admins podem acessar esta função.')
    }
    return user
}

export async function listKnowledgeEntriesAction(): Promise<KnowledgeEntry[]> {
    try {
        await validateSuperAdmin()
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('knowledge_entries')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Erro ao listar entradas da KB:', error)
            return []
        }

        return data as KnowledgeEntry[]
    } catch (error) {
        console.error('Erro ao listar entradas da KB:', error)
        return []
    }
}

export async function createKnowledgeEntryAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
    try {
        await validateSuperAdmin()
        const supabase = await createClient()

        const label = formData.get('label') as string
        const content = formData.get('content') as string

        if (!content) {
            return { error: 'O conteúdo é obrigatório.' }
        }

        const { error } = await supabase
            .from('knowledge_entries')
            .insert({
                label: label || null,
                content
            })

        if (error) {
            console.error('Erro ao criar entrada na KB:', error)
            return { error: 'Erro ao salvar no banco de dados.' }
        }

        revalidatePath('/painel/super-admin/knowledge-base')
        return { success: true, message: 'Entrada criada com sucesso!' }
    } catch (error: any) {
        console.error('Erro ao criar entrada na KB:', error)
        return { error: error.message || 'Erro ao salvar entrada.' }
    }
}

export async function updateKnowledgeEntryAction(id: string, prevState: ActionState, formData: FormData): Promise<ActionState> {
    try {
        await validateSuperAdmin()
        const supabase = await createClient()

        const label = formData.get('label') as string
        const content = formData.get('content') as string

        if (!content) {
            return { error: 'O conteúdo é obrigatório.' }
        }

        const { error } = await supabase
            .from('knowledge_entries')
            .update({
                label: label || null,
                content,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)

        if (error) {
            console.error('Erro ao atualizar entrada na KB:', error)
            return { error: 'Erro ao atualizar no banco de dados.' }
        }

        revalidatePath('/painel/super-admin/knowledge-base')
        return { success: true, message: 'Entrada atualizada com sucesso!' }
    } catch (error: any) {
        console.error('Erro ao atualizar entrada na KB:', error)
        return { error: error.message || 'Erro ao atualizar entrada.' }
    }
}

export async function deleteKnowledgeEntryAction(id: string): Promise<ActionState> {
    try {
        await validateSuperAdmin()
        const supabase = await createClient()

        const { error } = await supabase
            .from('knowledge_entries')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Erro ao excluir entrada na KB:', error)
            return { error: 'Erro ao remover do banco de dados.' }
        }

        revalidatePath('/painel/super-admin/knowledge-base')
        return { success: true, message: 'Entrada excluída com sucesso!' }
    } catch (error: any) {
        console.error('Erro ao excluir entrada na KB:', error)
        return { error: error.message || 'Erro ao excluir entrada.' }
    }
}
