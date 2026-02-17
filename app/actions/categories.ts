'use server'

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/app/actions/user"
import { performCategoryAudit } from "@/lib/categories-checker-logic"

type ActionState = {
    success?: boolean
    message?: string
    error?: string
}

export async function createCategoryAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') return { error: 'Não autorizado.' }

    const belt_id = formData.get('belt_id') as string
    const age_group_id = formData.get('age_group_id') as string
    const min_weight_raw = formData.get('min_weight') as string
    const max_weight_raw = formData.get('max_weight') as string
    const min_age_raw = formData.get('min_age') as string
    const max_age_raw = formData.get('max_age') as string
    const registration_fee = parseFloat(formData.get('registration_fee') as string) || 0

    if (!belt_id || !age_group_id) {
        return { error: 'Preencha todos os campos obrigatórios.' }
    }

    // Validação condicional de peso
    // Tratamento de peso flexível (sem validação estrita)
    const hasMinWeight = min_weight_raw && min_weight_raw.trim() !== ''
    const hasMaxWeight = max_weight_raw && max_weight_raw.trim() !== ''

    let min_weight = hasMinWeight ? parseFloat(min_weight_raw) : -1
    let max_weight = hasMaxWeight ? parseFloat(max_weight_raw) : -1

    if (hasMinWeight && isNaN(min_weight)) min_weight = -1
    if (hasMaxWeight && isNaN(max_weight)) max_weight = -1

    const hasMinAge = min_age_raw && min_age_raw.trim() !== ''
    const hasMaxAge = max_age_raw && max_age_raw.trim() !== ''

    let min_age = hasMinAge ? parseInt(min_age_raw) : -1
    let max_age = hasMaxAge ? parseInt(max_age_raw) : -1

    if (hasMinAge && isNaN(min_age)) min_age = -1
    if (hasMaxAge && isNaN(max_age)) max_age = -1

    try {
        const supabase = await createClient()

        // Buscar nomes para manter compatibilidade legada (dual-write)
        const [{ data: beltData }, { data: ageData }] = await Promise.all([
            supabase.from('belts').select('name').eq('id', belt_id).single(),
            supabase.from('age_groups').select('name').eq('id', age_group_id).single()
        ])

        const { error } = await supabase
            .from('categories')
            .insert({
                organizer_id: user.id,
                belt_id,
                age_group_id,
                belt: beltData?.name || '',
                age_group: ageData?.name || '',
                min_weight,
                max_weight,
                min_age,
                max_age,
                registration_fee
            })

        if (error) {
            console.error('Erro ao criar categoria:', error)
            return { error: 'Erro ao criar categoria.' }
        }

        revalidatePath('/painel/organizador/categorias')
        return { success: true, message: 'Categoria criada com sucesso!' }
    } catch (error) {
        console.error(error)
        return { error: 'Erro ao criar categoria.' }
    }
}

export async function updateCategoryAction(id: string, prevState: ActionState, formData: FormData): Promise<ActionState> {
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') return { error: 'Não autorizado.' }

    const belt_id = formData.get('belt_id') as string
    const age_group_id = formData.get('age_group_id') as string
    const min_weight_raw = formData.get('min_weight') as string
    const max_weight_raw = formData.get('max_weight') as string
    const min_age_raw = formData.get('min_age') as string
    const max_age_raw = formData.get('max_age') as string
    const registration_fee = parseFloat(formData.get('registration_fee') as string) || 0

    if (!belt_id || !age_group_id) {
        return { error: 'Preencha todos os campos obrigatórios.' }
    }

    // Validação condicional de peso
    // Tratamento de peso flexível (sem validação estrita)
    const hasMinWeight = min_weight_raw && min_weight_raw.trim() !== ''
    const hasMaxWeight = max_weight_raw && max_weight_raw.trim() !== ''

    let min_weight = hasMinWeight ? parseFloat(min_weight_raw) : -1
    let max_weight = hasMaxWeight ? parseFloat(max_weight_raw) : -1

    if (hasMinWeight && isNaN(min_weight)) min_weight = -1
    if (hasMaxWeight && isNaN(max_weight)) max_weight = -1

    const hasMinAge = min_age_raw && min_age_raw.trim() !== ''
    const hasMaxAge = max_age_raw && max_age_raw.trim() !== ''

    let min_age = hasMinAge ? parseInt(min_age_raw) : -1
    let max_age = hasMaxAge ? parseInt(max_age_raw) : -1

    if (hasMinAge && isNaN(min_age)) min_age = -1
    if (hasMaxAge && isNaN(max_age)) max_age = -1

    try {
        const supabase = await createClient()

        // Buscar nomes para manter compatibilidade legada (dual-write)
        const [{ data: beltData }, { data: ageData }] = await Promise.all([
            supabase.from('belts').select('name').eq('id', belt_id).single(),
            supabase.from('age_groups').select('name').eq('id', age_group_id).single()
        ])

        const { error } = await supabase
            .from('categories')
            .update({
                belt_id,
                age_group_id,
                belt: beltData?.name || '',
                age_group: ageData?.name || '',
                min_weight,
                max_weight,
                min_age,
                max_age,
                registration_fee
            })
            .eq('id', id)
            .eq('organizer_id', user.id) // RLS backup

        if (error) {
            console.error('Erro ao atualizar categoria:', error)
            return { error: 'Erro ao atualizar categoria.' }
        }

        revalidatePath('/painel/organizador/categorias')
        return { success: true, message: 'Categoria atualizada com sucesso!' }
    } catch (error) {
        console.error(error)
        return { error: 'Erro ao atualizar categoria.' }
    }
}

export async function deleteCategoryAction(id: string) {
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') return { error: 'Não autorizado.' }

    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id)
            .eq('organizer_id', user.id) // RLS backup

        if (error) {
            console.error('Erro ao excluir categoria:', error)
            if (error.code === '23503') {
                return { error: 'Não é possível excluir categorias com inscrições ativas.' }
            }
            return { error: 'Erro ao excluir categoria.' }
        }

        revalidatePath('/painel/organizador/categorias')
        return { success: true }
    } catch (error) {
        console.error(error)
        return { error: 'Erro ao excluir categoria.' }
    }
}

export async function deleteSelectedCategoriesAction(ids: string[]): Promise<ActionState> {
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') return { error: 'Não autorizado.' }

    if (!ids || ids.length === 0) {
        return { error: 'Nenhuma categoria selecionada.' }
    }

    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('categories')
            .delete()
            .in('id', ids)
            .eq('organizer_id', user.id)

        if (error) {
            console.error('Erro ao excluir categorias em lote:', error)
            if (error.code === '23503') {
                return { error: 'Uma ou mais categorias selecionadas possuem inscrições e não podem ser excluídas.' }
            }
            return { error: 'Erro ao excluir as categorias selecionadas.' }
        }

        revalidatePath('/painel/organizador/categorias')
        return { success: true, message: `${ids.length} categorias excluídas com sucesso.` }
    } catch (error) {
        console.error(error)
        return { error: 'Erro ao processar exclusão em lote.' }
    }
}

export async function updateAllCategoriesFeeAction(newFee: number): Promise<ActionState> {
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') return { error: 'Não autorizado.' }

    if (newFee < 0) {
        return { error: 'O preço não pode ser negativo.' }
    }

    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('categories')
            .update({ registration_fee: newFee })
            .eq('organizer_id', user.id)

        if (error) {
            console.error('Erro ao atualizar preços em lote:', error)
            return { error: 'Erro ao atualizar os preços de todas as categorias.' }
        }

        revalidatePath('/painel/organizador/categorias')
        return { success: true, message: `Preço de todas as categorias atualizado para R$ ${newFee.toFixed(2)}.` }
    } catch (error) {
        console.error(error)
        return { error: 'Erro ao processar atualização em massa.' }
    }
}

export async function deleteAllCategoriesAction(): Promise<ActionState> {
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') return { error: 'Não autorizado.' }

    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('organizer_id', user.id)

        if (error) {
            console.error('Erro ao excluir todas as categorias:', error)
            return { error: 'Erro ao excluir todas as categorias. Verifique se existem categorias sendo usadas em eventos ativos.' }
        }

        revalidatePath('/painel/organizador/categorias')
        return { success: true, message: 'Todas as categorias foram excluídas com sucesso.' }
    } catch (error) {
        console.error(error)
        return { error: 'Erro ao processar exclusão em massa.' }
    }
}

export async function auditCategoriesAction() {
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') return { error: 'Não autorizado.' }

    try {
        const supabase = await createClient()

        const [
            { data: categories },
            { data: belts },
            { data: ageGroups }
        ] = await Promise.all([
            supabase.from('categories').select('*').eq('organizer_id', user.id),
            supabase.from('belts').select('id, name').order('name'),
            supabase.from('age_groups').select('id, name').order('name')
        ])

        if (!categories || !belts || !ageGroups) {
            return { error: 'Falha ao buscar dados para auditoria.' }
        }

        const report = performCategoryAudit(categories, belts, ageGroups)

        return { success: true, report }
    } catch (error) {
        console.error('Erro na auditoria:', error)
        return { error: 'Erro ao processar auditoria.' }
    }
}

export async function importCategoriesCSVAction(categories: any[]): Promise<ActionState & { count?: number }> {
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') return { error: 'Não autorizado.' }

    if (!categories || categories.length === 0) {
        return { error: 'Nenhuma categoria para importar.' }
    }

    try {
        const supabase = await createClient()

        // 1. Carregar todos os cintos e categorias de idade para busca em memória (cache)
        const [{ data: belts }, { data: ageGroups }] = await Promise.all([
            supabase.from('belts').select('id, name'),
            supabase.from('age_groups').select('id, name')
        ])

        if (!belts || !ageGroups) {
            return { error: 'Falha ao carregar dados auxiliares (faixas/idades).' }
        }

        // Função para normalizar strings (remove hífens, espaços extras e acentos básicos)
        const normalize = (str: string) => str
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // remove acentos
            .replace(/[^a-z0-9]/g, "")      // remove tudo que não for letra ou número

        const beltMap = new Map(belts.map(b => [normalize(b.name), b.id]))
        const ageGroupMap = new Map(ageGroups.map(a => [normalize(a.name), a.id]))

        const insertions = categories.map(cat => {
            // Resolver ID da faixa
            const belt_id = beltMap.get(normalize(cat.faixa))

            // Resolver ID da categoria de idade (Divisão + Sexo)
            const ageGroupSearchName = `${cat.divisao} ${cat.sexo}`
            const age_group_id = ageGroupMap.get(normalize(ageGroupSearchName))

            // Parsing de Idade (ex: "de 7 até 9 anos")
            const ageNumbers = cat.idade.match(/\d+/g)
            let min_age = -1
            let max_age = -1
            if (ageNumbers && ageNumbers.length >= 2) {
                min_age = parseInt(ageNumbers[0])
                max_age = parseInt(ageNumbers[1])
            } else if (ageNumbers && ageNumbers.length === 1) {
                min_age = parseInt(ageNumbers[0])
                max_age = parseInt(ageNumbers[0])
            }

            // Pesos
            const min_weight = parseFloat(cat.peso_min_kg) || -1
            const max_weight = parseFloat(cat.peso_max_kg) || -1
            const registration_fee = parseFloat(cat.valor_reais) || 0

            if (!belt_id || !age_group_id) {
                console.warn(`Pulando categoria: Faixa (${cat.faixa}) ou Idade (${ageGroupSearchName}) não encontrada.`)
                return null
            }

            return {
                organizer_id: user.id,
                belt_id,
                age_group_id,
                belt: cat.faixa,
                age_group: `${cat.divisao} ${cat.sexo}`, // Formato "Mirim Masculino"
                min_weight,
                max_weight,
                min_age,
                max_age,
                registration_fee
            }
        }).filter(Boolean)

        if (insertions.length === 0) {
            return { error: 'Nenhuma categoria válida encontrada no CSV. Verifique se os nomes das faixas e divisões estão corretos.' }
        }

        const { error } = await supabase
            .from('categories')
            .insert(insertions)

        if (error) {
            console.error('Erro na importação em lote:', error)
            return { error: 'Erro ao salvar as categorias importadas.' }
        }

        revalidatePath('/painel/organizador/categorias')
        return {
            success: true,
            message: `${insertions.length} categorias importadas com sucesso!`,
            count: insertions.length
        }
    } catch (error) {
        console.error(error)
        return { error: 'Erro ao processar importação.' }
    }
}
