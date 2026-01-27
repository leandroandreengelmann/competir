"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BracketView } from "@/components/bracket-view"
import { getBracketDataAction } from "@/app/actions/bracket-management"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, Share2, Printer, Trophy } from "lucide-react"

interface BracketPageClientProps {
    eventId: string
    categoryId: string
    event: { name: string }
    category: { belt: string, age_group: string, min_weight: number, max_weight: number }
}

export function BracketPageClient({ eventId, categoryId, event, category }: BracketPageClientProps) {
    const [bracketData, setBracketData] = React.useState<any>(null)
    const [isLoading, setIsLoading] = React.useState(true)

    async function loadBracket() {
        setIsLoading(true)
        try {
            const data = await getBracketDataAction(eventId as any, categoryId as any)
            console.log('[DEBUG] BracketPageClient - Data received:', data)
            setBracketData(data)
        } catch (error) {
            console.error('Erro ao carregar chave:', error)
        } finally {
            setIsLoading(false)
        }
    }

    React.useEffect(() => {
        loadBracket()
    }, [eventId, categoryId])

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6">
                <div className="flex items-center gap-4">
                    <Link href={`/painel/organizador/eventos/${eventId}/categorias`}>
                        <Button variant="ghost" size="icon">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{event.name}</h1>
                        <p className="text-muted-foreground">
                            Chave: {category.belt} - {category.age_group} ({category.min_weight}kg - {category.max_weight}kg)
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="default"
                        size="sm"
                        className="gap-2"
                        onClick={() => window.open(`/api/organizador/bracket-pdf?eventId=${eventId}&categoryId=${categoryId}`, '_blank')}
                    >
                        <Printer className="h-4 w-4" />
                        Gerar PDF Profissional
                    </Button>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="h-64 flex items-center justify-center">
                    <p className="text-muted-foreground">Carregando chaveamento...</p>
                </div>
            ) : bracketData?.bracketSize ? (
                <Card className="border-none shadow-none bg-transparent">
                    <CardHeader className="px-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-primary" />
                                <CardTitle>Chave de Lutas ({bracketData.bracketSize} posições)</CardTitle>
                            </div>
                            {bracketData.isLocked ? (
                                <Badge variant="success" className="gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                    Publicado
                                </Badge>
                            ) : (
                                <Badge variant="warning" className="gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                    Prévia Dinâmica
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="px-0 pt-6 overflow-hidden">
                        <BracketView
                            bracketSize={bracketData.bracketSize}
                            matches={bracketData.matches}
                            registrations={bracketData.registrations}
                            isLocked={bracketData.isLocked}
                        />
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Trophy className="h-12 w-12 text-muted-foreground/20 mb-4" />
                        <h3 className="text-lg font-medium">Nenhum dado encontrado</h3>
                        <p className="text-sm text-muted-foreground">Não foi possível carregar as informações deste chaveamento.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
