/**
 * Bracket SVG Builder (Compact & Professional)
 * Gera uma string SVG vetorial para o chaveamento de lutas.
 * Versão de alta densidade sem placeholders genéricos.
 */

interface Match {
    id: string
    round: number
    match_no: number
    athlete_a_id: string | null
    athlete_b_id: string | null
    athlete_a_name?: string
    athlete_b_name?: string
    is_bye: boolean
    winner_id?: string | null
}

interface SvgConfig {
    cardW: number
    cardH: number
    gapX: number
    gapY: number
    radius: number
    paddingX: number
    textSize: number
    lineHeight: number
}

const CONFIG: SvgConfig = {
    cardW: 220, // Reduzido de 260
    cardH: 50,  // Reduzido de 78 para maior densidade
    gapX: 100, // Reduzido de 160
    gapY: 30,  // Reduzido de 60
    radius: 4,  // Roundness menor
    paddingX: 10,
    textSize: 12, // Um pouco menor
    lineHeight: 16
}

export function buildBracketSvg(
    bracketSize: number,
    matches: Match[],
    isLocked: boolean
): string {
    const rounds = Math.log2(bracketSize)
    const totalWidth = rounds * (CONFIG.cardW + CONFIG.gapX)

    // Cálculo da altura do primeiro round (Densidade Base)
    const round1Count = bracketSize / 2
    const totalHeight = round1Count * (CONFIG.cardH + CONFIG.gapY) + 100

    let svgContent = `<svg width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" font-family="'Inter', sans-serif">`

    // Definições de Estilo (Otimizado para Impressão)
    svgContent += `
        <defs>
            <style>
                .match-card { fill: #ffffff; stroke: #000000; stroke-width: 0.8; }
                .text-name { font-size: ${CONFIG.textSize}px; font-weight: 700; fill: #000000; text-transform: uppercase; }
                .text-bye { font-size: ${CONFIG.textSize - 1}px; font-style: italic; fill: #6B7280; font-weight: 400; }
                .connector { fill: none; stroke: #D1D5DB; stroke-width: 1.5; }
                .round-title { font-size: 11px; font-weight: 800; fill: #374151; text-transform: uppercase; letter-spacing: 0.2em; }
            </style>
        </defs>`

    const matchPositions = new Map<string, { x: number, y: number }>()

    for (let round = 1; round <= rounds; round++) {
        const matchesInRound = matches.filter(m => m.round === round)
        const roundX = (round - 1) * (CONFIG.cardW + CONFIG.gapX)
        const count = bracketSize / Math.pow(2, round)

        // Título do Round (Posicionado acima da coluna)
        const titleY = 40
        const titleText = round === rounds ? 'GRANDE FINAL' : round === rounds - 1 ? 'SEMIFINAIS' : round === rounds - 2 ? 'QUARTAS DE FINAL' : `RODADA ${round}`
        svgContent += `<text x="${roundX}" y="${titleY}" class="round-title">${titleText}</text>`

        for (let i = 0; i < count; i++) {
            const matchIndex = i
            // Lógica para encontrar o match correto
            const match = matchesInRound.find(m => m.match_no === (matchIndex + 1 + (bracketSize - (count * 2)))) || matchesInRound[i]

            let y = 0
            if (round === 1) {
                y = 80 + i * (CONFIG.cardH + CONFIG.gapY)
            } else {
                // Posicionamento centralizado entre os "filhos" do round anterior
                const prevRoundKey1 = `r${round - 1}-m${i * 2}`
                const prevRoundKey2 = `r${round - 1}-m${i * 2 + 1}`
                const pos1 = matchPositions.get(prevRoundKey1)
                const pos2 = matchPositions.get(prevRoundKey2)

                if (pos1 && pos2) {
                    y = (pos1.y + pos2.y)
                } else {
                    // Fallback de segurança
                    y = 80 + i * (CONFIG.cardH + (CONFIG.gapY * Math.pow(2, round - 1)))
                }
            }

            matchPositions.set(`r${round}-m${i}`, { x: roundX, y })

            // Renderização do Card (Borda fina, sem sombras, sem placeholders)
            svgContent += `
                <g transform="translate(${roundX}, ${y})">
                    <rect width="${CONFIG.cardW}" height="${CONFIG.cardH}" rx="${CONFIG.radius}" class="match-card" />
                    <line x1="0" y1="${CONFIG.cardH / 2}" x2="${CONFIG.cardW}" y2="${CONFIG.cardH / 2}" stroke="#E5E7EB" stroke-width="0.8" />
                    
                    <!-- Atleta A (Sem Rótulo "Atleta A") -->
                    <text x="${CONFIG.paddingX}" y="${22}" class="${match?.athlete_a_name ? 'text-name' : 'text-bye'}">
                        ${match?.athlete_a_name || (match?.is_bye ? 'BYE' : '')}
                    </text>

                    <!-- Atleta B (Sem Rótulo "Atleta B") -->
                    <text x="${CONFIG.paddingX}" y="${CONFIG.cardH / 2 + 18}" class="${match?.athlete_b_name ? 'text-name' : 'text-bye'}">
                        ${match?.athlete_b_name || (match?.is_bye ? 'BYE' : '')}
                    </text>
                </g>`

            // Conectores (Linhas retas e nítidas)
            if (round < rounds) {
                const startX = roundX + CONFIG.cardW
                const startY = y + CONFIG.cardH / 2
                const endX = roundX + CONFIG.cardW + CONFIG.gapX
                const midX = startX + CONFIG.gapX / 2

                svgContent += `<line x1="${startX}" y1="${startY}" x2="${midX}" y2="${startY}" class="connector" />`

                if (i % 2 !== 0) {
                    const prevRoundKey = `r${round}-m${i - 1}`
                    const prevPos = matchPositions.get(prevRoundKey)
                    if (prevPos) {
                        const pY = prevPos.y + CONFIG.cardH / 2
                        const mY = (pY + startY) / 2
                        svgContent += `<line x1="${midX}" y1="${pY}" x2="${midX}" y2="${startY}" class="connector" />`
                        svgContent += `<line x1="${midX}" y1="${mY}" x2="${endX}" y2="${mY}" class="connector" />`
                    }
                }
            }
        }
    }

    svgContent += '</svg>'
    return svgContent
}
