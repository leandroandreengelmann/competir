"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"

interface Match {
    id: number
    round: number
    match_no: number
    slot_a: number
    slot_b: number
    athlete_a_id: number | null
    athlete_b_id: number | null
    winner_id: number | null
    is_bye: number
    status: string
}

interface Registration {
    bracket_slot: number
    athlete_name: string
    athlete_id: number
}

interface BracketViewProps {
    bracketSize: number
    matches: Match[]
    registrations: Registration[]
    isLocked: boolean
}

export function BracketView({ bracketSize, matches, registrations, isLocked }: BracketViewProps) {
    const athleteMap = new Map<number, string>()
        // Proteção contra registrations undefined
        ; (registrations || []).forEach(r => athleteMap.set(r.bracket_slot, r.athlete_name))

    const rounds = Math.log2(bracketSize)
    const roundArray = Array.from({ length: rounds }, (_, i) => i + 1)

    // Agrupa matches por rodada
    const matchesByRound = (round: number) => matches.filter(m => m.round === round)

    return (
        <div className="relative overflow-x-auto pb-8 pt-4">
            <div className="flex gap-16 min-w-[800px] px-4">
                {roundArray.map((round) => (
                    <div key={round} className="flex flex-col justify-around gap-8">
                        <div className="text-center">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                                {round === rounds ? 'Final' : round === rounds - 1 ? 'Semifinal' : `Rodada ${round}`}
                            </h3>
                        </div>

                        <div className="flex-1 flex flex-col justify-around gap-12">
                            {matchesByRound(round).map((match) => {
                                // REGRA: Somente round 1 exibe nomes reais de atletas
                                // Rounds > 1 SEMPRE exibem placeholders (independente de isLocked)
                                // Motivo: sistema não gerencia resultados, chave é preenchida manualmente
                                let athleteA: string | null = null
                                let athleteB: string | null = null

                                if (round === 1) {
                                    // Round 1: exibe nomes reais via athleteMap
                                    athleteA = athleteMap.get(match.slot_a) || null
                                    athleteB = athleteMap.get(match.slot_b) || null

                                    // Proteção: se mesmo atleta nos dois lados, limpar um
                                    if (athleteA && athleteB && athleteA === athleteB) {
                                        athleteB = null // Mostra como BYE para evitar duplicação visual
                                    }
                                }
                                // round > 1: athleteA e athleteB permanecem null (placeholder será exibido)

                                return (
                                    <div key={match.id} className="relative">
                                        <Card className={`w-48 overflow-hidden border-2 transition-all ${match.status === 'finished' ? 'border-primary/20 bg-primary/5' : 'border-muted'}`}>
                                            <CardContent className="p-0">
                                                {/* Atleta A */}
                                                <div className={`flex items-center justify-between p-2 border-b text-sm ${round > 1 ? 'min-h-[60px]' : 'min-h-[40px]'}`}>
                                                    <span className={`truncate ${match.winner_id === match.athlete_a_id && match.winner_id ? 'font-bold text-primary' : ''}`}>
                                                        {athleteA || (round === 1 ? <span className="text-muted-foreground/30 italic">BYE</span> : <span>&nbsp;</span>)}
                                                    </span>
                                                    {match.winner_id && match.winner_id === match.athlete_a_id && (
                                                        <Badge variant="success" className="h-4 px-1 text-[10px]">W</Badge>
                                                    )}
                                                </div>

                                                {/* Atleta B */}
                                                <div className={`flex items-center justify-between p-2 text-sm ${round > 1 ? 'min-h-[60px]' : 'min-h-[40px]'}`}>
                                                    <span className={`truncate ${match.winner_id === match.athlete_b_id && match.winner_id ? 'font-bold text-primary' : ''}`}>
                                                        {athleteB || (round === 1 ? <span className="text-muted-foreground/30 italic">BYE</span> : <span>&nbsp;</span>)}
                                                    </span>
                                                    {match.winner_id && match.winner_id === match.athlete_b_id && (
                                                        <Badge variant="success" className="h-4 px-1 text-[10px]">W</Badge>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Conexões (SVG ou CSS) - Omitido por simplicidade visual no MVP, mas usando espaçamento gaps */}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {!isLocked && (
                <div className="mt-12 p-4 bg-muted/50 rounded-lg border border-dashed text-center">
                    <p className="text-sm text-muted-foreground italic">
                        Esta é uma prévia dinâmica. Os nomes finais e "Byes" serão confirmados ao encerrar as inscrições.
                    </p>
                </div>
            )}
        </div>
    )
}
