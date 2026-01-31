export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/app/actions/user'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PublicHeader } from '@/components/public-header'
import { routes } from '@/lib/routes'
import { EventPublicView } from '@/components/event-public/EventPublicView'

interface Event {
    id: string
    name: string
    address: string
    description: string
    date: string
    image_url: string | null
    is_open_for_inscriptions: boolean
}

interface PageProps {
    params: Promise<{ eventId: string }>
}

export default async function EventDetailsPage({ params }: PageProps) {
    const resolvedParams = await params
    const eventId = resolvedParams.eventId

    // UUID validation is less strict than integer
    if (!eventId || eventId.length < 10) {
        notFound()
    }

    const supabase = await createClient()

    // Buscar evento público
    const { data: event } = await supabase
        .from('events')
        .select('id, organizer_id, name, address, address_text, address_formatted, lat, lng, place_id, description, date, image_url, is_open_for_inscriptions, info_published, is_published')
        .eq('id', eventId)
        .single()

    // Buscar usuário para determinar permissão de acesso a eventos privados
    const user = await getCurrentUser()

    if (!event) {
        notFound()
    }

    // Se o evento não estiver publicado, apenas o dono (organizador) pode ver
    if (!event.is_published && (!user || user.id !== event.organizer_id)) {
        notFound()
    }

    // Buscar informações gerais se publicadas
    let publishedInfo = null
    if (event.info_published) {
        const [responsesRes, customRes] = await Promise.all([
            supabase
                .from('event_assistant_responses')
                .select('kb_term, answer_raw')
                .eq('event_id', eventId)
                .eq('status', 'APPROVED')
                .order('sort_order', { ascending: true })
                .order('created_at', { ascending: true }),
            supabase
                .from('event_assistant_custom')
                .select('question_text, answer_text')
                .eq('event_id', eventId)
                .order('created_at', { ascending: true })
        ])

        const responses = responsesRes.data || []
        const customItems = customRes.data || []

        if (responses.length > 0 || customItems.length > 0) {
            // Buscar anexos para as respostas aprovadas
            const { data: attachments } = await supabase
                .from('event_assistant_attachments')
                .select('*')
                .eq('event_id', eventId)

            // Organizar anexos por termo e gerar Signed URLs se necessário
            const attachmentsMap: Record<string, any[]> = {}
            if (attachments) {
                for (const att of attachments) {
                    let fileUrl = att.file_url

                    // Se for imagem, tentar gerar signed URL (Storage pode ser privado)
                    if (att.file_type.startsWith('image/')) {
                        const urlParts = att.file_url.split('/event-attachments/')
                        if (urlParts.length >= 2) {
                            const filePath = urlParts[1].split('?')[0]
                            const { data } = await supabase.storage
                                .from('event-attachments')
                                .createSignedUrl(filePath, 3600) // 1 hora
                            if (data?.signedUrl) fileUrl = data.signedUrl
                        }
                    }

                    if (!attachmentsMap[att.kb_term]) attachmentsMap[att.kb_term] = []
                    attachmentsMap[att.kb_term].push({ ...att, file_url: fileUrl })
                }
            }

            publishedInfo = { responses, customItems, attachmentsMap }
        }
    }

    // Buscar usuário para determinar fluxo de inscrição (já buscado acima)
    // const user = await getCurrentUser()

    const formattedDate = new Date(event.date).toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    })

    // Gerar link do Google Maps
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`

    // Determinar URL de inscrição
    const inscriptionUrl = !user
        ? routes.loginWithNext(routes.athleteEventRegistration(event.id))
        : user.role === 'atleta'
            ? routes.athleteEventRegistration(event.id)
            : `/painel/${user.role === 'organizador' ? 'organizador' : 'super-admin'}`

    return (
        <EventPublicView
            event={event}
            user={user}
            publishedInfo={publishedInfo}
            inscriptionUrl={inscriptionUrl}
        />
    )
}
