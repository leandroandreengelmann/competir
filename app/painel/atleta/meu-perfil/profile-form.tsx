'use client'

import { useActionState } from 'react'
import { updateMyProfileAction } from '@/app/actions/athlete-profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Phone, Mail, Fingerprint, Calendar, Weight, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useEffect } from 'react'

interface ProfileFormProps {
    initialData: {
        name: string
        email: string
        cpf: string
        phone?: string
        birth_date?: string
        weight?: number
        gender?: string
    }
}

export function ProfileForm({ initialData }: ProfileFormProps) {
    const [state, action, isPending] = useActionState(updateMyProfileAction, {})

    useEffect(() => {
        if (state.success) {
            toast.success(state.message || 'Perfil atualizado com sucesso!')
        } else if (state.error) {
            toast.error(state.error)
        }
    }, [state])

    return (
        <form action={action} className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Dados Básicos</CardTitle>
                            <CardDescription>Informações principais da sua conta.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome Completo</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="name"
                                    name="name"
                                    defaultValue={initialData.name}
                                    placeholder="Seu nome completo"
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail (Login)</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    value={initialData.email}
                                    readOnly
                                    disabled
                                    className="pl-10 bg-muted cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cpf">CPF</Label>
                            <div className="relative">
                                <Fingerprint className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="cpf"
                                    value={initialData.cpf}
                                    readOnly
                                    disabled
                                    className="pl-10 bg-muted cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefone / WhatsApp</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="phone"
                                    name="phone"
                                    defaultValue={initialData.phone}
                                    placeholder="(00) 00000-0000"
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Dados de Atleta</CardTitle>
                            <CardDescription>Informações físicas para competições.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="birthDate">Data de Nascimento</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="birthDate"
                                    name="birthDate"
                                    type="date"
                                    defaultValue={initialData.birth_date}
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="weight">Peso Atual (kg)</Label>
                            <div className="relative">
                                <Weight className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="weight"
                                    name="weight"
                                    type="number"
                                    step="0.1"
                                    defaultValue={initialData.weight}
                                    placeholder="80.0"
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="gender">Gênero</Label>
                            <select
                                id="gender"
                                name="gender"
                                defaultValue={initialData.gender || ''}
                                className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="" disabled>Selecione...</option>
                                <option value="masculino">Masculino</option>
                                <option value="feminino">Feminino</option>
                                <option value="outro">Outro/Prefiro não dizer</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" className="h-11 px-8 min-w-[200px]" disabled={isPending}>
                    {isPending ? 'Salvando...' : 'Salvar alterações'}
                </Button>
            </div>
        </form>
    )
}
