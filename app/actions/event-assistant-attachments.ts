"use server"

import { getCurrentUser } from "./user"
import { createClient } from "@/lib/supabase/server"

type UploadResult = {
    success: boolean
    attachmentId?: string
    fileUrl?: string
    error?: string
}

type AttachmentRecord = {
    id: string
    event_id: string
    kb_term: string
    file_url: string
    file_name: string
    file_type: string
    file_size: number
    created_at: string
}

/**
 * Upload de arquivo (imagem ou PDF) para uma resposta do assistente
 */
export async function uploadAttachmentAction(
    eventId: string,
    kbTerm: string,
    file: File
): Promise<UploadResult> {
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') {
        return { success: false, error: "Não autorizado" }
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
        return { success: false, error: "Tipo de arquivo não permitido. Use JPG, PNG, WEBP ou PDF." }
    }

    // Validar tamanho (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
        return { success: false, error: "Arquivo muito grande. Tamanho máximo: 10MB." }
    }

    const supabase = await createClient()

    // Verificar ownership do evento
    const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, organizer_id')
        .eq('id', eventId)
        .eq('organizer_id', user.id)
        .single()

    if (eventError || !event) {
        return { success: false, error: "Evento não encontrado" }
    }

    try {
        // Gerar nome único para o arquivo
        const timestamp = Date.now()
        const sanitizedTerm = kbTerm.toLowerCase().replace(/[^a-z0-9]/g, '_')
        const fileExt = file.name.split('.').pop()
        const fileName = `${timestamp}-${file.name.replace(/[^a-z0-9.]/gi, '_')}`
        const filePath = `${user.id}/${eventId}/${sanitizedTerm}/${fileName}`

        // Upload para Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('event-attachments')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (uploadError) {
            console.error('Upload error:', uploadError)
            return { success: false, error: `Erro ao fazer upload: ${uploadError.message}` }
        }

        // Obter URL pública (ou signed URL se bucket for privado)
        const { data: urlData } = supabase.storage
            .from('event-attachments')
            .getPublicUrl(filePath)

        const fileUrl = urlData.publicUrl

        // Salvar registro no banco
        const { data: attachment, error: dbError } = await supabase
            .from('event_assistant_attachments')
            .insert({
                event_id: eventId,
                organizer_id: user.id,
                kb_term: kbTerm,
                file_url: fileUrl,
                file_name: file.name,
                file_type: file.type,
                file_size: file.size
            })
            .select('id')
            .single()

        if (dbError) {
            // Tentar remover arquivo do storage se falhar ao salvar no DB
            await supabase.storage.from('event-attachments').remove([filePath])
            return { success: false, error: "Erro ao salvar registro do arquivo" }
        }

        return {
            success: true,
            attachmentId: attachment.id,
            fileUrl: fileUrl
        }
    } catch (error) {
        console.error('Unexpected error:', error)
        return { success: false, error: "Erro inesperado ao fazer upload" }
    }
}

/**
 * Registra metadados de um anexo que já foi enviado ao Storage pelo Client
 */
export async function registerAttachmentAction(data: {
    eventId: string
    kbTerm: string
    fileUrl: string
    fileName: string
    fileType: string
    fileSize: number
}): Promise<UploadResult> {
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') {
        return { success: false, error: "Não autorizado" }
    }

    const supabase = await createClient()

    // Verificar ownership do evento
    const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id, organizer_id')
        .eq('id', data.eventId)
        .eq('organizer_id', user.id)
        .single()

    if (eventError || !event) {
        return { success: false, error: "Evento não encontrado" }
    }

    // Salvar registro no banco
    const { data: attachment, error: dbError } = await supabase
        .from('event_assistant_attachments')
        .insert({
            event_id: data.eventId,
            organizer_id: user.id,
            kb_term: data.kbTerm,
            file_url: data.fileUrl,
            file_name: data.fileName,
            file_type: data.fileType,
            file_size: data.fileSize
        })
        .select('id')
        .single()

    if (dbError) {
        console.error('DB Error registering attachment:', dbError)
        return { success: false, error: "Erro ao salvar registro do arquivo no banco de dados" }
    }

    return {
        success: true,
        attachmentId: attachment.id,
        fileUrl: data.fileUrl
    }
}

/**
 * Deletar um anexo
 */
export async function deleteAttachmentAction(attachmentId: string): Promise<{ success: boolean; error?: string }> {
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') {
        return { success: false, error: "Não autorizado" }
    }

    const supabase = await createClient()

    // Buscar anexo e verificar ownership
    const { data: attachment, error: fetchError } = await supabase
        .from('event_assistant_attachments')
        .select('*')
        .eq('id', attachmentId)
        .eq('organizer_id', user.id)
        .single()

    if (fetchError || !attachment) {
        return { success: false, error: "Anexo não encontrado" }
    }

    // Extrair path do storage da URL
    const urlParts = attachment.file_url.split('/event-attachments/')
    if (urlParts.length < 2) {
        return { success: false, error: "URL do arquivo inválida" }
    }
    const filePath = urlParts[1].split('?')[0] // Remove query params se houver

    // Deletar do storage
    const { error: storageError } = await supabase.storage
        .from('event-attachments')
        .remove([filePath])

    if (storageError) {
        console.error('Storage delete error:', storageError)
        // Continua mesmo com erro no storage para limpar o DB
    }

    // Deletar registro do banco
    const { error: dbError } = await supabase
        .from('event_assistant_attachments')
        .delete()
        .eq('id', attachmentId)
        .eq('organizer_id', user.id)

    if (dbError) {
        return { success: false, error: "Erro ao deletar registro" }
    }

    return { success: true }
}

/**
 * Listar anexos de uma pergunta específica
 */
export async function getAttachmentsAction(
    eventId: string,
    kbTerm: string
): Promise<AttachmentRecord[]> {
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') {
        return []
    }

    const supabase = await createClient()

    const { data, error } = await supabase
        .from('event_assistant_attachments')
        .select('*')
        .eq('event_id', eventId)
        .eq('kb_term', kbTerm)
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching attachments:', error)
        return []
    }

    return data || []
}
