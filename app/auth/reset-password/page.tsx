import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { ResetPasswordForm } from './reset-password-form'
import { PublicHeader } from '@/components/public-header'
import { PublicFooter } from '@/components/public-footer'

export const dynamic = 'force-dynamic'

export default async function ResetPasswordPage() {
    const supabase = await createClient()

    const cookieStore = await cookies()
    const { data: { user } } = await supabase.auth.getUser()

    if (process.env.NODE_ENV === 'development') {
        const allCookies = cookieStore.getAll()
        const cookieNames = allCookies.map((c: { name: string }) => c.name)
        const hasDebugCookie = cookieNames.includes('debug-callback')

        console.log('[Reset Password Server] Diagnostic:', {
            hasUser: !!user,
            userId: user?.id,
            sbCookies: cookieNames.filter((n: string) => n.includes('sb-')),
            hasDebugCookie,
            totalCookies: allCookies.length
        })
    }

    // Removido gate de getUser() para evitar loop.
    // A validação de segurança ocorre na Server Action resetPasswordAction.

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <PublicHeader />
            <div className="flex-1">
                <ResetPasswordForm />
            </div>
            <PublicFooter />
        </div>
    )
}
