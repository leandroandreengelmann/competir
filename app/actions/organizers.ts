'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/app/actions/user'

type ActionState = {
    success?: boolean
    message?: string
    error?: string
}

type Organizer = {
    id: string
    name: string
    email: string
    role: string
}

/**
 * Lista todos os organizadores do sistema
 * Apenas super_admin pode executar
 */
export async function listOrganizersAction(): Promise<Organizer[]> {
    const user = await getCurrentUser()

    if (!user || user.role !== 'super_admin') {
        return []
    }

    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('profiles')
            .select('id, name, email, role')
            .eq('role', 'organizador')
            .order('name')

        if (error) {
            console.error('Erro ao listar organizadores:', error)
            return []
        }

        return (data || []) as Organizer[]
    } catch (error) {
        console.error('Erro ao listar organizadores:', error)
        return []
    }
}

/**
 * Cria um novo organizador
 * Apenas super_admin pode executar
 */
export async function createOrganizerAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const user = await getCurrentUser()

    if (!user || user.role !== 'super_admin') {
        return { error: 'Acesso negado. Apenas Super Admins podem criar organizadores.' }
    }

    const name = formData.get('nome') as string
    const email = formData.get('email') as string
    const password = formData.get('senha') as string

    if (!name || !email || !password) {
        return { error: 'Preencha todos os campos obrigatórios.' }
    }

    if (password.length < 6) {
        return { error: 'A senha deve ter no mínimo 6 caracteres.' }
    }

    try {
        const adminClient = createAdminClient()

        // Verificar se email já existe
        const { data: existingProfile } = await adminClient
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single()

        if (existingProfile) {
            return { error: 'Este e-mail já está cadastrado no sistema.' }
        }

        // Criar usuário no Supabase Auth usando admin API
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirma email
            user_metadata: {
                name,
                role: 'organizador'
            }
        })

        if (authError) {
            console.error('Erro ao criar usuário:', authError)
            if (authError.message.includes('already')) {
                return { error: 'Este e-mail já está cadastrado no sistema.' }
            }
            return { error: 'Erro ao criar usuário. Tente novamente.' }
        }

        if (!authData.user) {
            return { error: 'Erro ao criar usuário.' }
        }

        // Criar perfil
        const { error: profileError } = await adminClient
            .from('profiles')
            .insert({
                id: authData.user.id,
                name,
                email,
                role: 'organizador'
            })

        if (profileError) {
            console.error('Erro ao criar perfil:', profileError)
            // Tentar deletar o usuário auth criado
            await adminClient.auth.admin.deleteUser(authData.user.id)
            return { error: 'Erro ao criar perfil do organizador.' }
        }

        revalidatePath('/painel/super-admin/organizadores')

        return { success: true, message: 'Organizador cadastrado com sucesso!' }
    } catch (error: any) {
        console.error('Erro ao criar organizador:', error)
        return { error: 'Erro ao cadastrar organizador. Tente novamente.' }
    }
}

/**
 * Atualiza um organizador existente
 * Apenas super_admin pode executar
 */
export async function updateOrganizerAction(
    organizerId: string,
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const user = await getCurrentUser()

    if (!user || user.role !== 'super_admin') {
        return { error: 'Acesso negado. Apenas Super Admins podem editar organizadores.' }
    }

    const name = formData.get('nome') as string
    const email = formData.get('email') as string
    const password = formData.get('senha') as string

    if (!name || !email) {
        return { error: 'Preencha todos os campos obrigatórios.' }
    }

    if (password && password.length < 6) {
        return { error: 'A nova senha deve ter no mínimo 6 caracteres.' }
    }

    try {
        const adminClient = createAdminClient()

        // Verificar se o organizador existe
        const { data: organizer } = await adminClient
            .from('profiles')
            .select('id, role')
            .eq('id', organizerId)
            .single()

        if (!organizer) {
            return { error: 'Organizador não encontrado.' }
        }

        if (organizer.role !== 'organizador') {
            return { error: 'Este usuário não é um organizador.' }
        }

        // Verificar se email já existe (exceto se for o mesmo)
        const { data: existingUser } = await adminClient
            .from('profiles')
            .select('id')
            .eq('email', email)
            .neq('id', organizerId)
            .single()

        if (existingUser) {
            return { error: 'Este e-mail já está sendo usado por outro usuário.' }
        }

        // Atualizar perfil
        const { error: profileError } = await adminClient
            .from('profiles')
            .update({ name, email })
            .eq('id', organizerId)

        if (profileError) {
            console.error('Erro ao atualizar perfil:', profileError)
            return { error: 'Erro ao atualizar organizador.' }
        }

        // Atualizar auth user (email e senha se fornecida)
        const updates: any = { email }
        if (password) {
            updates.password = password
        }

        const { error: authError } = await adminClient.auth.admin.updateUserById(
            organizerId,
            updates
        )

        if (authError) {
            console.error('Erro ao atualizar auth:', authError)
            // Não falhar se só o perfil foi atualizado
        }

        revalidatePath('/painel/super-admin/organizadores')

        return { success: true, message: 'Organizador atualizado com sucesso!' }
    } catch (error: any) {
        console.error('Erro ao atualizar organizador:', error)
        return { error: 'Erro ao atualizar organizador. Tente novamente.' }
    }
}
