import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function PainelPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Buscar perfil para saber para onde redirecionar
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile) {
        redirect('/login')
    }

    // Redirecionamento baseado na role
    if (profile.role === 'super_admin') {
        redirect('/painel/super-admin')
    } else if (profile.role === 'organizador') {
        redirect('/painel/organizador')
    } else {
        redirect('/painel/atleta')
    }
}
