import { redirect } from 'next/navigation'
import { getAthleteProfileDataAction } from '@/app/actions/athlete-profile'
import { ProfileForm } from './profile-form'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata = {
    title: 'Meu Perfil | Competir',
    description: 'Gerencie seus dados e informações de atleta.'
}

export default async function ProfilePage() {
    const profileData = await getAthleteProfileDataAction()

    if (!profileData) {
        redirect('/login')
    }

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
                    <h1 className="text-3xl font-bold tracking-tight">Meu perfil</h1>
                    <p className="text-muted-foreground mt-1">
                        Mantenha seus dados atualizados para facilitar as inscrições em eventos.
                    </p>
                </div>
            </div>

            <div className="max-w-3xl">
                <ProfileForm initialData={profileData} />
            </div>
        </div>
    )
}
