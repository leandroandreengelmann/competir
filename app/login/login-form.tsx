"use client"

import { useActionState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
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
import { loginAction } from "@/app/actions/auth"
import { Loader2 } from "lucide-react"
import { InlineNotice } from "@/components/ui/inline-notice"

const initialState = {
    error: '',
    success: false
}

export function LoginForm() {
    const [state, action, isPending] = useActionState(loginAction, initialState)
    const searchParams = useSearchParams()
    const returnEvent = searchParams.get('returnEvent')
    const next = searchParams.get('next')

    return (
        <Card className="w-full max-w-sm border-border/50 shadow-2xl bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center space-y-2">
                <CardTitle className="text-2xl font-bold tracking-tight">
                    Entrar
                </CardTitle>
                <p className="text-sm text-muted-foreground font-medium">
                    Competir
                </p>
                {returnEvent && (
                    <p className="text-sm text-muted-foreground">
                        Faça login para demonstrar interesse no evento
                    </p>
                )}
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
                    {returnEvent && (
                        <input type="hidden" name="returnEvent" value={returnEvent} />
                    )}
                    {next && (
                        <input type="hidden" name="next" value={next} />
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input id="email" name="email" type="email" placeholder="Seu e-mail" required className="bg-white/50" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password">Senha</Label>
                            <Link
                                href="/auth/forgot-password"
                                className="text-xs text-muted-foreground hover:text-primary transition-colors hover:underline"
                            >
                                Esqueci minha senha
                            </Link>
                        </div>
                        <Input id="password" name="password" type="password" placeholder="Sua senha" required className="bg-white/50" />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Button className="w-full font-bold h-11" size="lg" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Entrar
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        className="w-full font-bold h-11 bg-white/50"
                        asChild
                    >
                        <Link href={returnEvent ? `/signup?returnEvent=${returnEvent}` : "/signup"}>
                            Cadastrar-se
                        </Link>
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
