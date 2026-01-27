"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useActionState } from "react"
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
import { Loader2, Lock, ShieldCheck, ChevronRight } from "lucide-react"
import { resetPasswordAction } from "@/app/actions/auth"
import { InlineNotice } from "@/components/ui/inline-notice"
import { motion } from "framer-motion"

const initialState = {
    error: '',
    success: false
}

export function ResetPasswordForm() {
    const [state, action, isPending] = useActionState(resetPasswordAction, initialState)
    const router = useRouter()

    React.useEffect(() => {
        if (state.success) {
            const timer = setTimeout(() => {
                router.push("/login")
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [state.success, router])

    return (
        <div className="flex items-center justify-center p-4 py-16 relative overflow-hidden">
            {/* Efeito decorativo de fundo */}
            <div className="absolute top-1/4 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-1/4 -left-20 w-64 h-64 bg-secondary/10 rounded-full blur-3xl opacity-50" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-md"
            >
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-xl">
                    <CardHeader className="text-center space-y-2 pb-8">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2 text-primary">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-2xl font-bold tracking-tight">
                            Nova senha
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Crie uma senha forte para proteger sua conta.
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

                            {state.success ? (
                                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center space-y-3">
                                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <ShieldCheck className="w-5 h-5 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-primary">Senha redefinida!</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Sua senha foi atualizada com sucesso. Redirecionando para o login em instantes...
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Nova senha</Label>
                                        <div className="relative group">
                                            <Input
                                                id="password"
                                                name="password"
                                                type="password"
                                                placeholder="Mínimo 8 caracteres"
                                                required
                                                autoFocus
                                                className="pl-10 h-11 transition-all group-hover:border-primary/50 focus:ring-primary/20"
                                            />
                                            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
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
                                </div>
                            )}
                        </CardContent>

                        {!state.success && (
                            <CardFooter className="flex flex-col pt-2 pb-8">
                                <Button
                                    className="w-full font-semibold h-11 gap-2 shadow-lg shadow-primary/20"
                                    disabled={isPending}
                                >
                                    {isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            Salvar nova senha
                                            <ChevronRight className="w-4 h-4" />
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        )}
                    </form>
                </Card>
            </motion.div>
        </div>
    )
}
