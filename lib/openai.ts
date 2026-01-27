import OpenAI from 'openai';
import { getDecryptedOpenAIKey } from '@/app/actions/system-config';

let openaiClient: OpenAI | null = null;

/**
 * Inicializa o cliente OpenAI recuperando a chave descriptografada.
 */
async function getOpenAIClient(): Promise<OpenAI> {
    if (openaiClient) return openaiClient;

    const apiKey = await getDecryptedOpenAIKey();

    if (!apiKey) {
        throw new Error('Chave API da OpenAI não encontrada ou não configurada corretamente.');
    }

    openaiClient = new OpenAI({
        apiKey: apiKey
    });

    return openaiClient;
}

/**
 * Gera uma resposta explicativa ou auxilia o organizador com base no contexto.
 */
export async function generateAIResponse(params: {
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
}) {
    console.log('[DEBUG] generateAIResponse: Obtendo cliente...')
    const client = await getOpenAIClient();

    try {
        console.log('[DEBUG] Chamando OpenAI API (model: gpt-4o-mini)...')
        const response = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: params.systemPrompt },
                { role: "user", content: params.userPrompt }
            ],
            temperature: params.temperature ?? 0.7,
        });

        console.log('[DEBUG] Resposta recebida da OpenAI')
        return response.choices[0].message.content;
    } catch (error: any) {
        console.error('[ERROR] Erro na chamada da OpenAI:', error);
        console.error('[ERROR] Detalhes:', error.message, error.stack)
        throw new Error(`Falha ao gerar resposta da IA: ${error.message}`);
    }
}
