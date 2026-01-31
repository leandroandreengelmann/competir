"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Users, Trophy, ChevronRight } from "lucide-react"

interface Event {
    id: string
    name: string
    date: string
    address: string
}

interface CategoryWithCounts {
    id: string
    belt: string
    min_weight: number
    max_weight: number
    age_group: string
    registration_fee: number
    total_inscricoes: number
    total_pagas: number
    total_pendentes: number
    total_canceladas: number
}

interface CategoriasClientProps {
    event: Event
    categories: CategoryWithCounts[]
}

const beltColors: Record<string, string> = {
    'Branca': 'bg-gray-100 text-gray-800 border-gray-300',
    'Cinza': 'bg-gray-200 text-gray-800 border-gray-400',
    'Amarela': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'Laranja': 'bg-orange-100 text-orange-800 border-orange-300',
    'Verde': 'bg-green-100 text-green-800 border-green-300',
    'Azul': 'bg-blue-100 text-blue-800 border-blue-300',
    'Roxa': 'bg-purple-100 text-purple-800 border-purple-300',
    'Marrom': 'bg-amber-100 text-amber-800 border-amber-300',
    'Preta': 'bg-gray-900 text-white border-gray-900',
}

export function CategoriasClient({ event, categories }: CategoriasClientProps) {
    const categoriesWithAthletes = categories.filter(cat => (cat.total_pagas + cat.total_pendentes) > 0)
    const totalCategories = categories.length

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/painel/organizador/eventos" className="hover:text-foreground transition-colors">
                    Eventos
                </Link>
                <ChevronRight className="h-4 w-4" />
                <Link href={`/painel/organizador/eventos/${event.id}`} className="hover:text-foreground transition-colors">
                    {event.name}
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground font-medium">Categorias & Atletas</span>
            </nav>

            {/* Card de Resumo do Evento */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Trophy className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl">{event.name}</CardTitle>
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(event.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4" />
                                    {event.address}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Título da Seção e Contador */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Categorias & Atletas</h2>
                    <p className="text-muted-foreground mt-1">
                        Visualize os atletas inscritos organizados por categoria
                    </p>
                </div>
                <Badge variant="secondary" className="w-fit h-7 px-3 text-xs font-semibold">
                    Categorias com atletas: {categoriesWithAthletes.length} de {totalCategories} total do evento
                </Badge>
            </div>

            {/* Listagem de Categorias */}
            {categoriesWithAthletes.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Trophy className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground text-center">
                            Nenhuma categoria com atletas inscritos ainda.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categoriesWithAthletes.map((category) => (
                        <Card key={category.id} className="hover:border-primary transition-colors">
                            <CardHeader>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-2 flex-1">
                                        <Badge
                                            variant="outline"
                                            className={beltColors[category.belt] || 'bg-gray-100 text-gray-800'}
                                        >
                                            {category.belt}
                                        </Badge>
                                        <CardTitle className="text-lg">{category.age_group}</CardTitle>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-2xl font-bold text-primary">
                                            {category.total_inscricoes}
                                        </div>
                                        <div className="text-xs text-muted-foreground">atletas</div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Contadores */}
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Pagas:</span>
                                    <Badge variant="success">{category.total_pagas}</Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Pendentes:</span>
                                    <Badge variant="warning">{category.total_pendentes}</Badge>
                                </div>
                                {category.total_canceladas > 0 && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Canceladas:</span>
                                        <Badge variant="secondary">{category.total_canceladas}</Badge>
                                    </div>
                                )}

                                {/* Botões de Ação */}
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    <Link
                                        href={`/painel/organizador/eventos/${event.id}/categorias/${category.id}`}
                                        className="w-full"
                                    >
                                        <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                                            <Users className="h-3.5 w-3.5" />
                                            Atletas
                                        </Button>
                                    </Link>
                                    <Link
                                        href={`/painel/organizador/eventos/${event.id}/categorias/${category.id}/chaves`}
                                        className="w-full"
                                    >
                                        <Button variant="secondary" size="sm" className="w-full gap-1.5 text-xs">
                                            <Trophy className="h-3.5 w-3.5" />
                                            Chave
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
