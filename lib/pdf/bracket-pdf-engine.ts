import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

interface Match {
    id: string
    round: number
    match_no: number
    athlete_a_name?: string
    athlete_b_name?: string
    is_bye: boolean
}

interface SvgConfig {
    cardW: number
    cardH: number
    gapX: number
    gapY: number
    radius: number
    paddingX: number
    textSize: number
}

const CONFIG: SvgConfig = {
    cardW: 160,
    cardH: 40,
    gapX: 60,
    gapY: 30,
    radius: 4,
    paddingX: 10,
    textSize: 10
}

/**
 * Gera um PDF determinístico usando pdf-lib (mais estável em SSR).
 */
export async function generateBracketPdf(
    event: { name: string },
    category: { belt: string, age_group: string, min_weight: number, max_weight: number },
    bracketSize: number,
    matches: Match[],
    isLocked: boolean
): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create()
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

    const rounds = Math.log2(bracketSize)
    const purple900 = rgb(30 / 255, 27 / 255, 75 / 255)

    // --- Layout Calculation ---
    const startX = 40
    const startY = 500 // Invertido no PDF-LIB (0 é embaixo)
    const round1Count = bracketSize / 2
    const totalHeight = round1Count * (CONFIG.cardH + CONFIG.gapY)

    const usefulHeight = 450
    const pagesNeeded = Math.ceil(totalHeight / usefulHeight)

    // Coordenadas calculadas
    const matchPositions = new Map<string, { x: number, y: number }>()

    for (let p = 0; p < pagesNeeded; p++) {
        const page = pdfDoc.addPage([841.89, 595.28]) // A4 Landscape
        const { width, height } = page.getSize()

        // --- DRAW HEADER ---
        page.drawRectangle({
            x: 0,
            y: height - 70,
            width: width,
            height: 70,
            color: purple900
        })

        page.drawText(event.name.toUpperCase(), {
            x: 40,
            y: height - 35,
            size: 18,
            font: fontBold,
            color: rgb(1, 1, 1)
        })

        page.drawText(`CHAVE: ${category.belt} — ${category.age_group} (${category.min_weight}kg - ${category.max_weight}kg)`, {
            x: 40,
            y: height - 55,
            size: 10,
            font: fontRegular,
            color: rgb(0.9, 0.9, 0.9)
        })

        const statusText = isLocked ? 'OFICIAL / LOCKED' : 'PRÉVIA DINÂMICA'
        page.drawText(statusText, {
            x: width - 180,
            y: height - 35,
            size: 9,
            font: fontBold,
            color: rgb(1, 1, 1)
        })

        page.drawText(`GERADO EM ${new Date().toLocaleDateString('pt-BR')}`, {
            x: width - 180,
            y: height - 55,
            size: 8,
            font: fontRegular,
            color: rgb(0.8, 0.8, 0.8)
        })

        // --- DRAW FOOTER ---
        page.drawRectangle({
            x: 0,
            y: 0,
            width: width,
            height: 30,
            color: purple900
        })

        page.drawText('© COMPETIR — SISTEMA DE GERENCIAMENTO DE EVENTOS', {
            x: 40,
            y: 10,
            size: 8,
            font: fontBold,
            color: rgb(1, 1, 1)
        })

        page.drawText(`PÁGINA ${p + 1} DE ${pagesNeeded}`, {
            x: width - 140,
            y: 10,
            size: 8,
            font: fontBold,
            color: rgb(1, 1, 1)
        })

        // --- DRAW BRACKET ---
        const yBase = height - 120
        const yOffset = p * usefulHeight

        for (let round = 1; round <= rounds; round++) {
            const count = bracketSize / Math.pow(2, round)
            const roundX = startX + (round - 1) * (CONFIG.cardW + CONFIG.gapX)

            // Round Title
            const titleDisplay = round === rounds ? 'FINAL' : round === rounds - 1 ? 'SEMIFINAIS' : `RODADA ${round}`
            page.drawText(titleDisplay, {
                x: roundX,
                y: yBase + 15,
                size: 9,
                font: fontBold,
                color: rgb(0.2, 0.2, 0.2)
            })

            for (let i = 0; i < count; i++) {
                const matchIdx = i

                let y = 0
                if (round === 1) {
                    y = yBase - i * (CONFIG.cardH + CONFIG.gapY)
                } else {
                    const p1 = matchPositions.get(`r${round - 1}-m${i * 2}`)
                    const p2 = matchPositions.get(`r${round - 1}-m${i * 2 + 1}`)
                    y = p1 && p2 ? (p1.y + p2.y) / 2 : 0
                }

                matchPositions.set(`r${round}-m${i}`, { x: roundX, y })

                // Desenhar apenas se estiver na página atual
                const relativeY = y + yOffset - (height - 120) // Ajuste para o offset de página

                // No pdf-lib desenhamos por coordenadas reais. 
                // Se o y estiver dentro do range vizivel (yBase até 50)
                if (y <= yBase && y >= 50) {
                    // Card Border
                    page.drawRectangle({
                        x: roundX,
                        y: y - CONFIG.cardH,
                        width: CONFIG.cardW,
                        height: CONFIG.cardH,
                        borderColor: rgb(0, 0, 0),
                        borderWidth: 0.5,
                        color: rgb(1, 1, 1)
                    })

                    // Mid Line
                    page.drawLine({
                        start: { x: roundX, y: y - CONFIG.cardH / 2 },
                        end: { x: roundX + CONFIG.cardW, y: y - CONFIG.cardH / 2 },
                        color: rgb(0.9, 0.9, 0.9),
                        thickness: 0.5
                    })

                    // Get match data
                    const match = matches.find(m => m.round === round && m.match_no === (matchIdx + 1 + (bracketSize - (count * 2))))
                        || matches.filter(m => m.round === round)[i]

                    // Athlete A
                    const nameA = match?.athlete_a_name || (match?.is_bye ? 'BYE' : '')
                    page.drawText(nameA.substring(0, 25).toUpperCase(), {
                        x: roundX + CONFIG.paddingX,
                        y: y - 15,
                        size: CONFIG.textSize,
                        font: match?.is_bye ? fontItalic : fontBold,
                        color: match?.is_bye ? rgb(0.5, 0.5, 0.5) : rgb(0, 0, 0)
                    })

                    // Athlete B
                    const nameB = match?.athlete_b_name || (match?.is_bye ? 'BYE' : '')
                    page.drawText(nameB.substring(0, 25).toUpperCase(), {
                        x: roundX + CONFIG.paddingX,
                        y: y - 35,
                        size: CONFIG.textSize,
                        font: match?.is_bye ? fontItalic : fontBold,
                        color: match?.is_bye ? rgb(0.5, 0.5, 0.5) : rgb(0, 0, 0)
                    })

                    // Connectors
                    if (round < rounds) {
                        const midX = roundX + CONFIG.cardW + CONFIG.gapX / 2
                        const nextRoundX = roundX + CONFIG.cardW + CONFIG.gapX

                        // horizontal line from card
                        page.drawLine({
                            start: { x: roundX + CONFIG.cardW, y: y - CONFIG.cardH / 2 },
                            end: { x: midX, y: y - CONFIG.cardH / 2 },
                            color: rgb(0.8, 0.8, 0.8),
                            thickness: 1
                        })

                        if (i % 2 !== 0) {
                            const prevY = matchPositions.get(`r${round}-m${i - 1}`)?.y || 0
                            const midY = (prevY + y) / 2

                            // vertical line
                            page.drawLine({
                                start: { x: midX, y: prevY - CONFIG.cardH / 2 },
                                end: { x: midX, y: y - CONFIG.cardH / 2 },
                                color: rgb(0.8, 0.8, 0.8),
                                thickness: 1
                            })

                            // horizontal line to next
                            page.drawLine({
                                start: { x: midX, y: midY - CONFIG.cardH / 2 },
                                end: { x: nextRoundX, y: midY - CONFIG.cardH / 2 },
                                color: rgb(0.8, 0.8, 0.8),
                                thickness: 1
                            })
                        }
                    }
                }
            }
        }
    }

    return await pdfDoc.save()
}
