'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/app/actions/user'
import { encryptAsaasKey } from '@/lib/crypto/asaas-key'

type ActionState = {
    success?: boolean
    message?: string
    error?: string
}

type AsaasCredentials = {
    hasApiKey: boolean
    apiKeyLast4: string | null
    environment: 'sandbox' | 'production'
    is_active: boolean
}

/**
 * Busca as credenciais Asaas do organizador logado
 * NUNCA retorna a API key completa, apenas flag de existência e últimos 4 caracteres
 */
export async function getOrganizerAsaasCredentialsAction(): Promise<AsaasCredentials | null> {
    const user = await getCurrentUser()

    if (!user || user.role !== 'organizador') {
        throw new Error('Acesso negado. Apenas organizadores podem acessar credenciais.')
    }

    try {
        const supabase = await createClient()

        const { data: credentials, error } = await supabase
            .from('organizer_asaas_credentials')
            .select('asaas_api_key_encrypted, asaas_api_key_last4, environment, is_active')
            .eq('organizer_user_id', user.id)
            .single()

        if (error || !credentials) {
            return null
        }

        return {
            hasApiKey: !!credentials.asaas_api_key_encrypted,
            apiKeyLast4: credentials.asaas_api_key_last4,
            environment: credentials.environment as 'sandbox' | 'production',
            is_active: credentials.is_active
        }
    } catch (error) {
        console.error('Erro ao buscar credenciais Asaas:', error)
        throw new Error('Erro ao buscar credenciais.')
    }
}

/**
 * Salva/atualiza as credenciais Asaas do organizador
 * Usa UPSERT para criar ou atualizar
 * Se api_key vier vazia e já existir chave, mantém a chave atual
 */
export async function saveOrganizerAsaasCredentialsAction(
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const user = await getCurrentUser()

    if (!user || user.role !== 'organizador') {
        return { error: 'Acesso negado. Apenas organizadores podem configurar credenciais.' }
    }

    const apiKey = (formData.get('api_key') as string || '').trim()
    const environment = formData.get('environment') as string
    const isActive = formData.get('is_active') === 'true' || formData.get('is_active') === '1'

    // Validação de environment
    if (!environment || !['sandbox', 'production'].includes(environment)) {
        return { error: 'Ambiente inválido. Escolha Sandbox ou Produção.' }
    }

    try {
        const supabase = await createClient()

        // 1. Preparar dados
        const last4 = apiKey.length >= 4 ? apiKey.slice(-4) : null

        // P0: Criptografar a chave apenas no servidor
        const encryptedKey = apiKey ? encryptAsaasKey(apiKey) : null

        // 2. Verificar se já existe credencial para decidir entre insert/update
        const { data: existing } = await supabase
            .from('organizer_asaas_credentials')
            .select('id')
            .eq('organizer_user_id', user.id)
            .maybeSingle()

        if (!apiKey) {
            // Se já existe e veio vazio, apenas atualizar ambiente/status sem mexer na chave
            if (existing) {
                const { error } = await supabase
                    .from('organizer_asaas_credentials')
                    .update({
                        environment,
                        is_active: isActive,
                        updated_at: new Date().toISOString()
                    })
                    .eq('organizer_user_id', user.id)

                if (error) throw error

                revalidatePath('/painel/organizador/pagamentos')
                return { success: true, message: 'Configurações atualizadas com sucesso!' }
            } else {
                return { error: 'API Key é obrigatória na primeira configuração.' }
            }
        }

        // 3. Salvar nova credencial (UPSERT)
        // NOTA: asaas_api_key (legado) NÃO é enviado aqui para encerrar escrita plain-text
        const { error } = await supabase
            .from('organizer_asaas_credentials')
            .upsert({
                organizer_user_id: user.id,
                asaas_api_key_encrypted: encryptedKey,
                asaas_api_key_last4: last4,
                environment,
                is_active: isActive,
                updated_at: new Date().toISOString()
            }, { onConflict: 'organizer_user_id' })

        if (error) throw error

        revalidatePath('/painel/organizador/pagamentos')

        return {
            success: true,
            message: existing
                ? 'Credenciais atualizadas com sucesso!'
                : 'Credenciais cadastradas com sucesso!'
        }
    } catch (error) {
        console.error('Erro ao salvar credenciais Asaas:', error)
        return { error: 'Erro ao salvar credenciais. Tente novamente.' }
    }
}
