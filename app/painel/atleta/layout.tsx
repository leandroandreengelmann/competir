import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MobileNav } from '@/components/mobile-nav'
import { AppHeader } from '@/components/app-header'

export default async function AtletaLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Buscar perfil e validar role
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, email, role')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'atleta') {
        redirect('/painel')
    }

    return (
        <div className="min-h-screen bg-background">
            <AppHeader userName={profile.name} role={profile.role} />
            <MobileNav title="Área do Atleta" role="atleta" />
            <main className="pt-20 md:pt-4 p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto w-full">
                {children}
            </main>
        </div>
    )
}
