'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './user'

export type ActionState = {
    error?: string
    success?: boolean
    message?: string
}

/**
 * Busca os dados de perfil do usuário logado (independente de role)
 */
export async function getProfileDataAction() {
    const user = await getCurrentUser()
    if (!user) return null

    try {
        const supabase = await createClient()

        const { data } = await supabase
            .from('profiles')
            .select('name, email, cpf, phone, role')
            .eq('id', user.id)
            .single()

        return data
    } catch (error) {
        console.error('Erro ao buscar dados do perfil:', error)
        return null
    }
}

/**
 * Atualiza o perfil do usuário (nome e telefone)
 */
export async function updateProfileAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const user = await getCurrentUser()
    if (!user) return { error: 'Não autenticado' }

    const name = formData.get('name') as string
    const phone = formData.get('phone') as string

    if (!name || name.length < 3) {
        return { error: 'O nome deve ter pelo menos 3 caracteres.' }
    }

    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('profiles')
            .update({
                name,
                phone: phone || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id)

        if (error) {
            console.error('Erro ao atualizar perfil:', error)
            return { error: 'Erro ao salvar alterações. Tente novamente.' }
        }

        // Revalidar caminhos dependentes do role
        const basePath = user.role === 'super_admin' ? '/painel/super-admin' :
            user.role === 'organizador' ? '/painel/organizador' :
                '/painel/atleta'

        revalidatePath(`${basePath}/meu-perfil`)
        revalidatePath(basePath)

        return { success: true, message: 'Perfil atualizado com sucesso!' }
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error)
        return { error: 'Erro ao salvar alterações. Tente novamente.' }
    }
}

/**
 * Altera a senha do usuário logado
 */
export async function changePasswordAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const user = await getCurrentUser()
    if (!user) return { error: 'Não autenticado' }

    const currentPassword = formData.get('currentPassword') as string
    const newPassword = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (!currentPassword || !newPassword || !confirmPassword) {
        return { error: 'Preencha todos os campos.' }
    }

    if (newPassword !== confirmPassword) {
        return { error: 'A nova senha e a confirmação não coincidem.' }
    }

    if (newPassword.length < 8) {
        return { error: 'A nova senha deve ter pelo menos 8 caracteres.' }
    }

    try {
        const supabase = await createClient()

        // Verificar senha atual tentando fazer login
        const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', user.id)
            .single()

        if (!profile?.email) {
            return { error: 'Erro ao verificar usuário.' }
        }

        // Tentar login com senha atual para validá-la
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: profile.email,
            password: currentPassword
        })

        if (signInError) {
            return { error: 'A senha atual está incorreta.' }
        }

        // Atualizar senha
        const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword
        })

        if (updateError) {
            console.error('Erro ao alterar senha:', updateError)
            return { error: 'Erro ao processar alteração. Tente novamente.' }
        }

        return { success: true, message: 'Senha alterada com sucesso!' }
    } catch (error) {
        console.error('Erro ao alterar senha:', error)
        return { error: 'Erro ao processar alteração. Tente novamente.' }
    }
}
