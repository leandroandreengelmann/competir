import { getCurrentUser } from "@/app/actions/user"
import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getEventAssistantStateAction, getCustomAssistantItemsAction } from "@/app/actions/event-assistant"
import { AssistantChatClient } from "./assistant-chat-client"
import { HelpModal } from "./help-modal"

async function getEvent(id: string, userId: string) {
    const supabase = await createClient()

    const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .eq('organizer_id', userId)
        .single()

    if (error) return null
    return event
}

export default async function AssistantPage({ params }: { params: Promise<{ eventId: string }> }) {
    const user = await getCurrentUser()
    const { eventId } = await params

    if (!user || user.role !== 'organizador') {
        redirect('/login')
    }

    const event = await getEvent(eventId, user.id)
    if (!event) notFound()

    const kbItems = await getEventAssistantStateAction(eventId)
    const customItems = await getCustomAssistantItemsAction(eventId)

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                        Informações Gerais — Assistente
                    </h1>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                        Responda às perguntas abaixo para montar as informações gerais do seu evento.
                        O assistente vai te orientar, sugerir textos e formatar as respostas antes de publicar.
                    </p>
                </div>
                <HelpModal />
            </div>

            <AssistantChatClient
                eventId={eventId}
                initialKbItems={kbItems}
                initialCustomItems={customItems}
            />
        </div>
    )
}
