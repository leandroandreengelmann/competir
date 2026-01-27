import { NextRequest, NextResponse } from 'next/server'
import { processAsaasWebhook } from '@/lib/asaas-webhook-processor'

/**
 * Webhook do Asaas (Caminho Antigo - Legado)
 * Ajustado para delegar a lógica ao processador central.
 */
export async function POST(request: NextRequest) {
    try {
        // Log de redirecionamento interno
        console.log('[Legacy Webhook] Chamado endpoint antigo /api/webhooks/asaas. Processando...')

        const asaasToken = request.headers.get('asaas-access-token')
        const webhookSecret = process.env.ASAAS_WEBHOOK_SECRET

        // Segurança Flexível conforme Regra 6
        if (webhookSecret) {
            if (asaasToken !== webhookSecret) {
                console.warn('[Legacy Webhook] ⚠️ Token inválido. Ignorando.')
                return NextResponse.json({ received: true }, { status: 200 })
            }
        }

        const payload = await request.json()

        // Delegar ao processador compartilhado
        await processAsaasWebhook(payload)

        return NextResponse.json({ received: true }, { status: 200 })

    } catch (error) {
        console.error('[Legacy Webhook] ❌ Erro:', error)
        return NextResponse.json({ received: true }, { status: 200 })
    }
}

export async function GET() {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
