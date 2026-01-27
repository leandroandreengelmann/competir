import { getCurrentUser } from "@/app/actions/user"
import { getEventCategoriesForRegistrationAction, getAthleteRegistrationsAction } from "@/app/actions/registrations"
import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { RegistrationFormClient } from "./registration-form-client"

export default async function RegistrationPage({ params }: { params: Promise<{ eventId: string }> }) {
    const user = await getCurrentUser()
    const { eventId } = await params

    if (!user) {
        redirect('/login')
    }

    if (user.role !== 'atleta') {
        redirect('/painel/organizador')
    }

    const supabase = await createClient()

    // Buscar evento
    const { data: event, error } = await supabase
        .from('events')
        .select('id, name, address, date, description, is_open_for_inscriptions')
        .eq('id', eventId)
        .single()

    if (error || !event) {
        notFound()
    }

    // Verificar se inscrições estão abertas
    if (event.is_open_for_inscriptions === false) {
        return (
            <div className="max-w-md mx-auto mt-12 text-center space-y-4">
                <h1 className="text-xl font-semibold">Inscrições Encerradas</h1>
                <p className="text-muted-foreground">
                    As inscrições para este evento foram encerradas.
                </p>
            </div>
        )
    }

    // Buscar categorias disponíveis
    const categories = await getEventCategoriesForRegistrationAction(eventId)

    // Buscar inscrições existentes do atleta neste evento para filtragem
    const allRegistrations = await getAthleteRegistrationsAction()
    const existingCategoryIds = allRegistrations
        .filter((reg: any) => reg.event_id === eventId)
        .map((reg: any) => reg.category_id)

    return (
        <RegistrationFormClient
            event={event}
            categories={categories}
            user={user}
            existingCategoryIds={existingCategoryIds}
        />
    )
}
