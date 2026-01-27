"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronRight, Trophy, Users } from "lucide-react"

interface Event {
    id: string
    name: string
    date: string
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

interface CategoryAthlete {
    registration_id: string
    athlete_name: string
    athlete_email: string
    status: string
    amount_cents: number
    created_at: string
}

interface AtletasClientProps {
    event: Event
    category: CategoryWithCounts
    athletes: CategoryAthlete[]
}

const statusVariants: Record<string, "success" | "warning" | "secondary"> = {
    paid: "success",
    pending_payment: "warning",
    cancelled: "secondary",
}

const statusLabels: Record<string, string> = {
    paid: "Pago",
    pending_payment: "Pendente",
    cancelled: "Cancelado",
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

export function AtletasClient({ event, category, athletes }: AtletasClientProps) {
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
                <Link href={`/painel/organizador/eventos/${event.id}/categorias`} className="hover:text-foreground transition-colors">
                    Categorias & Atletas
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-foreground font-medium">
                    {category.belt} - {category.age_group}
                </span>
            </nav>

            {/* Card de Informações da Categoria */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Badge
                                    variant="outline"
                                    className={`${beltColors[category.belt] || 'bg-gray-100 text-gray-800'} text-base px-3 py-1`}
                                >
                                    {category.belt}
                                </Badge>
                                <Trophy className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <CardTitle className="text-2xl">{category.age_group}</CardTitle>
                            <CardDescription className="text-base">
                                Peso: {category.min_weight}kg - {category.max_weight}kg
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-primary">{category.total_inscricoes}</div>
                                <div className="text-sm text-muted-foreground">Total</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-green-600">{category.total_pagas}</div>
                                <div className="text-sm text-muted-foreground">Pagas</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-orange-600">{category.total_pendentes}</div>
                                <div className="text-sm text-muted-foreground">Pendentes</div>
                            </div>
                            {category.total_canceladas > 0 && (
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-gray-600">{category.total_canceladas}</div>
                                    <div className="text-sm text-muted-foreground">Canceladas</div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Título da Seção */}
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Atletas Inscritos</h2>
                <p className="text-muted-foreground mt-1">
                    Visualização dos atletas inscritos nesta categoria
                </p>
            </div>

            {/* Tabela de Atletas */}
            {athletes.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground text-center">
                            Nenhum atleta inscrito nesta categoria ainda.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Atleta</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                        <TableHead className="text-right">Data de Inscrição</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {athletes.map((athlete) => (
                                        <TableRow key={athlete.registration_id}>
                                            <TableCell className="font-medium">
                                                {athlete.athlete_name}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {athlete.athlete_email}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={statusVariants[athlete.status] || "secondary"}>
                                                    {statusLabels[athlete.status] || athlete.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                R$ {(athlete.amount_cents / 100).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                {new Date(athlete.created_at).toLocaleDateString('pt-BR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
