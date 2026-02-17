"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar, MapPin, Loader2, CheckCircle2, Search, MessageCircle } from "lucide-react"
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
    min_age: number
    max_age: number
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
    const [searchTerm, setSearchTerm] = React.useState("")
    const [isPending, setIsPending] = React.useState(false)

    // Filtrar categorias nas quais o atleta já está inscrito e aplicar busca
    const availableCategories = React.useMemo(() => {
        const filtered = categories.filter(c => !existingCategoryIds.includes(c.id))

        if (!searchTerm) return filtered.slice(0, 5)

        const searchTerms = searchTerm.toLowerCase().trim().split(/\s+/)

        return filtered.filter(c => {
            const belt = c.belt.toLowerCase()
            const ageGroup = c.age_group.toLowerCase()

            // Todas as palavras da busca devem estar presentes (em qualquer ordem)
            return searchTerms.every(term =>
                belt.includes(term) || ageGroup.includes(term)
            )
        })
    }, [categories, existingCategoryIds, searchTerm])

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

                {/* Suporte */}
                <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="bg-green-500/10 p-2 rounded-full">
                            <MessageCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Não encontrou sua categoria?</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Se você não encontrou a sua categoria ou encontrou algum erro em categorias chame nosso suporte, atenderemos imediatamente.
                            </p>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        className="w-full bg-green-500 hover:bg-green-600 text-white transition-all gap-2 border-none shadow-md"
                        onClick={() => window.open("https://wa.me/556697249532", "_blank")}
                    >
                        <MessageCircle className="h-4 w-4" />
                        Chamar no WhatsApp
                    </Button>
                </div>

                {/* Seleção de Categoria */}
                <Card>
                    <CardHeader>
                        <CardTitle>Selecione uma Categoria</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-muted/50 rounded-lg border border-primary/20 space-y-2">
                            <p className="text-base font-bold text-foreground">
                                Como encontrar sua categoria?
                            </p>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Com tantas opções, a busca é o jeito mais fácil.
                                Digite sua <strong>faixa</strong> (ex: <span className="text-primary font-semibold">Branca</span>) para filtrar as categorias abaixo.
                            </p>
                        </div>

                        {/* Campo de Busca */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Tente 'Branca Master' ou 'Absoluto Adulto'..."
                                className="pl-9 h-11 border-primary/20 focus-visible:ring-primary/30"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Aviso de limite de exibição - Apenas quando NÃO há busca */}
                        {!searchTerm && categories.filter(c => !existingCategoryIds.includes(c.id)).length > 5 && (
                            <p className="text-[10px] text-muted-foreground italic px-1">
                                Mostrando as categorias mais comuns. Use a busca para encontrar a sua.
                            </p>
                        )}

                        {availableCategories.length === 0 ? (
                            <div className="text-center py-10 space-y-3">
                                <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                                    {searchTerm ? (
                                        <Search className="h-6 w-6 text-muted-foreground" />
                                    ) : (
                                        <CheckCircle2 className="h-6 w-6 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <p className="font-medium text-foreground">
                                        {searchTerm ? 'Nenhuma categoria encontrada' : 'Você já está inscrito em todas as categorias'}
                                    </p>
                                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                        {searchTerm
                                            ? 'Tente buscar por termos diferentes ou limpe o filtro.'
                                            : 'Não existem outras categorias disponíveis para o seu perfil neste evento no momento.'
                                        }
                                    </p>
                                    {searchTerm && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSearchTerm("")}
                                            className="mt-2 text-primary hover:text-primary/80"
                                        >
                                            Limpar Busca
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <RadioGroup value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                                <div className="space-y-3">
                                    {availableCategories.map((category) => {
                                        const isSelected = selectedCategoryId === category.id.toString();
                                        return (
                                            <div
                                                key={category.id}
                                                className={`flex items-start gap-3 p-4 border rounded-lg transition-all cursor-pointer ${isSelected
                                                    ? 'border-primary ring-1 ring-primary bg-primary/5 shadow-sm'
                                                    : 'hover:bg-accent/50'
                                                    }`}
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
                                                        <div className="text-sm font-bold text-primary">
                                                            {category.min_weight === -1 && category.max_weight === -1 ? (
                                                                null
                                                            ) : category.min_weight === 0 && category.max_weight === 0 ? (
                                                                'Livre'
                                                            ) : (
                                                                `${category.min_weight}kg - ${category.max_weight}kg`
                                                            )}
                                                        </div>
                                                        <div className="text-sm font-bold text-primary">
                                                            {category.min_age === -1 && category.max_age === -1 ? (
                                                                null
                                                            ) : category.min_age === 0 && category.max_age === 0 ? (
                                                                'Idade: Livre'
                                                            ) : (
                                                                `Idade: ${category.min_age} - ${category.max_age} anos`
                                                            )}
                                                        </div>
                                                        <div className="text-lg font-bold text-primary mt-2">
                                                            R$ {category.registration_fee.toFixed(2)}
                                                        </div>
                                                    </Label>
                                                </div>
                                            </div>
                                        );
                                    })}
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
                            {selectedCategory.min_weight !== -1 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Peso:</span>
                                    <span className="font-bold text-primary">
                                        {selectedCategory.min_weight === 0 && selectedCategory.max_weight === 0 ? (
                                            'Livre'
                                        ) : (
                                            `${selectedCategory.min_weight}kg - ${selectedCategory.max_weight}kg`
                                        )}
                                    </span>
                                </div>
                            )}
                            {selectedCategory.min_age !== -1 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Idade:</span>
                                    <span className="font-bold text-primary">
                                        {selectedCategory.min_age === 0 && selectedCategory.max_age === 0 ? (
                                            'Livre'
                                        ) : (
                                            `${selectedCategory.min_age} - ${selectedCategory.max_age} anos`
                                        )}
                                    </span>
                                </div>
                            )}
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
