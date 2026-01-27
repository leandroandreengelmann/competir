import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/app/actions/user'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBracketDataAction } from '@/app/actions/bracket-management'
import { generateBracketPdf } from '@/lib/pdf/bracket-pdf-engine'

export async function GET(request: NextRequest) {
    console.log('[BRACKET PDF] Geração Determinística Iniciada (pdf-lib)')

    try {
        // 1. Validar usuário e permissões
        const user = await getCurrentUser()
        if (!user || (user.role !== 'super_admin' && user.role !== 'organizador')) {
            return new NextResponse('Não autorizado', { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const eventId = searchParams.get('eventId')
        const categoryId = searchParams.get('categoryId')

        if (!eventId || !categoryId) {
            return new NextResponse('Parâmetros insuficientes', { status: 400 })
        }

        const adminClient = createAdminClient()

        // 2. Buscar metadados do evento e categoria
        const { data: event } = await adminClient.from('events').select('name').eq('id', eventId).single()
        const { data: category } = await adminClient.from('categories').select('belt, age_group, min_weight, max_weight').eq('id', categoryId).single()

        if (!event || !category) {
            return new NextResponse('Evento ou Categoria não encontrados', { status: 404 })
        }

        // 3. Buscar dados do bracket (com nomes corrigidos na Server Action)
        const bracketData = await getBracketDataAction(eventId, categoryId)
        if (bracketData.error) {
            throw new Error(bracketData.error)
        }

        // 4. Gerar PDF via Motor pdf-lib
        const pdfBytes = await generateBracketPdf(
            event,
            category,
            bracketData.bracketSize,
            bracketData.matches || [],
            !!bracketData.isLocked
        )

        // 5. Retornar PDF Real
        return new NextResponse(pdfBytes as any, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="chave-${(categoryId as string).substring(0, 8)}.pdf"`,
                'Cache-Control': 'no-store'
            }
        })

    } catch (error: any) {
        console.error('[BRACKET PDF API ERROR]:', error.stack || error.message)
        return new NextResponse(`Erro fatal ao gerar PDF: ${error.message}`, { status: 500 })
    }
}
