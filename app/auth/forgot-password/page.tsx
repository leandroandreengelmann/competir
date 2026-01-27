"use client"

import * as React from "react"
import Link from "next/link"
import { useActionState, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft, Mail, ChevronRight } from "lucide-react"
import { PublicHeader } from "@/components/public-header"
import { PublicFooter } from "@/components/public-footer"
import { requestPasswordResetAction } from "@/app/actions/auth"
import { InlineNotice } from "@/components/ui/inline-notice"
import { motion } from "framer-motion"

const initialState = {
    error: '',
    success: false
}

export default function ForgotPasswordPage() {
    const [state, action, isPending] = useActionState(requestPasswordResetAction, initialState)
    const [email, setEmail] = useState("")
    const searchParams = useSearchParams()
    const [queryError, setQueryError] = useState<string | null>(null)

    useEffect(() => {
        const error = searchParams.get('error')
        if (error === 'link_invalido') {
            setQueryError("O link de recuperação é inválido ou expirou. Solicite um novo.")
        } else if (error === 'exchange_failed') {
            setQueryError("Não foi possível validar o link. Por favor, tente novamente.")
        } else if (error === 'missing_code') {
            setQueryError("Código de recuperação ausente. Use o link do e-mail.")
        }
    }, [searchParams])

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <PublicHeader />
            <div className="flex-1 flex items-center justify-center p-4 py-16 relative overflow-hidden">
                {/* Efeito decorativo de fundo */}
                <div className="absolute top-1/4 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-secondary/10 rounded-full blur-3xl opacity-50" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
                        <CardHeader className="text-center space-y-2 pb-8">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2 text-primary">
                                <Mail className="w-6 h-6" />
                            </div>
                            <CardTitle className="text-2xl font-bold tracking-tight">
                                Recuperar senha
                            </CardTitle>
                            <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
                                Informe seu e-mail para receber um link de redefinição de segurança.
                            </p>
                        </CardHeader>

                        <form action={action}>
                            <CardContent className="space-y-4">
                                {state.error && (
                                    <InlineNotice
                                        variant="error"
                                        message={state.error}
                                        compact
                                    />
                                )}

                                {queryError && (
                                    <InlineNotice
                                        variant="error"
                                        message={queryError}
                                        compact
                                    />
                                )}

                                {state.success ? (
                                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center space-y-4">
                                        <p className="text-sm text-primary font-medium">
                                            E-mail enviado com sucesso!
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Se existir uma conta com <strong>{email}</strong>, em instantes você receberá as instruções para criar sua nova senha.
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            asChild
                                        >
                                            <Link href="/login">
                                                Ir para o Login
                                            </Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
                                            <div className="relative group">
                                                <Input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    placeholder="seu@email.com"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                    className="pl-10 h-11 transition-all group-hover:border-primary/50 focus:ring-primary/20"
                                                />
                                                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            </div>
                                        </div>
                                        <Button
                                            className="w-full font-semibold h-11 gap-2 shadow-lg shadow-primary/20"
                                            disabled={isPending}
                                        >
                                            {isPending ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <>
                                                    Enviar link de recuperação
                                                    <ChevronRight className="w-4 h-4" />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </CardContent>

                            <CardFooter className="flex flex-col pt-2 pb-6 border-t border-border/10 mt-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full font-medium gap-2 text-muted-foreground hover:text-primary transition-colors h-10"
                                    asChild
                                >
                                    <Link href="/login">
                                        <ArrowLeft className="h-4 w-4" />
                                        Voltar para o login
                                    </Link>
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </motion.div>
            </div>
            <PublicFooter />
        </div>
    )
}
