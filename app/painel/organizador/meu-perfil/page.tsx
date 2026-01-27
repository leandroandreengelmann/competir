import { getProfileDataAction } from "@/app/actions/profile-generic"
import { ProfileForm } from "@/components/profile/profile-form"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default async function OrganizerProfilePage() {
    const profileData = await getProfileDataAction()

    if (!profileData) {
        return <div>Erro ao carregar dados do perfil.</div>
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumb / Back */}
            <div className="flex items-center gap-2">
                <Link
                    href="/painel/organizador"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Voltar ao Dashboard
                </Link>
            </div>

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Meu Perfil</h1>
                <p className="text-muted-foreground">
                    Gerencie suas informações de contato e dados pessoais.
                </p>
            </div>

            <div className="max-w-4xl">
                <ProfileForm initialData={profileData} />
            </div>
        </div>
    )
}
