import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function PainelLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Buscar dados do perfil para verificar se existe
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile) {
        redirect('/login')
    }

    // Layouts específicos validam o role
    // Este layout apenas garante autenticação

    return (
        <div className="relative min-h-screen">
            {children}
        </div>
    )
}
