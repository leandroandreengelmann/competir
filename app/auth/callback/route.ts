import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/auth/reset-password'

    // Detectar a base da URL atual de forma confiável (ex: competir.app.br)
    const requestUrl = new URL(request.url)
    let host = request.headers.get('host') || requestUrl.host

    // Força o prefixo www no domínio de produção para consistência
    if (host === 'competir.app.br') {
        host = `www.${host}`
    }

    const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
    const origin = `${protocol}://${host}`

    // URL final para onde redirecionar após o processamento
    const redirectUrl = new URL(next, origin)
    const response = NextResponse.redirect(redirectUrl)

    if (code) {
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
                            // Garantir que os cookies sejam propagados para a resposta de redirecionamento
                            response.cookies.set(name, value, options)
                        })
                    },
                },
            }
        )

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            return response
        }

        console.error('[Auth Callback] Exchange failed:', error.message)
        return NextResponse.redirect(`${origin}/auth/forgot-password?error=exchange_failed`)
    }

    // Sem code - erro
    return NextResponse.redirect(`${origin}/auth/forgot-password?error=missing_code`)
}
