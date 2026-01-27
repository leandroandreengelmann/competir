'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './user'

export type ProfileActionState = {
    error?: string
    success?: boolean
    message?: string
}

/**
 * Busca os dados de perfil do atleta logado
 */
export async function getAthleteProfileDataAction() {
    const user = await getCurrentUser()
    if (!user) return null

    try {
        const supabase = await createClient()

        // Buscar dados do perfil principal
        const { data: profile } = await supabase
            .from('profiles')
            .select('name, email, cpf')
            .eq('id', user.id)
            .single()

        // Buscar dados do perfil de atleta
        const { data: athleteProfile } = await supabase
            .from('athlete_profiles')
            .select('phone, birth_date, weight, gender')
            .eq('user_id', user.id)
            .single()

        return {
            name: profile?.name || '',
            email: profile?.email || '',
            cpf: profile?.cpf || '',
            phone: athleteProfile?.phone || '',
            birth_date: athleteProfile?.birth_date || '',
            weight: athleteProfile?.weight || null,
            gender: athleteProfile?.gender || ''
        }
    } catch (error) {
        console.error('Erro ao buscar dados do perfil:', error)
        return null
    }
}

/**
 * Atualiza o perfil do atleta (nome e dados específicos)
 */
export async function updateMyProfileAction(prevState: ProfileActionState, formData: FormData): Promise<ProfileActionState> {
    const user = await getCurrentUser()
    if (!user) return { error: 'Não autenticado' }

    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const birthDate = formData.get('birthDate') as string
    const weight = formData.get('weight') as string
    const gender = formData.get('gender') as string

    if (!name || name.length < 3) {
        return { error: 'O nome deve ter pelo menos 3 caracteres.' }
    }

    try {
        const supabase = await createClient()

        // 1. Atualiza nome na tabela profiles
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ name, updated_at: new Date().toISOString() })
            .eq('id', user.id)

        if (profileError) {
            console.error('Erro ao atualizar profile:', profileError)
            return { error: 'Erro ao salvar alterações.' }
        }

        // 2. Upsert dados adicionais do atleta
        const { error: athleteError } = await supabase
            .from('athlete_profiles')
            .upsert({
                user_id: user.id,
                phone: phone || null,
                birth_date: birthDate || null,
                weight: weight ? parseFloat(weight) : null,
                gender: gender || null,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' })

        if (athleteError) {
            console.error('Erro ao atualizar athlete_profiles:', athleteError)
            // Não falhar - o principal foi atualizado
        }

        revalidatePath('/painel/atleta/meu-perfil')
        revalidatePath('/painel/atleta')
        return { success: true, message: 'Perfil atualizado com sucesso!' }
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error)
        return { error: 'Erro ao salvar alterações. Tente novamente.' }
    }
}

/**
 * Altera a senha do atleta logado
 */
export async function changeMyPasswordAction(prevState: ProfileActionState, formData: FormData): Promise<ProfileActionState> {
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

        // Buscar email do usuário
        const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', user.id)
            .single()

        if (!profile?.email) {
            return { error: 'Erro ao verificar usuário.' }
        }

        // Verificar senha atual tentando fazer login
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
