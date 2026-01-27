'use client'

import { useActionState, useEffect, useRef } from 'react'
import { changePasswordAction } from '@/app/actions/profile-generic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ShieldAlert, KeyRound, Lock, CheckCircle2, Loader2 } from 'lucide-react'
import { InlineNotice } from '@/components/ui/inline-notice'

export function PasswordForm() {
    const [state, action, isPending] = useActionState(changePasswordAction, {})
    const formRef = useRef<HTMLFormElement>(null)

    useEffect(() => {
        if (state.success) {
            formRef.current?.reset()
        }
    }, [state.success])

    return (
        <form action={action} ref={formRef} className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <ShieldAlert className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Segurança da Conta</CardTitle>
                            <CardDescription>Recomendamos trocar sua senha periodicamente.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {state.error && (
                        <InlineNotice variant="error" message={state.error} />
                    )}
                    {state.success && (
                        <InlineNotice variant="success" message={state.message || "Senha alterada com sucesso!"} />
                    )}

                    <div className="grid gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Senha Atual</Label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="currentPassword"
                                    name="currentPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">Nova Senha</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="newPassword"
                                        name="newPassword"
                                        type="password"
                                        placeholder="Min. 8 caracteres"
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                                <div className="relative">
                                    <CheckCircle2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        placeholder="Repita a nova senha"
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 p-4 rounded-lg bg-muted/50 border text-xs text-muted-foreground space-y-2">
                        <p className="font-semibold text-foreground">Requisitos de Segurança:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Mínimo de 8 caracteres</li>
                            <li>A senha atual deve estar correta</li>
                            <li>A nova senha deve ser diferente da atual (recomendado)</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" className="h-11 px-8 min-w-[200px]" disabled={isPending}>
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processando...
                        </>
                    ) : 'Salvar nova senha'}
                </Button>
            </div>
        </form>
    )
}
