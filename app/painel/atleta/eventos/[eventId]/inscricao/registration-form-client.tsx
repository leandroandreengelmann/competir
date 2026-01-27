"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar, MapPin, Loader2, CheckCircle2 } from "lucide-react"
import { createRegistrationAction } from "@/app/actions/registrations"
import { toast } from "sonner"

interface Event {
    id: string
    name: string
    address: string
    date: string
}

interface Category {
    id: string
    belt: string
    min_weight: number
    max_weight: number
    age_group: string
    registration_fee: number
}

interface User {
    id: string
    name: string
    email: string
}

interface RegistrationFormClientProps {
    event: Event
    categories: Category[]
    user: User
    existingCategoryIds?: string[]
}

export function RegistrationFormClient({ event, categories, user, existingCategoryIds = [] }: RegistrationFormClientProps) {
    const router = useRouter()
    const [selectedCategoryId, setSelectedCategoryId] = React.useState<string>("")
    const [isPending, setIsPending] = React.useState(false)

    // Filtrar categorias nas quais o atleta já está inscrito
    const availableCategories = categories.filter(c => !existingCategoryIds.includes(c.id))

    const selectedCategory = availableCategories.find(c => c.id === selectedCategoryId)

    async function handleRegistration() {
        if (!selectedCategoryId) {
            toast.error('Selecione uma categoria')
            return
        }

        setIsPending(true)
        try {
            const result = await createRegistrationAction(event.id, selectedCategoryId)

            if (result.success && result.registrationId) {
                toast.success('Inscrição criada com sucesso!')
                router.push(`/painel/atleta/pagamento/${result.registrationId}`)
            } else {
                toast.error(result.error || 'Erro ao processar inscrição')
                setIsPending(false)
            }
        } catch (error) {
            console.error('Erro ao criar inscrição:', error)
            toast.error('Erro ao processar inscrição')
            setIsPending(false)
        }
    }

    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Inscrição no Evento</h1>
                    <p className="text-muted-foreground mt-1">
                        Complete sua inscrição selecionando uma categoria
                    </p>
                </div>

                {/* Resumo do Evento */}
                <Card>
                    <CardHeader>
                        <CardTitle>{event.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {new Date(event.date).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {event.address}
                        </div>
                    </CardContent>
                </Card>

                {/* Dados do Atleta */}
                <Card>
                    <CardHeader>
                        <CardTitle>Seus Dados</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nome</Label>
                            <Input value={user.name} disabled />
                        </div>
                        <div className="space-y-2">
                            <Label>E-mail</Label>
                            <Input value={user.email} disabled />
                        </div>
                    </CardContent>
                </Card>

                {/* Seleção de Categoria */}
                <Card>
                    <CardHeader>
                        <CardTitle>Selecione uma Categoria</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {availableCategories.length === 0 ? (
                            <div className="text-center py-10 space-y-3">
                                <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-medium text-foreground">
                                        Você já está inscrito em todas as categorias
                                    </p>
                                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                        Não existem outras categorias disponíveis para o seu perfil neste evento no momento.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <RadioGroup value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                                <div className="space-y-3">
                                    {availableCategories.map((category) => (
                                        <div
                                            key={category.id}
                                            className="flex items-start gap-3 p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                                            onClick={() => setSelectedCategoryId(category.id.toString())}
                                        >
                                            <RadioGroupItem
                                                value={category.id.toString()}
                                                id={`category-${category.id}`}
                                                className="mt-1"
                                            />
                                            <div className="flex-1">
                                                <Label
                                                    htmlFor={`category-${category.id}`}
                                                    className="cursor-pointer"
                                                >
                                                    <div className="font-semibold">
                                                        {category.belt} • {category.age_group}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground mt-1">
                                                        Peso: {category.min_weight}kg - {category.max_weight}kg
                                                    </div>
                                                    <div className="text-lg font-bold text-primary mt-2">
                                                        R$ {category.registration_fee.toFixed(2)}
                                                    </div>
                                                </Label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </RadioGroup>
                        )}
                    </CardContent>
                </Card>

                {/* Resumo e Confirmação */}
                {selectedCategory && (
                    <Card className="border-primary">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                                Resumo da Inscrição
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Categoria:</span>
                                <span className="font-semibold">
                                    {selectedCategory.belt} - {selectedCategory.age_group}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Peso:</span>
                                <span className="font-semibold">
                                    {selectedCategory.min_weight}kg - {selectedCategory.max_weight}kg
                                </span>
                            </div>
                            <div className="flex justify-between text-lg">
                                <span className="font-semibold">Valor da Inscrição:</span>
                                <span className="font-bold text-primary">
                                    R$ {selectedCategory.registration_fee.toFixed(2)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Botões */}
                <div className="flex gap-4">
                    <Button
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isPending}
                        className="flex-1"
                    >
                        Voltar
                    </Button>
                    <Button
                        onClick={handleRegistration}
                        disabled={!selectedCategoryId || isPending || categories.length === 0}
                        className="flex-1"
                    >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Continuar para Pagamento
                    </Button>
                </div>
            </div>
        </div>
    )
}
