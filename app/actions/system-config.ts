'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from './user'
import { encrypt, decrypt, EncryptedData } from '@/lib/crypto'

export type OpenAIConfig = {
    isConfigured: boolean
    updatedAt: string | null
}

export type LoginBackgroundConfig = {
    desktopImageUrl: string | null
    mobileImageUrl: string | null
    updatedAt: string | null
}

export type ActionState = {
    success?: boolean
    message?: string
    error?: string
}

async function validateSuperAdmin() {
    const user = await getCurrentUser()
    if (!user || user.role !== 'super_admin') {
        throw new Error('Acesso negado. Apenas Super Admins podem acessar configurações do sistema.')
    }
    return user
}

/**
 * Busca o status da configuração da OpenAI
 * NUNCA retorna a chave, apenas se está configurada e quando foi atualizada
 */
export async function getOpenAIConfigAction(): Promise<OpenAIConfig> {
    try {
        await validateSuperAdmin()
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('system_integrations')
            .select('updated_at')
            .eq('provider', 'openai')
            .single()

        if (error || !data) {
            return { isConfigured: false, updatedAt: null }
        }

        return {
            isConfigured: true,
            updatedAt: data.updated_at
        }
    } catch (error) {
        console.error('Erro ao buscar config OpenAI:', error)
        return { isConfigured: false, updatedAt: null }
    }
}

/**
 * Recupera e descriptografa a chave API da OpenAI.
 * Uso exclusivo no servidor.
 */
export async function getDecryptedOpenAIKey(): Promise<string | null> {
    console.log('[DEBUG] getDecryptedOpenAIKey: Início')
    try {
        // Validação básica de segurança (opcional, já que a action é servidora)
        // Mas vamos garantir que quem chama é um Role autorizado se possível
        const user = await getCurrentUser()
        console.log('[DEBUG] Usuário atual:', { userId: user?.id, role: user?.role })

        if (!user || (user.role !== 'super_admin' && user.role !== 'organizador')) {
            console.error('[ERROR] Acesso negado. Role:', user?.role)
            throw new Error('Acesso não autorizado para recuperar chaves.')
        }

        console.log('[DEBUG] Buscando chave no Supabase...')
        const supabase = await createClient()
        const { data, error } = await supabase
            .from('system_integrations')
            .select('*')
            .eq('provider', 'openai')
            .single()

        console.log('[DEBUG] Resultado da query:', { hasData: !!data, error: error?.message })

        if (error || !data) {
            console.error('[ERROR] Chave não encontrada ou erro na query:', error)
            return null
        }

        console.log('[DEBUG] Descriptografando chave...')
        const decrypted = decrypt({
            ciphertext: data.api_key_ciphertext,
            iv: data.api_key_iv,
            tag: data.api_key_tag
        })

        console.log('[DEBUG] Chave descriptografada com sucesso! (primeiros 10 chars):', decrypted.substring(0, 10))
        return decrypted
    } catch (error) {
        console.error('[ERROR] Erro ao descriptografar chave OpenAI:', error)
        return null
    }
}

/**
 * Salva a API Key da OpenAI criptografada
 */
export async function saveOpenAIConfigAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
    try {
        await validateSuperAdmin()

        const apiKey = (formData.get('api_key') as string || '').trim()

        if (!apiKey) {
            return { error: 'A API Key é obrigatória.' }
        }

        // Criptografar a chave
        // Nota: O utilitário encrypt já valida a existência da APP_ENCRYPTION_KEY_BASE64
        let encrypted: EncryptedData;
        try {
            encrypted = encrypt(apiKey)
        } catch (cryptoError: any) {
            console.error('Erro de criptografia:', cryptoError.message)
            return { error: cryptoError.message }
        }

        const supabase = await createClient()

        const { error } = await supabase
            .from('system_integrations')
            .upsert({
                provider: 'openai',
                api_key_ciphertext: encrypted.ciphertext,
                api_key_iv: encrypted.iv,
                api_key_tag: encrypted.tag,
                updated_at: new Date().toISOString()
            }, { onConflict: 'provider' })

        if (error) {
            console.error('Erro ao salvar config OpenAI no Supabase:', error)
            return { error: 'Erro ao salvar no banco de dados.' }
        }

        revalidatePath('/painel/super-admin/configuracoes/openai')
        return { success: true, message: 'Configuração da OpenAI salva com sucesso!' }
    } catch (error: any) {
        console.error('Erro ao salvar config OpenAI:', error)
        return { error: error.message || 'Erro ao processar solicitação.' }
    }
}

/**
 * Busca as configurações de background de login
 */
export async function getLoginBackgroundAction(): Promise<LoginBackgroundConfig> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('login_background_settings')
            .select('*')
            .eq('key', 'login_background')
            .single()

        if (error || !data) {
            return { desktopImageUrl: null, mobileImageUrl: null, updatedAt: null }
        }

        return {
            desktopImageUrl: data.desktop_image_path,
            mobileImageUrl: data.mobile_image_path,
            updatedAt: data.updated_at
        }
    } catch (error) {
        console.error('Erro ao buscar background login:', error)
        return { desktopImageUrl: null, mobileImageUrl: null, updatedAt: null }
    }
}

/**
 * Salva as configurações de background de login (faz upload das imagens se fornecidas)
 */
export async function saveLoginBackgroundAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
    try {
        await validateSuperAdmin()
        const supabase = await createClient()

        const desktopFile = formData.get('desktopImage') as File | null
        const mobileFile = formData.get('mobileImage') as File | null
        const removeDesktop = formData.get('removeDesktop') === 'true'
        const removeMobile = formData.get('removeMobile') === 'true'

        // Buscar config atual
        const { data: currentConfig } = await supabase
            .from('login_background_settings')
            .select('*')
            .eq('key', 'login_background')
            .single()

        let desktopPath = currentConfig?.desktop_image_path || null
        let mobilePath = currentConfig?.mobile_image_path || null

        // Handle removals
        if (removeDesktop) desktopPath = null
        if (removeMobile) mobilePath = null

        // Handle Desktop Upload
        if (desktopFile && desktopFile.size > 0) {
            const ext = desktopFile.name.split('.').pop() || 'jpg'
            const filePath = `login/desktop_${Date.now()}.${ext}`
            const arrayBuffer = await desktopFile.arrayBuffer()
            const { error: uploadError } = await supabase.storage
                .from('app-assets')
                .upload(filePath, new Uint8Array(arrayBuffer), {
                    contentType: desktopFile.type,
                    upsert: true
                })

            if (uploadError) throw new Error(`Erro upload desktop: ${uploadError.message}`)
            const { data: urlData } = supabase.storage.from('app-assets').getPublicUrl(filePath)
            desktopPath = urlData.publicUrl
        }

        // Handle Mobile Upload
        if (mobileFile && mobileFile.size > 0) {
            const ext = mobileFile.name.split('.').pop() || 'jpg'
            const filePath = `login/mobile_${Date.now()}.${ext}`
            const arrayBuffer = await mobileFile.arrayBuffer()
            const { error: uploadError } = await supabase.storage
                .from('app-assets')
                .upload(filePath, new Uint8Array(arrayBuffer), {
                    contentType: mobileFile.type,
                    upsert: true
                })

            if (uploadError) throw new Error(`Erro upload mobile: ${uploadError.message}`)
            const { data: urlData } = supabase.storage.from('app-assets').getPublicUrl(filePath)
            mobilePath = urlData.publicUrl
        }

        // Upsert no DB
        const { error: dbError } = await supabase
            .from('login_background_settings')
            .upsert({
                key: 'login_background',
                desktop_image_path: desktopPath,
                mobile_image_path: mobilePath,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' })

        if (dbError) throw new Error(`Erro DB: ${dbError.message}`)

        revalidatePath('/painel/super-admin/configuracoes/login')
        revalidatePath('/login')

        return { success: true, message: 'Configuração de background salva com sucesso!' }
    } catch (error: any) {
        console.error('Erro ao salvar background login:', error)
        return { error: error.message || 'Erro ao processar solicitação.' }
    }
}
