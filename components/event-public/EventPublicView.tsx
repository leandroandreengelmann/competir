"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { PublicHeader } from "@/components/public-header"
import { BarChart3, Clock } from "lucide-react"
import { EventPosterSquare } from "./EventPosterSquare"
import { EventInfoCard } from "./EventInfoCard"
import { EventLocationCard } from "./EventLocationCard"
import { EventTabs } from "./EventTabs"
import { EventFAQAccordion } from "./EventFAQAccordion"
import { PublicFooter } from "@/components/public-footer"

interface User {
    id: string
    name: string
    email: string
    role: string
}

interface Attachment {
    id: string
    file_name: string
    file_url: string
    file_type: string
}

interface PublishedInfo {
    responses: Array<{
        kb_term: string
        answer_raw: string
    }>
    customItems: Array<{
        question_text: string
        answer_text: string
    }>
    attachmentsMap: Record<string, Attachment[]>
}

interface Event {
    id: string
    name: string
    address: string
    address_text?: string
    address_formatted?: string
    lat?: number
    lng?: number
    place_id?: string
    description: string
    date: string
    image_url: string | null
    is_open_for_inscriptions: boolean
}

interface EventPublicViewProps {
    event: Event
    user: User | null
    publishedInfo: PublishedInfo | null
    inscriptionUrl: string
}

export function EventPublicView({ event, user, publishedInfo, inscriptionUrl }: EventPublicViewProps) {
    // Converter informações publicadas para o formato do acordeon
    const faqItems = React.useMemo(() => {
        if (!publishedInfo) return []

        const items = publishedInfo.responses.map((resp, idx) => ({
            id: `resp-${idx}`,
            question: resp.kb_term,
            answer: resp.answer_raw,
            attachments: publishedInfo.attachmentsMap[resp.kb_term] || []
        }))

        const customItems = publishedInfo.customItems.map((item, idx) => ({
            id: `custom-${idx}`,
            question: item.question_text,
            answer: item.answer_text,
            attachments: [] // Custom items generally don't have attachments in the current schema
        }))

        return [...items, ...customItems]
    }, [publishedInfo])

    return (
        <div className="min-h-screen bg-[#FDFDFD] selection:bg-primary/10 selection:text-primary flex flex-col">
            {/* Header padrão */}
            <PublicHeader user={user} />

            {/* Conteúdo principal */}
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
                <div className="space-y-16">

                    {/* (1) HEADER DO EVENTO — Layout 2 colunas */}
                    <div className="grid gap-8 lg:grid-cols-2 items-start">
                        {/* Coluna esquerda: Poster quadrado */}
                        <div className="w-full max-w-xl mx-auto lg:mx-0">
                            <EventPosterSquare
                                imageUrl={event.image_url}
                                eventName={event.name}
                            />
                        </div>

                        {/* Coluna direita: Info Card + Localização */}
                        <div className="flex flex-col gap-8">
                            <EventInfoCard
                                name={event.name}
                                date={event.date}
                                isOpen={event.is_open_for_inscriptions}
                                inscriptionUrl={inscriptionUrl}
                            />

                            <EventLocationCard
                                address={event.address}
                                address_formatted={event.address_formatted}
                                lat={event.lat}
                                lng={event.lng}
                            />
                        </div>
                    </div>

                    {/* (2) NAVEGAÇÃO DE SEÇÕES (Tabs) */}
                    <div className="pt-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                        <EventTabs
                            activeTab="info"
                            onTabChange={() => { }}
                        />
                    </div>

                    {/* (3) CONTEÚDO DINÂMICO (Acordeon) */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key="info"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="bg-white rounded-lg p-1 border border-border"
                        >
                            <div className="p-4 sm:p-8 space-y-8">
                                <div className="max-w-3xl">
                                    <h2 className="text-3xl font-black tracking-tight text-foreground mb-4">Informações Gerais</h2>
                                    <p className="text-muted-foreground font-medium">
                                        Confira abaixo todos os detalhes e regras oficiais para o evento.
                                        Selecione um tópico para expandir.
                                    </p>
                                </div>

                                {faqItems.length > 0 ? (
                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                                        <EventFAQAccordion items={faqItems} />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-lg bg-muted/5">
                                        <p className="text-muted-foreground font-semibold">Nenhuma informação geral disponível.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* Rodapé Padronizado */}
            <PublicFooter />
        </div>
    )
}
