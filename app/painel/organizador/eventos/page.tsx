import { getCurrentUser } from "@/app/actions/user"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { Calendar, MapPin, Plus, Image, MoreVertical } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { DeleteEventButton } from "@/components/delete-event-button"

async function getOrganizerEvents(userId: string) {
    const supabase = await createClient()

    const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', userId)
        .order('date', { ascending: false })

    if (error) {
        console.error('Erro ao buscar eventos:', error)
        return []
    }

    return events || []
}

export default async function EventsPage() {
    const user = await getCurrentUser()

    if (!user || user.role !== 'organizador') {
        redirect('/login')
    }

    const events = await getOrganizerEvents(user.id)

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Meus Eventos</h1>
                    <p className="text-muted-foreground">
                        Gerencie seus eventos e campeonatos
                    </p>
                </div>
                <Button asChild className="w-full sm:w-auto">
                    <Link href="/painel/organizador/eventos/novo" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Novo Evento
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {events.length === 0 ? (
                    <Card className="col-span-full">
                        <CardContent className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                            <Calendar className="h-12 w-12 text-muted-foreground/50" />
                            <div className="space-y-1">
                                <h3 className="font-semibold text-lg">Nenhum evento encontrado</h3>
                                <p className="text-muted-foreground max-w-sm">
                                    Você ainda não criou nenhum evento. Comece criando seu primeiro campeonato agora mesmo.
                                </p>
                            </div>
                            <Button asChild variant="outline">
                                <Link href="/painel/organizador/eventos/novo">Criar evento</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    events.map((event) => (
                        <Card key={event.id} className="flex flex-col overflow-hidden">
                            {/* Banner de imagem ou placeholder */}
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

                            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                <CardTitle className="text-xl line-clamp-1">{event.name}</CardTitle>
                                <DeleteEventButton eventId={event.id} eventName={event.name} />
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col gap-4">
                                <div className="space-y-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>{new Date(event.date).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        <span className="truncate">{event.address}</span>
                                    </div>
                                </div>

                                <div className="mt-auto pt-4">
                                    <Button asChild className="w-full">
                                        <Link href={`/painel/organizador/eventos/${event.id}`}>
                                            Gerenciar Evento
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
