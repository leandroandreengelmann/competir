import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/painel'

    console.log('[Auth Callback] Início da troca de código. Code:', !!code, 'Next:', next)

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            console.log('[Auth Callback] Troca de código realizada com sucesso. Redirecionando para:', next)
            // Se a troca do código funcionar, redireciona para a página definida (geralmente reset-password)
            return NextResponse.redirect(`${origin}${next}`)
        }

        console.error('[Auth Callback] Erro na troca de código:', error)
    }

    console.warn('[Auth Callback] Falha ou código ausente. Redirecionando para forgot-password.')
    // Caso ocorra erro ou não tenha código, volta para recuperar senha com erro
    return NextResponse.redirect(`${origin}/auth/forgot-password?error=exchange_failed`)
}
