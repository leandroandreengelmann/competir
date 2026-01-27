"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Calendar, MapPin, Image } from "lucide-react"
import { addEventInterestAction } from "@/app/actions/athlete-interests"
import { toast } from "sonner"
import Link from "next/link"
import { PublicHeader } from "@/components/public-header"
import { PublicFooter } from "@/components/public-footer"
import { routes } from "@/lib/routes"

interface Event {
    id: string
    name: string
    address: string
    description: string
    date: string
    organizer_id: string
    image_url?: string
    info_published?: boolean
}

interface User {
    id: string
    name: string
    email: string
    role: string
}

interface PublicEventsClientProps {
    events: Event[]
    user: User | null
}

export function PublicEventsClient({ events, user }: PublicEventsClientProps) {
    const router = useRouter()
    const [selectedEventId, setSelectedEventId] = React.useState<string | null>(null)
    const [showAuthDialog, setShowAuthDialog] = React.useState(false)
    const [processingEventId, setProcessingEventId] = React.useState<string | null>(null)
    const [interestedEventIds, setInterestedEventIds] = React.useState<Set<string>>(new Set())

    async function handleInterestClick(eventId: string) {
        // Se não está autenticado, mostrar dialog
        if (!user) {
            setSelectedEventId(eventId)
            setShowAuthDialog(true)
            return
        }

        // Se já está autenticado como atleta, adicionar interesse
        if (user.role === 'atleta') {
            setProcessingEventId(eventId)
            try {
                const result = await addEventInterestAction(eventId)

                if (result.success) {
                    toast.success(result.message)
                    setInterestedEventIds(prev => new Set(prev).add(eventId))
                    router.refresh()
                } else {
                    toast.error(result.error || 'Erro ao registrar interesse')
                }
            } catch (error) {
                console.error('Erro ao adicionar interesse:', error)
                toast.error('Erro ao registrar interesse')
            } finally {
                setProcessingEventId(null)
            }
        } else {
            toast.error('Apenas atletas podem demonstrar interesse em eventos')
        }
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <PublicHeader user={user} />

            {/* Events Grid */}
            <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {events.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
                            <Calendar className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Nenhum evento disponível</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Ainda não há eventos cadastrados. Volte em breve para conferir os próximos campeonatos.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {events.map((event) => (
                            <Card
                                key={event.id}
                                className="flex flex-col hover:shadow-md hover:border-primary/50 transition-all duration-200 overflow-hidden"
                            >
                                {/* Banner de imagem ou placeholder - clicável */}
                                <Link href={`/eventos/${event.id}`} className="block">
                                    {event.image_url ? (
                                        <div className="relative w-full aspect-[4/3] overflow-hidden bg-muted">
                                            <img
                                                src={event.image_url}
                                                alt={`Imagem de divulgação do evento ${event.name}`}
                                                className="h-full w-full object-contain"
                                                loading="lazy"
                                                decoding="async"
                                            />
                                        </div>
                                    ) : (
                                        <div className="relative w-full aspect-[4/3] bg-muted flex flex-col items-center justify-center gap-2">
                                            <Image className="h-10 w-10 text-muted-foreground/40" />
                                            <p className="text-xs text-muted-foreground/60">
                                                Sem imagem de divulgação
                                            </p>
                                        </div>
                                    )}
                                </Link>

                                <CardHeader className="pb-3">
                                    <Link href={`/eventos/${event.id}`} className="hover:underline">
                                        <CardTitle className="text-xl font-semibold leading-tight">
                                            {event.name}
                                        </CardTitle>
                                    </Link>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-3 pb-4">
                                    {event.info_published ? (
                                        <>
                                            <div className="space-y-2.5">
                                                <div className="flex items-start gap-2.5 text-sm">
                                                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                                    <span className="text-foreground font-medium">
                                                        {new Date(event.date).toLocaleDateString('pt-BR', {
                                                            day: '2-digit',
                                                            month: 'long',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                                <div className="flex items-start gap-2.5 text-sm">
                                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                                    <span className="text-muted-foreground">
                                                        {event.address}
                                                    </span>
                                                </div>
                                            </div>
                                            {event.description && (
                                                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                                    {event.description}
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <div className="py-4">
                                            <p className="text-sm font-medium text-muted-foreground italic text-center">
                                                Mais detalhes em breve.
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="pt-0">
                                    {event.info_published ? (
                                        (!user || user.role === 'atleta') ? (
                                            <Button
                                                className="w-full"
                                                asChild
                                                disabled={!event.id}
                                            >
                                                <Link href={
                                                    user?.role === 'atleta'
                                                        ? routes.athleteEventRegistration(event.id)
                                                        : routes.loginWithNext(routes.athleteEventRegistration(event.id))
                                                }>
                                                    Fazer inscrição
                                                </Link>
                                            </Button>
                                        ) : (
                                            <Button className="w-full" disabled variant="outline">
                                                Apenas atletas podem se inscrever
                                            </Button>
                                        )
                                    ) : (
                                        <Button className="w-full" variant="outline" asChild>
                                            <Link href={`/eventos/${event.id}`}>
                                                Ver página do evento
                                            </Link>
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Auth Dialog */}
            <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Você já tem conta?</DialogTitle>
                        <DialogDescription>
                            Para demonstrar interesse em um evento, você precisa estar autenticado.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col gap-2 sm:flex-row">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                                router.push(`/login?returnEvent=${selectedEventId}`)
                            }}
                        >
                            Entrar na minha conta
                        </Button>
                        <Button
                            className="w-full"
                            onClick={() => {
                                router.push(`/signup?returnEvent=${selectedEventId}`)
                            }}
                        >
                            Criar conta
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Rodapé Padronizado */}
            <PublicFooter />
        </div>
    )
}
