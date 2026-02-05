import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/painel'

    console.log('[Auth Callback] Início. Code presente:', !!code, '| Destino:', next)

    if (code) {
        // Cria a resposta de redirecionamento antecipadamente
        const redirectUrl = `${origin}${next}`
        const response = NextResponse.redirect(redirectUrl)

        // Cria o cliente Supabase com acesso direto aos cookies da request E da response
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            // Grava os cookies diretamente na RESPONSE (não na request)
                            response.cookies.set(name, value, options)
                        })
                    },
                },
            }
        )

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            console.log('[Auth Callback] Sessão criada com sucesso. Redirecionando para:', next)
            // Retorna a response que já tem os cookies gravados
            return response
        }

        console.error('[Auth Callback] Erro na troca de código:', JSON.stringify(error))
    }

    console.warn('[Auth Callback] Falha ou código ausente. Voltando para forgot-password.')
    return NextResponse.redirect(`${origin}/auth/forgot-password?error=exchange_failed`)
}
