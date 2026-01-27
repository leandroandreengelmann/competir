'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from './user'
import { AsaasClient } from '@/lib/asaas-client'
import { decryptAsaasKey } from '@/lib/crypto/asaas-key'

type ActionState = {
    success?: boolean
    error?: string
    payment?: {
        id: string
        value_cents: number
        pix_qr_code: string
        pix_copy_paste: string
        expires_at: string
    }
}

// Criar cobrança Pix via Asaas para uma inscrição
export async function createPixChargeAction(registrationId: string): Promise<ActionState> {
    const user = await getCurrentUser()

    if (!user || user.role !== 'atleta') {
        return { error: 'Você precisa estar logado como atleta.' }
    }

    try {
        const supabase = await createClient()
        const adminClient = createAdminClient()

        // Buscar inscrição
        const { data: registration } = await supabase
            .from('registrations')
            .select(`
                id,
                athlete_user_id,
                event_id,
                status,
                amount_cents,
                events(organizer_id)
            `)
            .eq('id', registrationId)
            .eq('athlete_user_id', user.id)
            .single()

        if (!registration) {
            return { error: 'Inscrição não encontrada.' }
        }

        if (registration.status === 'paid') {
            return { error: 'Esta inscrição já está paga.' }
        }

        if (registration.status === 'cancelled') {
            return { error: 'Esta inscrição foi cancelada.' }
        }

        const organizerId = (registration.events as any)?.organizer_id
        if (!organizerId) {
            return { error: 'Evento não encontrado.' }
        }

        // Verificar se já existe cobrança
        const { data: existingPayment } = await supabase
            .from('asaas_payments')
            .select('*')
            .eq('registration_id', registrationId)
            .single()

        if (existingPayment) {
            // Retornar cobrança existente
            return {
                success: true,
                payment: {
                    id: existingPayment.asaas_payment_id,
                    value_cents: existingPayment.value_cents,
                    pix_qr_code: existingPayment.pix_qr_code,
                    pix_copy_paste: existingPayment.pix_copy_paste,
                    expires_at: existingPayment.expires_at
                }
            }
        }

        // Buscar credenciais Asaas do organizador
        const { data: credentials } = await adminClient
            .from('organizer_asaas_credentials')
            .select('asaas_api_key, asaas_api_key_encrypted, environment, is_active')
            .eq('organizer_user_id', organizerId)
            .single()

        if (!credentials || !credentials.is_active) {
            return { error: 'Organizador não possui pagamento configurado.' }
        }

        // Determinar chave (P0: Prioridade para encrypted)
        let usableApiKey = ''
        if (credentials.asaas_api_key_encrypted) {
            try {
                usableApiKey = decryptAsaasKey(credentials.asaas_api_key_encrypted)
            } catch (e) {
                console.error('[Crypto Error] Falha ao descriptografar chave:', e)
                return { error: 'Erro interno de segurança ao recuperar credenciais.' }
            }
        } else if (credentials.asaas_api_key) {
            // FALLBACK TEMPORÁRIO DURANTE MIGRAÇÃO
            usableApiKey = credentials.asaas_api_key
        }

        if (!usableApiKey) {
            return { error: 'Configuração de pagamento incompleta ou inválida.' }
        }

        // Buscar dados do atleta
        const { data: athleteProfile } = await supabase
            .from('profiles')
            .select('name, email, cpf')
            .eq('id', user.id)
            .single()

        if (!athleteProfile) {
            return { error: 'Perfil não encontrado.' }
        }

        // Criar cliente Asaas com config object correto
        const asaasClient = new AsaasClient({
            apiKey: usableApiKey,
            environment: credentials.environment as any
        })

        // Criar ou buscar customer no Asaas
        let customer = await asaasClient.getCustomerByCpfCnpj(athleteProfile.cpf || '')

        if (!customer) {
            customer = await asaasClient.createCustomer({
                name: athleteProfile.name,
                email: athleteProfile.email || undefined,
                cpfCnpj: athleteProfile.cpf || ''
            })
        }

        // Criar cobrança Pix
        const charge = await asaasClient.createPixPayment({
            customer: customer.id,
            value: registration.amount_cents / 100,
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            description: `Inscrição em evento`
        })

        // Buscar QR Code Pix
        const pixData = await asaasClient.getPixQrCode(charge.id)

        // Salvar no banco (usando admin para bypass RLS)
        const { error: insertError } = await adminClient
            .from('asaas_payments')
            .insert({
                registration_id: registrationId,
                organizer_user_id: organizerId,
                asaas_payment_id: charge.id,
                asaas_customer_id: customer.id,
                status: charge.status,
                value_cents: registration.amount_cents,
                pix_qr_code: pixData.encodedImage,
                pix_copy_paste: pixData.payload,
                expires_at: charge.dueDate
            })

        if (insertError) {
            console.error('Erro ao salvar pagamento:', insertError)
            return { error: 'Erro ao processar pagamento.' }
        }

        return {
            success: true,
            payment: {
                id: charge.id,
                value_cents: registration.amount_cents,
                pix_qr_code: pixData.encodedImage,
                pix_copy_paste: pixData.payload,
                expires_at: charge.dueDate
            }
        }
    } catch (error: any) {
        console.error('Erro ao criar cobrança Pix:', error)
        return { error: error.message || 'Erro ao processar pagamento.' }
    }
}

// Buscar cobrança Pix existente para exibição
export async function getPixChargeAction(registrationId: string): Promise<ActionState> {
    const user = await getCurrentUser()

    if (!user || user.role !== 'atleta') {
        return { error: 'Você precisa estar logado como atleta.' }
    }

    try {
        const supabase = await createClient()

        // Verificar se a inscrição pertence ao atleta
        const { data: registration } = await supabase
            .from('registrations')
            .select('id')
            .eq('id', registrationId)
            .eq('athlete_user_id', user.id)
            .single()

        if (!registration) {
            return { error: 'Inscrição não encontrada.' }
        }

        // Buscar pagamento
        const { data: payment } = await supabase
            .from('asaas_payments')
            .select('*')
            .eq('registration_id', registrationId)
            .single()

        if (!payment) {
            return { error: 'Nenhuma cobrança encontrada para esta inscrição.' }
        }

        return {
            success: true,
            payment: {
                id: payment.asaas_payment_id,
                value_cents: payment.value_cents,
                pix_qr_code: payment.pix_qr_code,
                pix_copy_paste: payment.pix_copy_paste,
                expires_at: payment.expires_at
            }
        }
    } catch (error) {
        console.error('Erro ao buscar cobrança:', error)
        return { error: 'Erro ao buscar informações de pagamento.' }
    }
}
