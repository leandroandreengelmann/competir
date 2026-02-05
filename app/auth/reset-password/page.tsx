import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ResetPasswordForm } from './reset-password-form'
import { PublicHeader } from '@/components/public-header'
import { PublicFooter } from '@/components/public-footer'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ResetPasswordPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Se não tem sessão válida, o link expirou
    // Redirecionar para usar OTP
    if (!user) {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <PublicHeader />
                <div className="flex-1 flex items-center justify-center p-4 py-16 relative overflow-hidden">
                    {/* Efeito decorativo */}
                    <div className="absolute top-1/4 -left-20 w-64 h-64 bg-destructive/10 rounded-full blur-3xl opacity-50" />
                    <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-secondary/10 rounded-full blur-3xl opacity-50" />

                    <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
                        <CardHeader className="text-center space-y-2 pb-6">
                            <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-2 text-amber-500">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <CardTitle className="text-2xl font-bold tracking-tight">
                                Link expirado
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-center">
                            <p className="text-muted-foreground">
                                O link de recuperação expirou ou já foi utilizado.
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Solicite um novo código na tela de recuperação de senha.
                            </p>
                            <Button className="w-full gap-2" asChild>
                                <Link href="/auth/forgot-password">
                                    Solicitar novo código
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
                <PublicFooter />
            </div>
        )
    }

    // Se tem sessão válida (link ainda funciona), permitir trocar senha
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
