import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AuthCallbackPage({
    searchParams,
}: {
    searchParams: Promise<{ code?: string; next?: string }>
}) {
    const { code, next = '/painel' } = await searchParams

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            return redirect(next)
        }
    }

    // Caso ocorra erro na troca do código, redireciona para a página de forgot-password com erro amigável
    return redirect('/auth/forgot-password?error=exchange_failed')
}
