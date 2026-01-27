import { createAdminClient } from './supabase/admin'

/**
 * Processador central de webhooks do Asaas
 * Centraliza a lógica de atualização do banco de dados para evitar duplicidade
 */
export async function processAsaasWebhook(payload: any) {
    const { event, payment } = payload

    if (!event || !payment?.id) {
        console.log('[Asaas Processor] Payload inválido ou incompleto')
        return { success: false, message: 'Payload inválido' }
    }

    // Processar apenas eventos de confirmação de pagamento
    if (event !== 'PAYMENT_CONFIRMED' && event !== 'PAYMENT_RECEIVED') {
        console.log(`[Asaas Processor] Evento ${event} ignorado (não é de confirmação)`)
        return { success: true, message: 'Evento ignorado' }
    }

    try {
        const adminClient = createAdminClient()

        // 1. Buscar o pagamento vinculado ao ID do Asaas
        const { data: dbPayment, error: paymentError } = await adminClient
            .from('asaas_payments')
            .select('registration_id, status')
            .eq('asaas_payment_id', payment.id)
            .single()

        if (paymentError || !dbPayment) {
            console.log(`[Asaas Processor] ⚠️ Pagamento ${payment.id} não encontrado no banco de dados local`)
            return { success: false, message: 'Pagamento não encontrado' }
        }

        // 2. Verificar se a inscrição existe
        const { data: registration, error: regError } = await adminClient
            .from('registrations')
            .select('id, status')
            .eq('id', dbPayment.registration_id)
            .single()

        if (regError || !registration) {
            console.log(`[Asaas Processor] ⚠️ Inscrição #${dbPayment.registration_id} não encontrada`)
            return { success: false, message: 'Inscrição não encontrada' }
        }

        // 3. Idempotência: Se já está paga, não faz nada
        if (registration.status === 'paid') {
            console.log(`[Asaas Processor] ℹ️ Pagamento ${payment.id} já estava confirmado anteriormente`)
            return { success: true, message: 'Já processado' }
        }

        // 4. Atualizar asaas_payments
        const { error: updatePaymentError } = await adminClient
            .from('asaas_payments')
            .update({
                status: payment.status || 'RECEIVED',
                updated_at: new Date().toISOString()
            })
            .eq('asaas_payment_id', payment.id)

        if (updatePaymentError) {
            console.error('[Asaas Processor] Erro ao atualizar asaas_payments:', updatePaymentError)
            throw updatePaymentError
        }

        // 5. Atualizar registrations
        const { error: updateRegError } = await adminClient
            .from('registrations')
            .update({
                status: 'paid',
                updated_at: new Date().toISOString()
            })
            .eq('id', dbPayment.registration_id)

        if (updateRegError) {
            console.error('[Asaas Processor] Erro ao atualizar registrations:', updateRegError)
            throw updateRegError
        }

        console.log(`[Asaas Processor] ✅ SUCESSO: Pagamento ${payment.id} confirmado para Inscrição #${dbPayment.registration_id}`)
        return { success: true, message: 'Confirmado com sucesso' }

    } catch (error) {
        console.error('[Asaas Processor] ❌ Erro ao atualizar banco:', error)
        throw error
    }
}
