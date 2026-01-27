import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MobileNav } from '@/components/mobile-nav'
import { OrganizerSidebar } from '@/components/organizer-sidebar'
import { AppHeader } from '@/components/app-header'

export default async function OrganizadorLayout({
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

    if (!profile || profile.role !== 'organizador') {
        redirect('/login')
    }

    return (
        <div className="flex min-h-screen bg-background">
            {/* Desktop Sidebar */}
            <OrganizerSidebar className="hidden lg:flex" />

            {/* Content Column - fica ao lado da sidebar */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header Desktop */}
                <AppHeader userName={profile.name} role={profile.role} />

                {/* Mobile Header & Nav */}
                <MobileNav title="Organizador" role="organizador" />

                {/* Main Content */}
                <main className="flex-1 relative">
                    <div className="p-4 sm:p-6 lg:p-8 pt-20 md:pt-4 max-w-[1400px] mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
