"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Image as ImageIcon, CheckCircle2, ArrowRight } from "lucide-react"
import Link from "next/link"
import React from "react"
import { routes } from "@/lib/routes"
import { motion } from "framer-motion"

interface Registration {
    registration_id: string
    event_id: string
    belt: string
    age_group: string
    status: string
}

interface Event {
    id: string
    name: string
    date: string
    address: string
    image_url?: string
    registrations?: Registration[]
}

interface DashboardClientProps {
    allEvents: Event[]
    registrations: Registration[]
}

export function DashboardClient({ allEvents, registrations }: DashboardClientProps) {
    // Agrupar inscrições por event_id
    const registrationMap = new Map<string, Registration[]>()
    registrations.forEach(reg => {
        const existing = registrationMap.get(reg.event_id) || []
        registrationMap.set(reg.event_id, [...existing, reg])
    })

    const eventsWithRegistration = allEvents
        .filter(event => (registrationMap.get(event.id) || []).length > 0)
        .map(event => ({ ...event, registrations: registrationMap.get(event.id) }))

    const eventsWithoutRegistration = allEvents
        .filter(event => (registrationMap.get(event.id) || []).length === 0)

    // Ordenar: mais recentes ou com pendência primeiro
    eventsWithRegistration.sort((a, b) => {
        const hasPendingA = a.registrations?.some(r => r.status === 'pending_payment')
        const hasPendingB = b.registrations?.some(r => r.status === 'pending_payment')
        if (hasPendingA && !hasPendingB) return -1
        if (!hasPendingA && hasPendingB) return 1
        return 0
    })

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    }

    const renderEventCard = (event: Event) => {
        const eventRegistrations = event.registrations || []
        const hasRegistrations = eventRegistrations.length > 0
        const hasPending = eventRegistrations.some(r => r.status === 'pending_payment')

        return (
            <motion.div
                key={event.id}
                variants={itemVariants}
                className="h-full"
            >
                <Card
                    className={`group flex flex-col h-full overflow-hidden transition-all duration-300 bg-surface border-border/50 hover:shadow-md ${hasPending ? 'border-warning/50' : hasRegistrations ? 'border-success/50' : ''
                        }`}
                >
                    {/* Image Section */}
                    <div className="relative w-full aspect-[16/10] overflow-hidden bg-muted">
                        {event.image_url ? (
                            <img
                                src={event.image_url}
                                alt={event.name}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        ) : (
                            <div className="h-full w-full flex flex-col items-center justify-center gap-2 opacity-40">
                                <ImageIcon className="h-10 w-10 text-muted-foreground" />
                                <span className="text-xs font-medium">COMPETIR</span>
                            </div>
                        )}
                        <div className="absolute top-3 right-3">
                            {hasRegistrations && (
                                <Badge variant={hasPending ? 'warning' : 'success'}>
                                    {hasPending ? 'Pendente' : 'Confirmado'}
                                </Badge>
                            )}
                        </div>
                    </div>

                    <CardHeader className="p-5 pb-2">
                        <CardTitle className="text-lg font-semibold tracking-tight text-foreground transition-colors leading-tight">
                            {event.name}
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="p-5 pt-0 flex-1 flex flex-col gap-6">
                        {/* Info list */}
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>
                                    {new Date(event.date).toLocaleDateString('pt-BR', {
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span className="truncate">{event.address}</span>
                            </div>
                        </div>

                        {/* Category List */}
                        {hasRegistrations && (
                            <div className="space-y-3 pt-4 border-t border-border/40">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                        Minhas Categorias
                                    </span>
                                    <span className="text-[10px] font-medium text-muted-foreground">
                                        {eventRegistrations.length} {eventRegistrations.length === 1 ? 'categoria' : 'categorias'}
                                    </span>
                                </div>
                                <div className="grid gap-2">
                                    {eventRegistrations.map((reg) => (
                                        <div
                                            key={reg.registration_id}
                                            className="flex items-center justify-between p-3 rounded-md bg-muted/30 border border-border/10 transition-colors hover:bg-muted/50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={reg.status === 'paid' ? 'text-success' : 'text-warning'}>
                                                    <CheckCircle2 className="h-4 w-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-semibold text-foreground leading-none mb-1">
                                                        {reg.belt}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground leading-none">
                                                        {reg.age_group}
                                                    </span>
                                                </div>
                                            </div>

                                            {reg.status === 'pending_payment' ? (
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="h-7 px-3 text-[10px]"
                                                    asChild
                                                >
                                                    <Link href={`/painel/atleta/pagamento/${reg.registration_id}`}>
                                                        Pagar
                                                    </Link>
                                                </Button>
                                            ) : (
                                                <Badge variant="success" className="h-5 text-[9px] px-1.5 py-0">Ok</Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* CTA */}
                        <div className="mt-auto pt-4">
                            <Button
                                className="w-full"
                                asChild
                            >
                                <Link href={routes.athleteEventRegistration(event.id)}>
                                    <span className="flex items-center justify-center gap-2">
                                        {hasRegistrations ? 'Fazer nova inscrição' : 'Fazer inscrição'}
                                        <ArrowRight className="h-4 w-4" />
                                    </span>
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-16">
            {/* Seção de Eventos Inscritos */}
            {eventsWithRegistration.length > 0 && (
                <section className="space-y-8">
                    <div className="border-l-4 border-primary pl-4">
                        <h2 className="text-3xl font-black text-foreground tracking-tight">
                            Minhas Próximas Competições
                        </h2>
                        <p className="text-muted-foreground font-medium">
                            Acompanhe o caminho para a sua próxima vitória
                        </p>
                    </div>
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                    >
                        {eventsWithRegistration.map((event) => renderEventCard(event))}
                    </motion.div>
                </section>
            )}

            {/* Seção de Eventos Disponíveis */}
            {eventsWithoutRegistration.length > 0 && (
                <section className="space-y-8">
                    <div className="border-l-4 border-muted pl-4">
                        <h2 className="text-2xl font-black text-foreground tracking-tight">
                            Eventos Disponíveis
                        </h2>
                        <p className="text-muted-foreground font-medium">
                            Garanta sua vaga nos melhores campeonatos
                        </p>
                    </div>
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                    >
                        {eventsWithoutRegistration.map((event) => renderEventCard(event))}
                    </motion.div>
                </section>
            )}

            {/* Caso não haja nenhum evento */}
            {allEvents.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-20 text-center space-y-4"
                >
                    <div className="p-6 rounded-full bg-muted/30">
                        <Calendar className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xl font-bold">Nenhum evento no horizonte</h3>
                        <p className="text-muted-foreground">Fique de olho, novas competições estão por vir.</p>
                    </div>
                </motion.div>
            )}
        </div>
    )
}
