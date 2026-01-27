import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/auth/reset-password'

    if (process.env.NODE_ENV === 'development') {
        console.log('[Auth Callback] Params:', {
            hasCode: !!code,
            next,
            origin
        })
    }

    // Criar a resposta de redirecionamento antecipadamente
    const response = NextResponse.redirect(`${origin}${next}`)

    // Adicionar um cookie de diagnóstico para ver se o browser aceita cookies no callback
    response.cookies.set('debug-callback', 'ok', { path: '/', maxAge: 60 })

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
                            // Forçar atributos que ajudam no localhost
                            const secure = origin.startsWith('https')
                            response.cookies.set(name, value, {
                                ...options,
                                path: '/',
                                secure
                            })
                        })
                    },
                },
            }
        )

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            if (process.env.NODE_ENV === 'development') {
                console.log('[Auth Callback] Exchange success, redirecting to:', next)
                const cookieHeader = response.headers.get('set-cookie')
                console.log('[Auth Callback] Set-Cookie check:', !!cookieHeader)
            }
            return response
        }

        console.error('[Auth Callback] Exchange failed:', error.message)
        return NextResponse.redirect(`${origin}/auth/forgot-password?error=exchange_failed`)
    }

    // Sem code - erro
    console.warn('[Auth Callback] Missing code parameter')
    return NextResponse.redirect(`${origin}/auth/forgot-password?error=missing_code`)
}
