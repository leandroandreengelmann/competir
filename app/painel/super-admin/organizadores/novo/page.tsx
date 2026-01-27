"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useActionState } from "react"
import { createOrganizerAction } from "@/app/actions/organizers"
import { useEffect } from "react"

export default function NovoOrganizadorPage() {
    const router = useRouter()
    const [state, formAction] = useActionState(createOrganizerAction, {})

    // Redirect on success
    useEffect(() => {
        if (state.success) {
            router.push("/painel/super-admin/organizadores")
        }
    }, [state.success, router])

    const handleCancel = () => {
        router.push("/painel/super-admin/organizadores")
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Novo Organizador</h1>
                <p className="text-muted-foreground mt-2">
                    Cadastre um novo organizador no sistema.
                </p>
            </div>

            {/* Form Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Dados do Organizador</CardTitle>
                    <CardDescription>
                        Preencha as informações abaixo
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-6">
                        {/* Success/Error Messages */}
                        {state.error && (
                            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                                <p className="text-sm text-destructive font-medium">{state.error}</p>
                            </div>
                        )}
                        {state.message && (
                            <div className="p-3 rounded-md bg-success/10 border border-success/20">
                                <p className="text-sm text-success font-medium">{state.message}</p>
                            </div>
                        )}

                        {/* Nome */}
                        <div className="space-y-2">
                            <Label htmlFor="nome">Nome *</Label>
                            <Input
                                id="nome"
                                name="nome"
                                type="text"
                                placeholder="Nome completo do organizador"
                                required
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="email@exemplo.com"
                                required
                            />
                        </div>

                        {/* Senha */}
                        <div className="space-y-2">
                            <Label htmlFor="senha">Senha *</Label>
                            <Input
                                id="senha"
                                name="senha"
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                required
                                minLength={6}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1"
                            >
                                Salvar
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
