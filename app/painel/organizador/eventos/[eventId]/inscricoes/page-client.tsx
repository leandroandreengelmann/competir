"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Calendar, MapPin, MoreHorizontal, Search, Loader2, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import {
    getOrganizerEventRegistrationsAction,
} from "@/app/actions/organizer-event-registrations"

type Registration = {
    registration_id: string
    status: string
    amount_cents: number
    created_at: string
    athlete_id: string
    athlete_name: string
    athlete_email: string
    belt: string
    age_group: string
    min_weight: number
    max_weight: number
}

interface Event {
    id: string
    name: string
    date: string
    address: string
    description: string
}

interface EventRegistrationsClientProps {
    event: Event
}

export function EventRegistrationsClient({ event }: EventRegistrationsClientProps) {
    const router = useRouter()
    const [registrations, setRegistrations] = React.useState<Registration[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [statusFilter, setStatusFilter] = React.useState("all")

    async function loadRegistrations() {
        setIsLoading(true)
        try {
            const result = await getOrganizerEventRegistrationsAction(event.id)
            if (result.success && result.registrations) {
                setRegistrations(result.registrations)
            } else {
                toast.error(result.error || "Erro ao carregar inscrições")
            }
        } catch (error) {
            toast.error("Erro ao carregar inscrições")
        } finally {
            setIsLoading(false)
        }
    }

    React.useEffect(() => {
        loadRegistrations()
    }, [event.id])

    // Contadores
    const pendingCount = registrations.filter(r => r.status === 'pending_payment').length
    const paidCount = registrations.filter(r => r.status === 'paid').length
    const cancelledCount = registrations.filter(r => r.status === 'cancelled').length

    // Filtros
    const filteredRegistrations = React.useMemo(() => {
        return registrations.filter((reg) => {
            const matchesSearch =
                searchTerm === "" ||
                reg.athlete_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                reg.athlete_email.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesStatus =
                statusFilter === "all" || reg.status === statusFilter

            return matchesSearch && matchesStatus
        })
    }, [registrations, searchTerm, statusFilter])

    function getStatusBadge(status: string) {
        switch (status) {
            case "pending_payment":
                return <Badge variant="warning">Pendente</Badge>
            case "paid":
                return <Badge variant="success">Pago</Badge>
            case "cancelled":
                return <Badge variant="destructive">Cancelado</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }


    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link href="/painel/organizador/eventos" className="hover:text-foreground transition-colors">
                        Meus Eventos
                    </Link>
                    <ChevronRight className="h-4 w-4" />
                    <Link href={`/painel/organizador/eventos/${event.id}`} className="hover:text-foreground transition-colors">
                        Gerenciar Evento
                    </Link>
                    <ChevronRight className="h-4 w-4" />
                    <span className="text-foreground">Inscrições</span>
                </nav>

                {/* Header */}
                <div className="border-b pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            Inscrições do Evento
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Gerencie atletas inscritos e status de pagamento
                        </p>
                    </div>
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <p className="text-xs font-medium text-primary">
                            Status atualizado automaticamente via Asaas (PIX)
                        </p>
                    </div>
                </div>

                {/* Card de Resumo do Evento */}
                <Card>
                    <CardHeader>
                        <CardTitle>{event.name}</CardTitle>
                        <CardDescription className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="h-4 w-4" />
                                {new Date(event.date).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric'
                                })}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4" />
                                {event.address}
                            </span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4">
                            <Badge variant="warning" className="text-sm">
                                Pendentes: {pendingCount}
                            </Badge>
                            <Badge variant="success" className="text-sm">
                                Pagas: {paidCount}
                            </Badge>
                            <Badge variant="secondary" className="text-sm">
                                Canceladas: {cancelledCount}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Filtros e Ações */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nome ou e-mail"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os status</SelectItem>
                                <SelectItem value="pending_payment">Pendentes</SelectItem>
                                <SelectItem value="paid">Pagas</SelectItem>
                                <SelectItem value="cancelled">Canceladas</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button variant="outline" asChild className="w-full sm:w-auto">
                        <Link href={`/painel/organizador/eventos/${event.id}`}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Voltar para o Evento
                        </Link>
                    </Button>
                </div>

                {/* Tabela/Cards de Inscrições */}
                <div className="space-y-4">
                    {isLoading ? (
                        <Card>
                            <CardContent className="flex justify-center items-center py-12">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </CardContent>
                        </Card>
                    ) : filteredRegistrations.length === 0 ? (
                        <Card>
                            <CardContent className="text-center py-12">
                                <p className="text-muted-foreground">
                                    {searchTerm || statusFilter !== "all"
                                        ? "Nenhuma inscrição encontrada com os filtros aplicados"
                                        : "Nenhuma inscrição neste evento ainda"}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block rounded-md border bg-surface overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Atleta</TableHead>
                                            <TableHead>Categoria</TableHead>
                                            <TableHead className="text-right">Valor</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredRegistrations.map((reg) => (
                                            <TableRow key={reg.registration_id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{reg.athlete_name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {reg.athlete_email}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <p>{reg.belt} • {reg.age_group}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {reg.min_weight}kg - {reg.max_weight}kg
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    R$ {(reg.amount_cents / 100).toFixed(2)}
                                                </TableCell>
                                                <TableCell>{getStatusBadge(reg.status)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="grid grid-cols-1 gap-4 md:hidden">
                                {filteredRegistrations.map((reg) => (
                                    <Card key={reg.registration_id} className="overflow-hidden border-border bg-surface shadow-sm">
                                        <CardContent className="p-4 space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1">
                                                    <p className="font-bold text-foreground leading-tight">{reg.athlete_name}</p>
                                                    <p className="text-xs text-muted-foreground">{reg.athlete_email}</p>
                                                </div>
                                                {getStatusBadge(reg.status)}
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 py-3 border-y border-border/50">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Categoria</p>
                                                    <p className="text-xs font-medium">{reg.belt} • {reg.age_group}</p>
                                                </div>
                                                <div className="space-y-1 text-right">
                                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Valor</p>
                                                    <p className="text-xs font-bold text-primary">R$ {(reg.amount_cents / 100).toFixed(2)}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-1">
                                                <p className="text-[11px] text-muted-foreground">
                                                    {reg.min_weight}kg - {reg.max_weight}kg
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

        </div>
    )
}
