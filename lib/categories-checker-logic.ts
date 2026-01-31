import {
    getAgeGroupDivision,
    isBeltCompatible,
    getCBJJWeightClasses,
    WeightClass
} from "@/lib/cbjj-gi-rules"

interface Category {
    id: string
    belt?: string
    belt_id?: string
    age_group?: string
    age_group_id?: string
    min_weight: number
    max_weight: number
}

interface AuditResult {
    duplicates: { category: Category; reason: string }[]
    outOfPattern: { category: Category; reason: string }[]
    missing: { belt: string; age_group: string; weight_class?: string; reason: string }[]
    summary: {
        total: number
        duplicatesCount: number
        outOfPatternCount: number
        missingCount: number
    }
}

/**
 * Gera uma assinatura determinística híbrida para uma categoria.
 */
function getCategorySignature(cat: Category): string {
    const beltPart = cat.belt_id || (cat.belt || "").toLowerCase().trim()
    const agePart = cat.age_group_id || (cat.age_group || "").toLowerCase().trim()
    return `${beltPart}|${agePart}|${cat.min_weight}|${cat.max_weight}`
}

export function performCategoryAudit(
    existingCategories: Category[],
    belts: { id: string; name: string }[],
    ageGroups: { id: string; name: string }[]
): AuditResult {
    const duplicates: { category: Category; reason: string }[] = []
    const outOfPattern: { category: Category; reason: string }[] = []
    const missing: { belt: string; age_group: string; weight_class?: string; reason: string }[] = []

    const signatures = new Map<string, string[]>()
    const existingKeySet = new Set<string>()

    // 1. Verificar Duplicatas e Fora do Padrão
    existingCategories.forEach(cat => {
        const sig = getCategorySignature(cat)
        existingKeySet.add(sig)

        // Duplicatas
        if (signatures.has(sig)) {
            duplicates.push({ category: cat, reason: "Mesma combinação de faixa, idade e peso já cadastrada." })
        } else {
            signatures.set(sig, [cat.id])
        }

        // Fora do Padrão
        const beltName = cat.belt || belts.find(b => b.id === cat.belt_id)?.name || ""
        const ageName = cat.age_group || ageGroups.find(a => a.id === cat.age_group_id)?.name || ""

        if (!beltName || !ageName) {
            outOfPattern.push({ category: cat, reason: "Dados de faixa ou idade incompletos." })
            return
        }

        const division = getAgeGroupDivision(ageName)
        if (division === 'Unknown') {
            outOfPattern.push({ category: cat, reason: `Grupo de idade "${ageName}" não reconhecido pelas regras CBJJ.` })
            return
        }

        if (!isBeltCompatible(beltName, ageName)) {
            outOfPattern.push({ category: cat, reason: `Faixa "${beltName}" incompatível com o grupo de idade "${ageName}".` })
            return
        }

        // Validar Pesos (se não for livre)
        if (cat.min_weight !== -1 || cat.max_weight !== -1) {
            const officialWeights = getCBJJWeightClasses(ageName)
            const isOfficial = officialWeights.some(ow =>
                Math.abs(ow.min_weight - cat.min_weight) < 0.01 &&
                Math.abs(ow.max_weight - cat.max_weight) < 0.01
            )
            if (!isOfficial && officialWeights.length > 0) {
                outOfPattern.push({ category: cat, reason: `Peso (${cat.min_weight}kg - ${cat.max_weight}kg) não consta na tabela oficial CBJJ para esta idade.` })
            }
        }
    })

    // 2. Verificar Faltantes (Simplificado: apenas categorias de peso oficiais)
    // Para cada grupo de idade e faixa compatível, verificar se existem as classes de peso oficiais
    ageGroups.forEach(ag => {
        const division = getAgeGroupDivision(ag.name)
        if (division === 'Unknown') return

        const officialWeights = getCBJJWeightClasses(ag.name)
        if (officialWeights.length === 0) return

        belts.forEach(belt => {
            if (isBeltCompatible(belt.name, ag.name)) {
                officialWeights.forEach(ow => {
                    const sig = `${belt.id}|${ag.id}|${ow.min_weight}|${ow.max_weight}`
                    // Também checar por assinatura de texto se o sistema for puramente híbrido no banco
                    const sigText = `${belt.name.toLowerCase().trim()}|${ag.name.toLowerCase().trim()}|${ow.min_weight}|${ow.max_weight}`

                    if (!existingKeySet.has(sig) && !existingKeySet.has(sigText)) {
                        missing.push({
                            belt: belt.name,
                            age_group: ag.name,
                            weight_class: ow.name,
                            reason: `Categoria oficial (${ow.name}: ${ow.min_weight}kg - ${ow.max_weight}kg) não encontrada.`
                        })
                    }
                })
            }
        })
    })

    return {
        duplicates,
        outOfPattern,
        missing,
        summary: {
            total: existingCategories.length,
            duplicatesCount: duplicates.length,
            outOfPatternCount: outOfPattern.length,
            missingCount: missing.length
        }
    }
}
