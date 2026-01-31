'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './user'
import { generateAIResponse } from '@/lib/openai'

export type AssistantStatus = 'PENDING' | 'ANSWERED' | 'APPROVED' | 'SKIPPED'

export type KBTerm = {
    term: string
    definition: string
    related_intents?: string[]
}

export type AssistantStateItem = {
    term: string
    definition: string
    answer_raw: string | null
    status: AssistantStatus
}

export type CustomItem = {
    id: string
    question_text: string
    answer_text: string
}

async function validateEventOwnership(eventId: string) {
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') {
        throw new Error('Não autorizado.')
    }

    const supabase = await createClient()
    const { data: event, error } = await supabase
        .from('events')
        .select('id')
        .eq('id', eventId)
        .eq('organizer_id', user.id)
        .single()

    if (error || !event) {
        throw new Error('Evento não encontrado ou acesso negado.')
    }

    return user
}

/**
 * Busca o estado atual do assistente para um evento.
 * Faz o merge entre a KB global e as respostas do evento.
 */
export async function getEventAssistantStateAction(eventId: string): Promise<AssistantStateItem[]> {
    console.log('[DEBUG] getEventAssistantStateAction chamada para eventId:', eventId)
    try {
        await validateEventOwnership(eventId)
        const supabase = await createClient()

        console.log('[DEBUG] Buscando KB do Supabase...')
        // 1. Buscar a KB ativada (Super Admin)
        const { data: kbData, error: kbError } = await supabase
            .from('knowledge_entries')
            .select('content')
            .limit(1)
            .maybeSingle()

        console.log('[DEBUG] Resultado da query KB:', { hasData: !!kbData, error: kbError?.message, errorDetails: kbError })

        if (kbError) {
            console.error('[ERROR] Erro ao buscar KB:', kbError)
        }

        if (!kbData) {
            console.error('[ERROR] Nenhuma KB encontrada!')
            return []
        }

        let kbTerms: KBTerm[] = []
        try {
            console.log('[DEBUG] Tentando fazer parse do conteúdo KB...')
            console.log('[DEBUG] Conteúdo bruto (primeiros 200 chars):', kbData.content.substring(0, 200))
            const parsed = JSON.parse(kbData.content)
            console.log('[DEBUG] Parse bem-sucedido. Estrutura:', Object.keys(parsed))

            // A KB usa 'questions' ao invés de 'terms'
            const questions = parsed.questions || []
            console.log('[DEBUG] Número de questions encontradas:', questions.length)

            // Mapear para o formato esperado
            kbTerms = questions.map((q: any) => ({
                term: q.title || q.id,
                definition: q.what_it_means || 'Sem descrição',
                related_intents: q.aliases || []
            }))

            console.log('[DEBUG] Número de termos mapeados:', kbTerms.length)
        } catch (e) {
            console.error('[ERROR] Erro ao fazer parse da KB:', e)
            return []
        }

        // 2. Buscar respostas do evento
        const { data: responses } = await supabase
            .from('event_assistant_responses')
            .select('*')
            .eq('event_id', eventId)

        console.log('[DEBUG] Respostas existentes do evento:', responses?.length || 0)

        const responseMap = new Map((responses || []).map(r => [r.kb_term, r]))

        // 3. Merge
        const result = kbTerms.map(kb => {
            const resp = responseMap.get(kb.term)
            return {
                term: kb.term,
                definition: kb.definition,
                answer_raw: resp?.answer_raw || null,
                status: (resp?.status as AssistantStatus) || 'PENDING'
            }
        })

        console.log('[DEBUG] Retornando', result.length, 'itens para o assistente')
        return result
    } catch (error) {
        console.error('[ERROR] Erro ao buscar estado do assistente:', error)
        return []
    }
}

/**
 * Atualiza o status/resposta de um termo no assistente.
 */
export async function updateAssistantStatusAction(
    eventId: string,
    term: string,
    answer: string | null,
    status: AssistantStatus
) {
    try {
        await validateEventOwnership(eventId)
        const supabase = await createClient()

        const { error } = await supabase
            .from('event_assistant_responses')
            .upsert({
                event_id: eventId,
                kb_term: term,
                answer_raw: answer,
                status,
                updated_at: new Date().toISOString()
            }, { onConflict: 'event_id, kb_term' })

        if (error) throw error

        revalidatePath(`/painel/organizador/eventos/${eventId}/configurar-assistente`)
        return { success: true }
    } catch (error: any) {
        console.error('Erro ao atualizar assistente:', error)
        return { error: error.message || 'Erro ao salvar.' }
    }
}

/**
 * Busca itens customizados do assistente.
 */
export async function getCustomAssistantItemsAction(eventId: string): Promise<CustomItem[]> {
    try {
        await validateEventOwnership(eventId)
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('event_assistant_custom')
            .select('id, question_text, answer_text')
            .eq('event_id', eventId)
            .order('created_at', { ascending: true })

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Erro ao buscar itens customizados:', error)
        return []
    }
}

/**
 * Adiciona um item customizado ao assistente.
 */
export async function addCustomAssistantItemAction(eventId: string, question: string, answer: string) {
    try {
        await validateEventOwnership(eventId)
        const supabase = await createClient()

        const { error } = await supabase
            .from('event_assistant_custom')
            .insert({
                event_id: eventId,
                question_text: question,
                answer_text: answer
            })

        if (error) throw error

        revalidatePath(`/painel/organizador/eventos/${eventId}/configurar-assistente`)
        return { success: true }
    } catch (error: any) {
        console.error('Erro ao adicionar item customizado:', error)
        return { error: error.message || 'Erro ao salvar.' }
    }
}

/**
 * Formata e corrige a resposta do usuário usando IA.
 */
export async function formatAnswerAction(eventId: string, term: string, rawAnswer: string) {
    console.log('[DEBUG] formatAnswerAction chamada:', { eventId, term })
    try {
        await validateEventOwnership(eventId)
        console.log('[DEBUG] Ownership validado')

        const systemPrompt = `Você é um assistente que formata respostas de organizadores de campeonatos de Jiu-Jitsu.

Sua tarefa é:
1. Corrigir erros de português
2. Remover redundâncias
3. Formatar em listas/bullets quando fizer sentido
4. Manter o texto profissional e claro
5. NÃO usar emojis
6. NÃO inventar informações além do que o usuário escreveu
7. NÃO adicionar regras ou detalhes que não estavam no texto original
8. Se o texto fornecido pelo usuário for incompreensível, incoerente ou insuficiente para formatar, responda APENAS com a palavra: [ERRO]

Contexto: Esta resposta é sobre "${term}".

Responda APENAS com o texto formatado, sem introduções ou comentários.`

        const userPrompt = rawAnswer

        console.log('[DEBUG] Chamando generateAIResponse para formatação...')
        const response = await generateAIResponse({
            systemPrompt,
            userPrompt,
            temperature: 0.3
        })
        console.log('[DEBUG] Resposta da IA recebida:', response?.substring(0, 100))

        // Verificar se a IA retornou erro ou se a resposta é uma recusa padrão
        const isError = !response ||
            response.includes('[ERRO]') ||
            response.length < 5 ||
            response.includes('Sinto muito') ||
            response.includes('Não posso')

        if (isError) {
            return {
                success: false,
                error: 'O assistente não conseguiu processar este texto. Ele pode estar muito curto ou confuso.',
                formattedText: rawAnswer
            }
        }

        return { success: true, formattedText: response }
    } catch (error: any) {
        console.error('[ERROR] Erro ao formatar resposta:', error)
        return {
            error: 'Não foi possível formatar a resposta agora. Tente novamente.',
            formattedText: rawAnswer // Fallback: retorna o texto original
        }
    }
}

/**
 * Chama a OpenAI para explicar um termo baseado na KB.
 */
export async function getAIHelpAction(eventId: string, term: string, definition: string) {
    console.log('[DEBUG] getAIHelpAction chamada:', { eventId, term })
    try {
        await validateEventOwnership(eventId)
        console.log('[DEBUG] Ownership validado')

        const systemPrompt = `Você é um assistente especializado em campeonatos de Jiu-Jitsu. 
Sua tarefa é explicar termos técnicos e regras para organizadores de eventos.
Você deve se basear estritamente na definição fornecida pela Base de Conhecimento do sistema.

Definição da Base: "${definition}"

Regras:
1. Seja conciso e profissional.
2. Dê 2 exemplos práticos de como o organizador pode preencher essa informação.
3. Responda em Português do Brasil.`

        const userPrompt = `Tenho dúvida sobre o item: "${term}". Pode me explicar e dar exemplos de como preencher?`

        console.log('[DEBUG] Chamando generateAIResponse...')
        const response = await generateAIResponse({
            systemPrompt,
            userPrompt,
            temperature: 0.5
        })
        console.log('[DEBUG] Resposta da IA recebida:', response?.substring(0, 100))

        return { success: true, helpText: response }
    } catch (error: any) {
        console.error('[ERROR] Erro ao buscar ajuda da IA:', error)
        return {
            error: 'Não foi possível obter ajuda da IA agora. Tente novamente em alguns instantes.',
            fallback: `Esta pergunta serve para coletar informações sobre: ${term}. \n\nDefinição da Base: ${definition}`
        }
    }
}

/**
 * Busca o resumo das informações aprovadas de um evento.
 */
export async function getEventInfoSummaryAction(eventId: string) {
    try {
        await validateEventOwnership(eventId)
        const supabase = await createClient()

        // Buscar evento para contexto
        const { data: event } = await supabase
            .from('events')
            .select('id, name, date, address, info_published, info_published_at')
            .eq('id', eventId)
            .single()

        if (!event) return { error: 'Evento não encontrado' }

        // Buscar todas as respostas aprovadas (ordenadas por sort_order, fallback created_at)
        const { data: responses } = await supabase
            .from('event_assistant_responses')
            .select('kb_term, answer_raw, created_at')
            .eq('event_id', eventId)
            .eq('status', 'APPROVED')
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true })

        // Buscar itens customizados
        const { data: customItems } = await supabase
            .from('event_assistant_custom')
            .select('question_text, answer_text')
            .eq('event_id', eventId)
            .order('created_at', { ascending: true })

        return {
            success: true,
            event,
            responses: responses || [],
            customItems: customItems || []
        }
    } catch (error: any) {
        console.error('Erro ao buscar resumo:', error)
        return { error: error.message || 'Erro ao buscar informações' }
    }
}

/**
 * Publica as informações gerais de um evento.
 */
export async function publishEventInfoAction(eventId: string) {
    try {
        await validateEventOwnership(eventId)
        const supabase = await createClient()

        // Verificar se tem pelo menos uma resposta aprovada
        const { data: responses, error: checkError } = await supabase
            .from('event_assistant_responses')
            .select('id')
            .eq('event_id', eventId)
            .eq('status', 'APPROVED')
            .limit(1)

        if (checkError || !responses || responses.length === 0) {
            return { error: 'Você precisa aprovar pelo menos uma resposta antes de publicar.' }
        }

        // Publicar
        const { error: updateError } = await supabase
            .from('events')
            .update({
                info_published: true,
                info_published_at: new Date().toISOString()
            })
            .eq('id', eventId)

        if (updateError) throw updateError

        revalidatePath(`/painel/organizador/eventos/${eventId}`)
        revalidatePath(`/painel/organizador/eventos/${eventId}/informacoes-gerais`)
        revalidatePath(`/eventos/${eventId}`)

        return { success: true }
    } catch (error: any) {
        console.error('Erro ao publicar informações:', error)
        return { error: error.message || 'Erro ao publicar.' }
    }
}

/**
 * Despublica as informações gerais de um evento.
 */
export async function unpublishEventInfoAction(eventId: string) {
    try {
        await validateEventOwnership(eventId)
        const supabase = await createClient()

        // Despublicar
        const { error: updateError } = await supabase
            .from('events')
            .update({
                info_published: false,
                info_published_at: null
            })
            .eq('id', eventId)

        if (updateError) throw updateError

        revalidatePath(`/painel/organizador/eventos/${eventId}`)
        revalidatePath(`/painel/organizador/eventos/${eventId}/informacoes-gerais`)
        revalidatePath(`/eventos/${eventId}`)

        return { success: true }
    } catch (error: any) {
        console.error('Erro ao despublicar informações:', error)
        return { error: error.message || 'Erro ao despublicar.' }
    }
}

/**
 * Atualiza uma resposta específica do evento.
 */
export async function updateEventResponseAction(eventId: string, kbTerm: string, newAnswer: string) {
    try {
        await validateEventOwnership(eventId)

        // Validar que a resposta não está vazia
        const trimmedAnswer = newAnswer.trim()
        if (!trimmedAnswer || trimmedAnswer.length < 3) {
            return { error: 'A resposta deve ter pelo menos 3 caracteres.' }
        }

        const supabase = await createClient()

        // Atualizar a resposta
        const { error: updateError } = await supabase
            .from('event_assistant_responses')
            .update({
                answer_raw: trimmedAnswer,
                updated_at: new Date().toISOString()
            })
            .eq('event_id', eventId)
            .eq('kb_term', kbTerm)

        if (updateError) throw updateError

        revalidatePath(`/painel/organizador/eventos/${eventId}/informacoes-gerais`)

        return { success: true }
    } catch (error: any) {
        console.error('Erro ao atualizar resposta:', error)
        return { error: error.message || 'Erro ao atualizar resposta.' }
    }
}

/**
 * Exclui uma resposta específica do evento.
 */
export async function deleteEventResponseAction(eventId: string, kbTerm: string) {
    try {
        await validateEventOwnership(eventId)
        const supabase = await createClient()

        // Deletar a resposta
        const { error: deleteError } = await supabase
            .from('event_assistant_responses')
            .delete()
            .eq('event_id', eventId)
            .eq('kb_term', kbTerm)

        if (deleteError) throw deleteError

        revalidatePath(`/painel/organizador/eventos/${eventId}/informacoes-gerais`)

        return { success: true }
    } catch (error: any) {
        console.error('Erro ao excluir resposta:', error)
        return { error: error.message || 'Erro ao excluir resposta.' }
    }
}

/**
 * Atualiza a ordem de exibição das respostas do evento.
 */
export async function updateResponsesOrderAction(eventId: string, orderedTerms: string[]) {
    try {
        await validateEventOwnership(eventId)
        const supabase = await createClient()

        // Validar que todos os termos pertencem ao evento
        const { data: existingResponses, error: checkError } = await supabase
            .from('event_assistant_responses')
            .select('kb_term')
            .eq('event_id', eventId)

        if (checkError) throw checkError

        const validTerms = new Set((existingResponses || []).map(r => r.kb_term))
        const invalidTerms = orderedTerms.filter(term => !validTerms.has(term))

        if (invalidTerms.length > 0) {
            return { error: 'Alguns termos não pertencem a este evento.' }
        }

        // Atualizar sort_order de cada resposta
        for (let i = 0; i < orderedTerms.length; i++) {
            const { error: updateError } = await supabase
                .from('event_assistant_responses')
                .update({
                    sort_order: i,
                    updated_at: new Date().toISOString()
                })
                .eq('event_id', eventId)
                .eq('kb_term', orderedTerms[i])

            if (updateError) throw updateError
        }

        revalidatePath(`/painel/organizador/eventos/${eventId}/informacoes-gerais`)
        revalidatePath(`/eventos/${eventId}`)

        return { success: true }
    } catch (error: any) {
        console.error('Erro ao atualizar ordem das respostas:', error)
        return { error: error.message || 'Erro ao salvar ordem.' }
    }
}
