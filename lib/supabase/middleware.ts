import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Atualiza a sessão
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // Proteção de rotas do Painel (integrado do antigo proxy.ts)
    if (pathname.startsWith('/painel') && !user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('next', pathname)
        return NextResponse.redirect(url)
    }

    // Redirecionamento de usuários logados tentando acessar login/signup
    if (user && (pathname === '/login' || pathname === '/signup')) {
        const url = request.nextUrl.clone()
        // Agora usamos o redirecionador centralizado
        url.pathname = '/painel'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
