"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { EventForm } from "./event-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Plus, Tags, Users, RotateCcw, ClipboardList } from "lucide-react"
import { AddCategoriesDialog } from "@/components/add-categories-dialog"
import { getEventCategoriesAction } from "@/app/actions/event-categories"
import { stopEventRegistrationsAction, reopenEventRegistrationsAction, startEventInscriptionsAction } from "@/app/actions/bracket-management"
import { toast } from "sonner"
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

interface Event {
    id: string
    name: string
    address: string
    description: string
    date: string
    is_open_for_inscriptions?: boolean
    is_published?: boolean
}

interface Category {
    id: string
    belt: string
    min_weight: number
    max_weight: number
    age_group: string
    registration_fee: number
}

interface EventPageClientProps {
    event: Event
}

export function EventPageClient({ event }: EventPageClientProps) {
    const router = useRouter()
    const [categories, setCategories] = React.useState<Category[]>([])
    const [isLoadingCategories, setIsLoadingCategories] = React.useState(true)
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)

    async function loadCategories() {
        setIsLoadingCategories(true)
        try {
            const data = await getEventCategoriesAction(event.id)
            setCategories(data)
        } catch (error) {
            console.error('Erro ao carregar categorias:', error)
        } finally {
            setIsLoadingCategories(false)
        }
    }

    React.useEffect(() => {
        loadCategories()
    }, [event.id])

    function handleCategoriesAdded() {
        loadCategories()
        router.refresh()
    }

    const [isStarting, setIsStarting] = React.useState(false)
    const [isStopping, setIsStopping] = React.useState(false)
    const [isReopening, setIsReopening] = React.useState(false)
    const [showReopenDialog, setShowReopenDialog] = React.useState(false)

    async function handleStartInscriptions() {
        setIsStarting(true)
        try {
            const result = await startEventInscriptionsAction(event.id)
            if (result.success) {
                toast.success(result.message)
                router.refresh()
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error('Erro ao iniciar inscrições')
        } finally {
            setIsStarting(false)
        }
    }

    async function handleStopRegistrations() {
        if (!confirm('Tem certeza que deseja encerrar as inscrições? Isso irá gerar as chaves definitivas e não poderá ser desfeito.')) {
            return
        }

        setIsStopping(true)
        try {
            const result = await stopEventRegistrationsAction(event.id)
            if (result.success) {
                toast.success(result.message)
                router.refresh()
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error('Erro ao encerrar inscrições')
        } finally {
            setIsStopping(false)
        }
    }

    async function handleReopenRegistrations() {
        setIsReopening(true)
        try {
            const result = await reopenEventRegistrationsAction(event.id)
            if (result.success) {
                toast.success(result.message)
                router.refresh()
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error('Erro ao reabrir inscrições')
        } finally {
            setIsReopening(false)
            setShowReopenDialog(false)
        }
    }

    // Normalizar is_open_for_inscriptions para boolean
    const isOpenForInscriptions = event.is_open_for_inscriptions !== false
    const isPublished = event.is_published === true

    return (
        <div className="space-y-8">
            {/* Cabeçalho do Painel */}
            <div className="border-b pb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="h-12 w-12 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground truncate">{event.name}</h1>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 text-muted-foreground text-sm">
                            <span className="flex items-center gap-1.5 underline underline-offset-4 decoration-primary/30 shrink-0">
                                <Calendar className="h-4 w-4" />
                                {new Date(event.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1.5 truncate">
                                <MapPin className="h-4 w-4 shrink-0" />
                                <span className="truncate">{event.address}</span>
                            </span>
                        </div>
                    </div>
                    {/* Botão de Controle de Fluxo - 3 Estados */}
                    {!isPublished ? (
                        // Estado 1: Evento Privado
                        <Button
                            variant="default"
                            onClick={handleStartInscriptions}
                            disabled={isStarting}
                            className="shrink-0"
                        >
                            {isStarting ? 'Iniciando...' : 'Iniciar Inscrições'}
                        </Button>
                    ) : isOpenForInscriptions ? (
                        // Estado 2: Evento Público + Aberto
                        <Button
                            variant="destructive"
                            onClick={handleStopRegistrations}
                            disabled={isStopping}
                            className="shrink-0"
                        >
                            {isStopping ? 'Encerrando...' : 'Parar Inscrições'}
                        </Button>
                    ) : (
                        // Estado 3: Evento Público + Fechado
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-red-500 border-red-500 px-4 py-2">
                                Inscrições Encerradas
                            </Badge>
                            <Button
                                variant="outline"
                                onClick={() => setShowReopenDialog(true)}
                                disabled={isReopening}
                                className="shrink-0 gap-2"
                            >
                                <RotateCcw className="h-4 w-4" />
                                {isReopening ? 'Reiniciando...' : 'Reiniciar Inscrições'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Coluna Principal: Informações */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold tracking-tight">Informações do Evento</h2>
                        </div>
                        <EventForm event={event} />
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold tracking-tight">Categorias do Evento</h2>
                        </div>
                        <Card>
                            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 space-y-0">
                                <div className="space-y-1">
                                    <CardTitle className="text-base font-medium">Categorias Associadas</CardTitle>
                                    <p className="text-sm text-muted-foreground">Defina as faixas e pesos permitidos para este evento.</p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 w-full sm:w-auto h-11 sm:h-9"
                                    onClick={() => setIsDialogOpen(true)}
                                >
                                    <Plus className="h-4 w-4" />
                                    Adicionar Categorias
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {isLoadingCategories ? (
                                    <div className="border border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center space-y-3">
                                        <p className="text-sm text-muted-foreground">Carregando categorias...</p>
                                    </div>
                                ) : categories.length === 0 ? (
                                    <div className="border border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center space-y-3">
                                        <Tags className="h-8 w-8 text-muted-foreground/30" />
                                        <p className="text-sm text-muted-foreground">Nenhuma categoria vinculada a este evento ainda.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {categories.map((category) => (
                                            <div
                                                key={category.id}
                                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="outline">{category.belt}</Badge>
                                                    <div className="space-y-1">
                                                        <div className="text-sm font-medium">{category.age_group}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {category.min_weight}kg - {category.max_weight}kg
                                                        </div>
                                                    </div>
                                                </div>
                                                {category.registration_fee > 0 && (
                                                    <Badge variant="secondary">
                                                        R$ {category.registration_fee.toFixed(2)}
                                                    </Badge>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </section>
                </div>

                {/* Coluna Lateral: Outras Funcionalidades */}
                <div className="space-y-5">
                    <h2 className="text-xl font-semibold tracking-tight">Recursos do Evento</h2>

                    <Link href={`/painel/organizador/eventos/${event.id}/configurar-assistente`}>
                        <Card className="cursor-pointer hover:border-primary transition-colors">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <RotateCcw className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-sm font-medium">Informações Gerais</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground mb-4">Configure as regras e detalhes do evento via assistente.</p>
                                <Button variant="default" className="w-full text-xs gap-2">
                                    Configurar Assistente
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href={`/painel/organizador/eventos/${event.id}/inscricoes`}>
                        <Card className="cursor-pointer hover:border-primary transition-colors">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <ClipboardList className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-sm font-medium">Inscrições</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground mb-4">Gerencie os atletas inscritos e pagamentos.</p>
                                <Button variant="default" className="w-full text-xs">
                                    Gerenciar
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href={`/painel/organizador/eventos/${event.id}/categorias`}>
                        <Card className="cursor-pointer hover:border-primary transition-colors">
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-sm font-medium">Categorias & Atletas</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground mb-4">Visualize os atletas inscritos por categoria.</p>
                                <Button variant="default" className="w-full text-xs">
                                    Visualizar
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>

                </div>
            </div>

            <AddCategoriesDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                eventId={event.id}
                onSuccess={handleCategoriesAdded}
            />

            <AlertDialog open={showReopenDialog} onOpenChange={setShowReopenDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reabrir Inscrições</AlertDialogTitle>
                        <AlertDialogDescription>
                            Ao reabrir as inscrições, o chaveamento oficial deste evento será removido
                            e voltará para o modo de prévia dinâmica. Atletas poderão se inscrever novamente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReopenRegistrations} disabled={isReopening}>
                            {isReopening ? 'Reabrindo...' : 'Confirmar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
