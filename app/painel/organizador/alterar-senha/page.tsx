import { PasswordForm } from "@/components/profile/password-form"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default async function OrganizerPasswordPage() {
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
                <h1 className="text-2xl font-bold tracking-tight">Alterar Senha</h1>
                <p className="text-muted-foreground">
                    Mantenha sua conta segura com uma senha forte.
                </p>
            </div>

            <div className="max-w-2xl">
                <PasswordForm />
            </div>
        </div>
    )
}
