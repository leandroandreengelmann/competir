import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin-sidebar'
import { AppHeader } from '@/components/app-header'
import { MobileNav } from '@/components/mobile-nav'

export default async function SuperAdminLayout({
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

    if (!profile || profile.role !== 'super_admin') {
        redirect('/login')
    }

    return (
        <div className="flex min-h-screen bg-background">
            <AdminSidebar />

            {/* Content Column - fica ao lado da sidebar */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header Desktop */}
                <AppHeader userName={profile.name} role={profile.role} />

                {/* Mobile Nav */}
                <MobileNav title="Super Admin" role="super_admin" />

                {/* Main Content */}
                <main className="flex-1 relative">
                    <div className="p-4 sm:p-6 lg:p-8 pt-20 md:pt-4">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
