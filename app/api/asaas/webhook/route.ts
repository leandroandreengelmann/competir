import { NextRequest, NextResponse } from 'next/server'
import { processAsaasWebhook } from '@/lib/asaas-webhook-processor'

/**
 * Webhook do Asaas (Caminho Novo) - Compatível com Ngrok e Produção
 * Rota: app/api/asaas/webhook/route.ts
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Extrair token de segurança
        const asaasToken = request.headers.get('asaas-access-token')
        const webhookSecret = process.env.ASAAS_WEBHOOK_SECRET

        // 2. Segurança Estrita: Token é obrigatório
        if (!webhookSecret) {
            console.error('[Webhook Asaas] ❌ Erro: ASAAS_WEBHOOK_SECRET não configurado no ambiente.')
            return NextResponse.json({ error: 'Webhook configuration error' }, { status: 500 })
        }

        if (asaasToken !== webhookSecret) {
            console.warn('[Webhook Asaas] ⚠️ Atenção: Token recebido inválido ou ausente. Ignorando.')
            // Retornamos 200 para evitar retries do Asaas, mas indicamos falha de segurança internamente
            return NextResponse.json({ received: true, security: 'invalid' }, { status: 200 })
        }

        // 3. Parse do payload
        const payload = await request.json()
        console.log(`[Webhook Asaas] Recebido evento: ${payload.event} para pagamento: ${payload.payment?.id}`)

        // 4. Chamar processador compartilhado
        await processAsaasWebhook(payload)

        // 5. Sempre responder 200 OK
        return NextResponse.json({ received: true }, { status: 200 })

    } catch (error) {
        console.error('[Webhook Asaas] ❌ Erro fatal no handler:', error)
        // Mesmo em erro, retornamos 200 para evitar retry infinito do Asaas (Regra 5)
        return NextResponse.json({ received: true, error: 'Internal Error' }, { status: 200 })
    }
}

/**
 * GET não permitido - Retorna 405 conforme regra de testes
 */
export async function GET() {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function PUT() {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}

export async function DELETE() {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
