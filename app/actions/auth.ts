'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { translateAuthError } from '@/lib/utils'

type ActionState = {
    error?: string
    success?: boolean
}

export async function registerAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const name = formData.get('name') as string
    const cpf = formData.get('cpf') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const returnEvent = formData.get('returnEvent') as string
    const next = formData.get('next') as string

    // Novos campos do perfil de atleta
    const phone = formData.get('phone') as string
    const birthDate = formData.get('birthDate') as string
    const weight = formData.get('weight') as string
    const gender = formData.get('gender') as string

    // SEGURANÇA: Role fixo como 'atleta' para cadastro público
    const role = 'atleta'

    const normalizedEmail = email.trim().toLowerCase()

    if (!name || !cpf || !email || !password) {
        return { error: 'Preencha todos os campos.' }
    }

    // Validar formato do CPF (apenas números)
    const cpfNumbers = cpf.replace(/\D/g, '')
    if (cpfNumbers.length !== 11) {
        return { error: 'CPF inválido. Digite 11 dígitos.' }
    }

    // Validação extra de segurança (redundância do frontend)
    const { available: isCpfAvailable } = await checkCpfAvailableAction(cpfNumbers)
    if (!isCpfAvailable) return { error: 'Este CPF já está em uso.' }

    const { available: isEmailAvailable } = await checkEmailAvailableAction(normalizedEmail)
    if (!isEmailAvailable) return { error: 'Este e-mail já está em uso.' }

    try {
        const supabase = await createClient()
        const adminClient = createAdminClient()

        // 1. Criar usuário no Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
                data: {
                    name,
                    role
                }
            }
        })

        if (authError) {
            console.error('Erro no signup:', authError)
            return { error: translateAuthError(authError.message) }
        }

        if (!authData.user) {
            return { error: 'Erro ao criar usuário.' }
        }

        const userId = authData.user.id

        // 2. Criar perfil na tabela profiles (usando admin para bypass RLS)
        const { error: profileError } = await adminClient
            .from('profiles')
            .insert({
                id: userId,
                name,
                email: normalizedEmail,
                role,
                cpf: cpfNumbers,
                phone: phone ? phone.replace(/\D/g, '') : null
            })

        if (profileError) {
            console.error('Erro ao criar perfil:', profileError)
            // Não bloqueia - o trigger pode ser implementado depois
        }

        // 3. Criar perfil estendido do atleta
        if (phone || birthDate || weight || gender) {
            const { error: athleteProfileError } = await adminClient
                .from('athlete_profiles')
                .insert({
                    user_id: userId,
                    phone: phone ? phone.replace(/\D/g, '') : null,
                    birth_date: birthDate || null,
                    weight: weight ? parseFloat(weight) : null,
                    gender: gender || null
                })

            if (athleteProfileError) {
                console.error('Erro ao criar perfil do atleta:', athleteProfileError)
            }
        }

        // 4. Se tem returnEvent, registrar interesse
        if (returnEvent) {
            const eventId = returnEvent
            await adminClient
                .from('athlete_event_interests')
                .insert({
                    athlete_user_id: userId,
                    event_id: eventId
                })
                .select()
        }

        // Se tem next, redirecionar direto
        const next = formData.get('next') as string
        if (next) redirect(next)

        return { success: true }

    } catch (error: any) {
        if (error?.digest?.startsWith('NEXT_REDIRECT')) {
            throw error
        }
        console.error('Erro no registro:', error)
        return { error: 'Erro ao criar conta. Tente novamente.' }
    }
}

export async function loginAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const returnEvent = formData.get('returnEvent') as string
    const next = formData.get('next') as string

    if (!email || !password) {
        return { error: 'Preencha todos os campos.' }
    }

    try {
        const supabase = await createClient()

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (error) {
            console.error('Erro no login:', error)
            return { error: translateAuthError(error.message) }
        }

        if (!data.user) {
            return { error: 'Erro ao processar login.' }
        }

        // Buscar role do perfil
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single()

        const role = profile?.role || 'atleta'

        // Se tem returnEvent e é atleta, registrar interesse
        if (returnEvent && role === 'atleta') {
            await supabase
                .from('athlete_event_interests')
                .upsert({
                    athlete_user_id: data.user.id,
                    event_id: returnEvent
                }, { onConflict: 'athlete_user_id,event_id' })
        }

        // Redirecionamento Prioritário (next)
        if (next) redirect(next)

        // Redirecionamento por Papel
        if (role === 'super_admin') redirect('/painel/super-admin')
        if (role === 'organizador') redirect('/painel/organizador')
        if (role === 'atleta') redirect('/painel/atleta')

        // Fallback para atletas se nada foi definido
        redirect('/painel/atleta')

        return { success: true }

    } catch (error: any) {
        if (error?.digest?.startsWith('NEXT_REDIRECT')) {
            throw error
        }
        console.error('Erro no login:', error)
        return { error: 'Erro ao processar login.' }
    }
}

export async function logoutAction() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}

export async function requestPasswordResetAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const email = formData.get('email') as string

    if (!email) {
        return { error: 'Informe seu e-mail.' }
    }

    try {
        const supabase = await createClient()

        // Montar URL de redirecionamento para /auth/reset-password
        // Priorizar NEXT_PUBLIC_SITE_URL se disponível
        let siteUrl = process.env.NEXT_PUBLIC_SITE_URL

        if (!siteUrl) {
            // Em App Router, se não tiver env, buscamos via origin da request se possível, 
            // mas em Server Actions o origin confiável vem do cabeçalho Host
            const { headers } = await import('next/headers')
            const host = (await headers()).get('host')
            const protocol = host?.includes('localhost') ? 'http' : 'https'
            siteUrl = `${protocol}://${host}`
        }

        const redirectTo = `${siteUrl}/auth/callback?next=/auth/reset-password`

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo,
        })

        if (error) {
            console.error('Erro ao solicitar reset:', error)
            return { error: translateAuthError(error.message) }
        }

        return { success: true }

    } catch (error) {
        console.error('Erro inesperado no reset:', error)
        return { error: 'Ocorreu um erro inesperado. Tente novamente.' }
    }
}

export async function resetPasswordAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (!password || !confirmPassword) {
        return { error: 'Preencha todos os campos.' }
    }

    if (password.length < 8) {
        return { error: 'A senha deve ter pelo menos 8 caracteres.' }
    }

    if (password !== confirmPassword) {
        return { error: 'As senhas não coincidem.' }
    }

    try {
        const supabase = await createClient()

        const { error } = await supabase.auth.updateUser({
            password: password,
        })

        if (error) {
            console.error('Erro ao atualizar senha:', error)
            return { error: translateAuthError(error.message) }
        }

        return { success: true }

    } catch (error) {
        console.error('Erro inesperado ao atualizar senha:', error)
        return { error: 'Ocorreu um erro inesperado. Tente novamente.' }
    }
}

export async function checkCpfAvailableAction(cpf: string): Promise<{ available: boolean }> {
    const cpfNumbers = cpf.replace(/\D/g, '')
    if (cpfNumbers.length !== 11) return { available: false }

    try {
        const adminClient = createAdminClient()
        const { data, error } = await adminClient
            .from('profiles')
            .select('id')
            .eq('cpf', cpfNumbers)
            .maybeSingle()

        if (error) {
            console.error('Erro ao checar CPF:', error)
            return { available: false }
        }

        return { available: !data }
    } catch (error) {
        console.error(error)
        return { available: false }
    }
}

export async function checkEmailAvailableAction(email: string): Promise<{ available: boolean }> {
    const emailLower = email.trim().toLowerCase()
    if (!emailLower || !emailLower.includes('@')) return { available: false }

    try {
        const adminClient = createAdminClient()
        const { data, error } = await adminClient
            .from('profiles')
            .select('id')
            .eq('email', emailLower)
            .maybeSingle()

        if (error) {
            console.error('Erro ao checar e-mail:', error)
            return { available: false }
        }

        return { available: !data }
    } catch (error) {
        console.error(error)
        return { available: false }
    }
}
