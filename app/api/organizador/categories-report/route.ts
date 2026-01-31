import { NextRequest, NextResponse } from 'next/server'
import { generateCategoriesReport } from '@/lib/pdf/categories-report'

export async function POST(req: NextRequest) {
    try {
        const { report } = await req.json()

        if (!report) {
            return NextResponse.json({ error: 'Report data missing' }, { status: 400 })
        }

        const pdfBytes = await generateCategoriesReport(report)

        return new Response(pdfBytes as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="relatorio-categorias.pdf"`
            }
        })
    } catch (error) {
        console.error('Error generating PDF report:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
