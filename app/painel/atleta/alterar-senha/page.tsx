import { PasswordForm } from './password-form'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = {
    title: 'Alterar Senha | Competir',
    description: 'Atualize sua senha de acesso para manter sua conta segura.'
}

export default async function ChangePasswordPage() {
    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col gap-4">
                <Button variant="ghost" size="sm" asChild className="w-fit -ml-2 h-8 text-muted-foreground hover:text-foreground">
                    <Link href="/painel/atleta">
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Voltar para o Painel
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Alterar senha</h1>
                    <p className="text-muted-foreground mt-1">
                        Sua segurança é nossa prioridade. Escolha uma senha forte.
                    </p>
                </div>
            </div>

            <div className="max-w-xl">
                <PasswordForm />
            </div>
        </div>
    )
}
