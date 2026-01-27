'use server'

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/app/actions/user"

type ActionState = {
    success?: boolean
    message?: string
    error?: string
}

// Helper para salvar imagem de evento no Supabase Storage
async function saveEventImage(userId: string, eventId: string, imageFile: File): Promise<string> {
    try {
        const adminClient = createAdminClient()

        // Extensão do arquivo
        const ext = imageFile.name.split('.').pop() || 'jpg'

        // Path: {userId}/{eventId}_divulgacao.{ext}
        const filePath = `${userId}/${eventId}_divulgacao.${ext}`

        // Converter File para ArrayBuffer
        const arrayBuffer = await imageFile.arrayBuffer()
        const buffer = new Uint8Array(arrayBuffer)

        // Upload para Supabase Storage
        const { error } = await adminClient.storage
            .from('events')
            .upload(filePath, buffer, {
                contentType: imageFile.type,
                upsert: true
            })

        if (error) {
            console.error('Erro ao fazer upload:', error)
            throw new Error('Falha ao salvar imagem')
        }

        // Retornar URL pública
        const { data: publicUrl } = adminClient.storage
            .from('events')
            .getPublicUrl(filePath)

        return publicUrl.publicUrl
    } catch (error) {
        console.error('Erro ao salvar imagem:', error)
        throw new Error('Falha ao salvar imagem')
    }
}

export async function createEventAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const user = await getCurrentUser()

    if (!user || user.role !== 'organizador') {
        return { error: 'Acesso negado. Apenas organizadores podem criar eventos.' }
    }

    const name = formData.get('eventName') as string
    const address_text = formData.get('address_text') as string
    const address_formatted = formData.get('address_formatted') as string
    const lat = formData.get('lat') ? parseFloat(formData.get('lat') as string) : null
    const lng = formData.get('lng') ? parseFloat(formData.get('lng') as string) : null
    const place_id = formData.get('place_id') as string
    const date = formData.get('eventDate') as string
    const imageFile = formData.get('eventImage') as File | null

    if (!name || !address_text || !date || lat === null || lng === null) {
        return { error: 'Preencha todos os campos obrigatórios, incluindo o endereço no mapa.' }
    }

    try {
        const supabase = await createClient()

        // Inserir evento primeiro (sem imagem)
        const { data: event, error: insertError } = await supabase
            .from('events')
            .insert({
                organizer_id: user.id,
                name,
                address: address_text, // Keep compatibility with existing field
                address_text,
                address_formatted,
                lat,
                lng,
                place_id,
                date,
                image_url: null,
                is_open_for_inscriptions: false,
                is_published: false
            })
            .select('id')
            .single()

        if (insertError) {
            console.error('Erro ao criar evento:', insertError)
            return { error: 'Erro ao salvar evento. Tente novamente.' }
        }

        // Se houver imagem, salvar e atualizar
        if (imageFile && imageFile.size > 0) {
            const imageUrl = await saveEventImage(user.id, event.id, imageFile)

            await supabase
                .from('events')
                .update({ image_url: imageUrl })
                .eq('id', event.id)
        }

        revalidatePath('/painel/organizador/eventos')

        return { success: true, message: 'Evento cadastrado com sucesso!' }
    } catch (error) {
        console.error('Erro ao criar evento:', error)
        return { error: 'Erro ao salvar evento. Tente novamente.' }
    }
}

export async function updateEventAction(eventId: string, prevState: ActionState, formData: FormData): Promise<ActionState> {
    const user = await getCurrentUser()

    if (!user || user.role !== 'organizador') {
        return { error: 'Não autorizado.' }
    }

    const name = formData.get('eventName') as string
    const address_text = formData.get('address_text') as string
    const address_formatted = formData.get('address_formatted') as string
    const lat = formData.get('lat') ? parseFloat(formData.get('lat') as string) : null
    const lng = formData.get('lng') ? parseFloat(formData.get('lng') as string) : null
    const place_id = formData.get('place_id') as string
    const date = formData.get('eventDate') as string
    const imageFile = formData.get('eventImage') as File | null
    const removeImage = formData.get('removeImage') === 'true'

    if (!name || !address_text || !date || lat === null || lng === null) {
        return { error: 'Preencha todos os campos obrigatórios, incluindo o endereço no mapa.' }
    }

    try {
        const supabase = await createClient()
        let imageUrl: string | null | undefined = undefined

        // Se houver imagem nova, salvar
        if (imageFile && imageFile.size > 0) {
            imageUrl = await saveEventImage(user.id, eventId, imageFile)
        }

        // Se marcou para remover, setar NULL
        if (removeImage) {
            imageUrl = null
        }

        // Montar objeto de update
        const updateData: any = {
            name,
            address: address_text, // Keep compatibility
            address_text,
            address_formatted,
            lat,
            lng,
            place_id,
            date,
            updated_at: new Date().toISOString()
        }

        if (imageUrl !== undefined) {
            updateData.image_url = imageUrl
        }

        const { error } = await supabase
            .from('events')
            .update(updateData)
            .eq('id', eventId)
            .eq('organizer_id', user.id) // RLS backup

        if (error) {
            console.error('Erro ao atualizar evento:', error)
            return { error: 'Erro ao atualizar evento. Tente novamente.' }
        }

        revalidatePath('/painel/organizador/eventos')
        revalidatePath(`/painel/organizador/eventos/${eventId}`)

        return { success: true, message: 'Evento atualizado com sucesso!' }
    } catch (error) {
        console.error('Erro ao atualizar evento:', error)
        return { error: 'Erro ao atualizar evento. Tente novamente.' }
    }
}
