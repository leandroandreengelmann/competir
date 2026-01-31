import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib'

interface AuditReport {
    duplicates: any[]
    outOfPattern: any[]
    missing: any[]
    summary: {
        total: number
        duplicatesCount: number
        outOfPatternCount: number
        missingCount: number
    }
}

export async function generateCategoriesReport(report: AuditReport): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create()
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)

    const purple900 = rgb(30 / 255, 27 / 255, 75 / 255)
    const A4_SIZE: [number, number] = [595.28, 841.89]

    let currentPage = pdfDoc.addPage(A4_SIZE)
    const { width, height } = currentPage.getSize()
    let y = height - 110

    // Função para desenhar o header em uma página
    const drawHeader = (page: PDFPage) => {
        page.drawRectangle({
            x: 0,
            y: height - 80,
            width,
            height: 80,
            color: purple900
        })

        page.drawText('RELATÓRIO DE CONFERÊNCIA DE CATEGORIAS', {
            x: 40,
            y: height - 45,
            size: 16,
            font: fontBold,
            color: rgb(1, 1, 1)
        })

        page.drawText(`GERADO EM ${new Date().toLocaleDateString('pt-BR')} AS ${new Date().toLocaleTimeString('pt-BR')}`, {
            x: 40,
            y: height - 65,
            size: 8,
            font: fontRegular,
            color: rgb(0.8, 0.8, 0.8)
        })
    }

    const addNewPage = () => {
        currentPage = pdfDoc.addPage(A4_SIZE)
        y = height - 60
        return currentPage
    }

    // Primeira página tem header
    drawHeader(currentPage)

    // Resumo
    currentPage.drawText('RESUMO DA ANÁLISE', { x: 40, y, size: 12, font: fontBold, color: purple900 })
    y -= 20
    currentPage.drawText(`Total de categorias: ${report.summary.total}`, { x: 50, y, size: 10, font: fontRegular })
    y -= 15
    currentPage.drawText(`Duplicadas: ${report.summary.duplicatesCount}`, { x: 50, y, size: 10, font: fontRegular })
    y -= 15
    currentPage.drawText(`Fora do padrão: ${report.summary.outOfPatternCount}`, { x: 50, y, size: 10, font: fontRegular })
    y -= 15
    currentPage.drawText(`Faltantes: ${report.summary.missingCount}`, { x: 50, y, size: 10, font: fontRegular })

    y -= 40

    // Função auxiliar para desenhar seções
    const drawSection = (title: string, items: any[], drawItem: (item: any, py: number, page: PDFPage) => number) => {
        if (items.length === 0) return

        if (y < 120) {
            addNewPage();
        }

        currentPage.drawText(title.toUpperCase(), { x: 40, y, size: 12, font: fontBold, color: purple900 })
        y -= 25

        for (const item of items) {
            if (y < 80) {
                addNewPage();
            }
            y = drawItem(item, y, currentPage)
            y -= 20 // Espaçamento entre itens
        }
        y -= 20 // Espaçamento entre seções
    }

    drawSection('Categorias Duplicadas', report.duplicates, (item, py, page) => {
        const text = `${item.category.belt} • ${item.category.age_group} (${item.category.min_weight}kg - ${item.category.max_weight}kg)`
        page.drawText(text, { x: 50, y: py, size: 9, font: fontBold })
        page.drawText(`Motivo: ${item.reason}`, { x: 60, y: py - 12, size: 8, font: fontRegular, color: rgb(0.4, 0.4, 0.4) })
        return py - 12
    })

    drawSection('Fora do Padrão', report.outOfPattern, (item, py, page) => {
        const text = `${item.category.belt} • ${item.category.age_group} (${item.category.min_weight}kg - ${item.category.max_weight}kg)`
        page.drawText(text, { x: 50, y: py, size: 9, font: fontBold })
        page.drawText(`Motivo: ${item.reason}`, { x: 60, y: py - 12, size: 8, font: fontRegular, color: rgb(0.4, 0.4, 0.4) })
        return py - 12
    })

    drawSection('Categorias Faltantes', report.missing, (item, py, page) => {
        const text = `${item.belt} • ${item.age_group} (${item.weight_class})`
        page.drawText(text, { x: 50, y: py, size: 9, font: fontBold })
        page.drawText(item.reason, { x: 60, y: py - 12, size: 8, font: fontRegular, color: rgb(0.4, 0.4, 0.4) })
        return py - 12
    })

    // Footer
    const pages = pdfDoc.getPages()
    pages.forEach((p, idx) => {
        p.drawRectangle({ x: 0, y: 0, width, height: 30, color: purple900 })
        p.drawText(`© COMPETIR — PÁGINA ${idx + 1} DE ${pages.length}`, {
            x: 40,
            y: 10,
            size: 8,
            font: fontBold,
            color: rgb(1, 1, 1)
        })
    })

    return await pdfDoc.save()
}
