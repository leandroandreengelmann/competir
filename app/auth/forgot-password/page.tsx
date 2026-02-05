"use client"

import * as React from "react"
import Link from "next/link"
import { useActionState, useEffect, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
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
import { Loader2, ArrowLeft, Mail, ChevronRight, KeyRound, Lock, ShieldCheck } from "lucide-react"
import { PublicHeader } from "@/components/public-header"
import { PublicFooter } from "@/components/public-footer"
import { requestPasswordResetAction, verifyOtpAndResetPasswordAction } from "@/app/actions/auth"
import { InlineNotice } from "@/components/ui/inline-notice"
import { motion, AnimatePresence } from "framer-motion"

const initialRequestState = {
    error: '',
    success: false
}

const initialOtpState = {
    error: '',
    success: false
}

export default function ForgotPasswordPage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Estados do formulário
    const [step, setStep] = useState<'email' | 'otp'>('email')
    const [email, setEmail] = useState("")

    // Cooldown para reenvio
    const [cooldown, setCooldown] = useState(0)

    // Query errors
    const [queryError, setQueryError] = useState<string | null>(null)

    // Actions
    const [requestState, requestAction, isRequestPending] = useActionState(requestPasswordResetAction, initialRequestState)
    const [otpState, otpAction, isOtpPending] = useActionState(verifyOtpAndResetPasswordAction, initialOtpState)

    // Processar erros de query string
    useEffect(() => {
        const error = searchParams.get('error')
        if (error === 'link_invalido') {
            setQueryError("O link de recuperação é inválido ou expirou. Use o código enviado por email.")
        } else if (error === 'exchange_failed') {
            setQueryError("Não foi possível validar o link. Use o código enviado por email.")
        } else if (error === 'missing_code') {
            setQueryError("Código de recuperação ausente. Solicite um novo abaixo.")
        }
    }, [searchParams])

    // Quando o email for enviado com sucesso, mudar para step OTP
    useEffect(() => {
        if (requestState.success) {
            setStep('otp')
            setCooldown(60) // 60 segundos de cooldown
        }
    }, [requestState.success])

    // Cooldown timer
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [cooldown])

    // Quando a senha for redefinida com sucesso
    useEffect(() => {
        if (otpState.success) {
            const timer = setTimeout(() => {
                router.push("/login?message=password_reset")
            }, 2000)
            return () => clearTimeout(timer)
        }
    }, [otpState.success, router])

    // Reenviar código
    const handleResend = useCallback(async () => {
        if (cooldown > 0) return

        const formData = new FormData()
        formData.append('email', email)

        // Disparar a action manualmente
        const result = await requestPasswordResetAction(initialRequestState, formData)
        if (result.success) {
            setCooldown(60)
        }
    }, [cooldown, email])

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <PublicHeader />
            <div className="flex-1 flex items-center justify-center p-4 py-16 relative overflow-hidden">
                {/* Efeito decorativo de fundo */}
                <div className="absolute top-1/4 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-secondary/10 rounded-full blur-3xl opacity-50" />

                <AnimatePresence mode="wait">
                    {step === 'email' ? (
                        <motion.div
                            key="email-step"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
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
                                        Informe seu e-mail para receber um código de verificação.
                                    </p>
                                </CardHeader>

                                <form action={requestAction}>
                                    <CardContent className="space-y-4">
                                        {requestState.error && (
                                            <InlineNotice
                                                variant="error"
                                                message={requestState.error}
                                                compact
                                            />
                                        )}

                                        {queryError && (
                                            <InlineNotice
                                                variant="warning"
                                                message={queryError}
                                                compact
                                            />
                                        )}

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
                                            disabled={isRequestPending}
                                        >
                                            {isRequestPending ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <>
                                                    Enviar código
                                                    <ChevronRight className="w-4 h-4" />
                                                </>
                                            )}
                                        </Button>
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
                    ) : (
                        <motion.div
                            key="otp-step"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="w-full max-w-md"
                        >
                            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
                                <CardHeader className="text-center space-y-2 pb-6">
                                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2 text-primary">
                                        <KeyRound className="w-6 h-6" />
                                    </div>
                                    <CardTitle className="text-2xl font-bold tracking-tight">
                                        Digite o código
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        Enviamos um código de 8 dígitos para <strong className="text-foreground">{email}</strong>
                                    </p>
                                </CardHeader>

                                <form action={otpAction}>
                                    <input type="hidden" name="email" value={email} />
                                    <CardContent className="space-y-4">
                                        {otpState.error && (
                                            <InlineNotice
                                                variant="error"
                                                message={otpState.error}
                                                compact
                                            />
                                        )}

                                        {otpState.success ? (
                                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center space-y-3">
                                                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                                    <ShieldCheck className="w-5 h-5 text-primary" />
                                                </div>
                                                <h3 className="font-semibold text-primary">Senha redefinida!</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Redirecionando para o login...
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {/* Código OTP */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="token" className="text-sm font-medium">Código de verificação</Label>
                                                    <div className="relative group">
                                                        <Input
                                                            id="token"
                                                            name="token"
                                                            type="text"
                                                            inputMode="numeric"
                                                            placeholder="00000000"
                                                            maxLength={8}
                                                            required
                                                            autoFocus
                                                            className="pl-10 h-11 text-center text-lg font-mono tracking-[0.3em] transition-all group-hover:border-primary/50 focus:ring-primary/20"
                                                        />
                                                        <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                    </div>
                                                </div>

                                                {/* Nova senha */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="password" className="text-sm font-medium">Nova senha</Label>
                                                    <div className="relative group">
                                                        <Input
                                                            id="password"
                                                            name="password"
                                                            type="password"
                                                            placeholder="Mínimo 8 caracteres"
                                                            required
                                                            className="pl-10 h-11 transition-all group-hover:border-primary/50 focus:ring-primary/20"
                                                        />
                                                        <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                    </div>
                                                </div>

                                                {/* Confirmar senha */}
                                                <div className="space-y-2">
                                                    <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar senha</Label>
                                                    <div className="relative group">
                                                        <Input
                                                            id="confirmPassword"
                                                            name="confirmPassword"
                                                            type="password"
                                                            placeholder="Repita a nova senha"
                                                            required
                                                            className="pl-10 h-11 transition-all group-hover:border-primary/50 focus:ring-primary/20"
                                                        />
                                                        <ShieldCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                    </div>
                                                </div>

                                                <Button
                                                    className="w-full font-semibold h-11 gap-2 shadow-lg shadow-primary/20"
                                                    disabled={isOtpPending}
                                                >
                                                    {isOtpPending ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            Salvar nova senha
                                                            <ChevronRight className="w-4 h-4" />
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>

                                    {!otpState.success && (
                                        <CardFooter className="flex flex-col gap-2 pt-2 pb-6 border-t border-border/10 mt-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="w-full font-medium text-muted-foreground hover:text-primary transition-colors h-10"
                                                onClick={handleResend}
                                                disabled={cooldown > 0}
                                            >
                                                {cooldown > 0 ? (
                                                    `Reenviar código em ${cooldown}s`
                                                ) : (
                                                    "Reenviar código"
                                                )}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="w-full font-medium gap-2 text-muted-foreground hover:text-primary transition-colors h-10"
                                                onClick={() => {
                                                    setStep('email')
                                                    setQueryError(null)
                                                }}
                                            >
                                                <ArrowLeft className="h-4 w-4" />
                                                Usar outro e-mail
                                            </Button>
                                        </CardFooter>
                                    )}
                                </form>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <PublicFooter />
        </div>
    )
}
