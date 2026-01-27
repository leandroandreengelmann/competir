'use client'

import { useActionState, useEffect } from 'react'
import { updateProfileAction } from '@/app/actions/profile-generic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { User, Mail, Phone, Fingerprint, Loader2 } from 'lucide-react'
import { InlineNotice } from '@/components/ui/inline-notice'

interface ProfileFormProps {
    initialData: {
        name: string
        email: string
        cpf: string
        phone?: string | null
    }
}

export function ProfileForm({ initialData }: ProfileFormProps) {
    const [state, action, isPending] = useActionState(updateProfileAction, {})

    return (
        <form action={action} className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Dados Pessoais</CardTitle>
                            <CardDescription>Mantenha suas informações de contato atualizadas.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {state.error && (
                        <InlineNotice variant="error" message={state.error} />
                    )}
                    {state.success && (
                        <InlineNotice variant="success" message={state.message || "Perfil atualizado com sucesso!"} />
                    )}

                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Nome - Editável */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome Completo</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="name"
                                    name="name"
                                    defaultValue={initialData.name}
                                    placeholder="Seu nome"
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        {/* Telefone - Editável */}
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefone / WhatsApp</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="phone"
                                    name="phone"
                                    defaultValue={initialData.phone || ''}
                                    placeholder="(00) 00000-0000"
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        {/* E-mail - Read Only */}
                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    defaultValue={initialData.email}
                                    className="pl-10 bg-muted/50"
                                    disabled
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground">O e-mail não pode ser alterado por motivos de segurança.</p>
                        </div>

                        {/* CPF - Read Only */}
                        <div className="space-y-2">
                            <Label htmlFor="cpf">CPF</Label>
                            <div className="relative">
                                <Fingerprint className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="cpf"
                                    defaultValue={initialData.cpf}
                                    className="pl-10 bg-muted/50"
                                    disabled
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" className="h-11 px-8 min-w-[200px]" disabled={isPending}>
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                        </>
                    ) : 'Salvar alterações'}
                </Button>
            </div>
        </form>
    )
}
