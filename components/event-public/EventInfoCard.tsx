"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Calendar, Trophy, CheckCircle2, Share2 } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface EventInfoCardProps {
    name: string
    date: string
    isOpen: boolean
    inscriptionUrl: string
}

export function EventInfoCard({ name, date, isOpen, inscriptionUrl }: EventInfoCardProps) {
    const formattedDate = new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    })

    const handleShare = async () => {
        const shareData = {
            title: name,
            text: `Confira este evento: ${name}`,
            url: window.location.href,
        }

        if (navigator.share) {
            try {
                await navigator.share(shareData)
            } catch (err) {
                if (err instanceof Error && err.name !== 'AbortError') {
                    console.error('Error sharing:', err)
                }
            }
        } else {
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareData.text} ${shareData.url}`)}`
            window.open(whatsappUrl, '_blank')
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
        >
            <Card className="border bg-white overflow-hidden rounded-lg">
                <CardHeader className="pb-4 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <h1 className="text-3xl sm:text-4xl font-black leading-tight text-foreground tracking-tight">
                                {name}
                            </h1>
                        </div>
                        {isOpen ? (
                            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-1.5 px-3 rounded-md">
                                Inscrições Abertas
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="font-bold py-1.5 px-3 rounded-md opacity-70">
                                Inscrições Encerradas
                            </Badge>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Detalhes Rápidos */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-muted transition-colors hover:bg-muted/50">
                            <div className="h-10 w-10 flex items-center justify-center rounded-md bg-primary/10 text-primary">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/80">Data</p>
                                <p className="font-bold text-sm truncate">{formattedDate}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-muted transition-colors hover:bg-muted/50">
                            <div className="h-10 w-10 flex items-center justify-center rounded-md bg-primary/10 text-primary">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/80">Status</p>
                                <p className="font-bold text-sm truncate">{isOpen ? "Confirmado" : "Finalizado"}</p>
                            </div>
                        </div>
                    </div>

                    {/* CTA Section */}
                    <div className="pt-4 space-y-3">
                        {isOpen ? (
                            <Button asChild size="lg" className="w-full h-14 rounded-lg text-base font-black uppercase tracking-wider transition-all">
                                <Link href={inscriptionUrl}>
                                    Fazer minha inscrição
                                </Link>
                            </Button>
                        ) : (
                            <Button disabled size="lg" className="w-full h-14 rounded-lg text-base font-black opacity-50 grayscale">
                                Inscrições encerradas
                            </Button>
                        )}

                        <Button
                            size="lg"
                            className="w-full h-14 rounded-lg text-base font-black uppercase tracking-wider transition-all gap-2 border-2 border-primary text-primary bg-white hover:bg-primary/5"
                            onClick={handleShare}
                        >
                            <Share2 className="w-5 h-5" />
                            Compartilhar Evento
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
