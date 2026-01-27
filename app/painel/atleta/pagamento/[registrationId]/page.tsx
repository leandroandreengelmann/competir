import { getCurrentUser } from "@/app/actions/user"
import { getRegistrationAction } from "@/app/actions/registrations"
import { redirect, notFound } from "next/navigation"
import { PaymentPageClient } from "./payment-page-client"

export default async function PaymentPage({ params }: { params: Promise<{ registrationId: string }> }) {
    const user = await getCurrentUser()
    const { registrationId } = await params

    if (!user) {
        redirect('/login')
    }

    if (user.role !== 'atleta') {
        redirect('/painel/organizador')
    }

    // Validar ownership da inscrição
    const registration = await getRegistrationAction(registrationId)
    if (!registration) {
        notFound()
    }

    // Se status não for pending_payment, redirecionar
    if (registration.status !== 'pending_payment') {
        redirect('/painel/atleta')
    }

    return (
        <PaymentPageClient
            registrationId={registration.id}
            registrationData={{
                id: registration.id,
                event_name: registration.event_name || '',
                belt: registration.belt || '',
                age_group: registration.age_group || '',
                amount_cents: registration.amount_cents,
                status: registration.status
            }}
        />
    )
}
