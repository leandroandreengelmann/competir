import { getCurrentUser } from "@/app/actions/user"
import { getRegistrationAction } from "@/app/actions/registrations"
import { redirect, notFound } from "next/navigation"
import { PaymentConfirmationClient } from "@/app/painel/atleta/pagamento-confirmado/[registrationId]/confirmation-client"

export default async function PaymentConfirmationPage({
    params
}: {
    params: Promise<{ registrationId: string }>
}) {
    const user = await getCurrentUser()
    const { registrationId } = await params

    if (!user) {
        redirect('/login')
    }

    if (user.role !== 'atleta') {
        redirect('/painel/organizador')
    }

    // Validar ownership e status da inscrição
    const registration = await getRegistrationAction(registrationId)

    if (!registration) {
        notFound()
    }

    // Esta página só deve ser acessível se a inscrição já estiver paga (paid)
    // Se ainda estiver pendente, volta para a tela de checkout
    if (registration.status !== 'paid') {
        redirect(`/painel/atleta/pagamento/${registrationId}`)
    }

    return (
        <PaymentConfirmationClient
            registrationData={{
                id: registration.id,
                event_name: registration.event_name || '',
                belt: registration.belt || '',
                age_group: registration.age_group || '',
                amount_cents: registration.amount_cents
            }}
        />
    )
}
