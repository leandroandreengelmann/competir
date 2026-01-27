"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { MapPin, Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EventLocationCardProps {
    address: string
    address_formatted?: string
    lat?: number
    lng?: number
}

export function EventLocationCard({ address, address_formatted, lat, lng }: EventLocationCardProps) {
    // Se tiver coordenadas, usar query exata de lat/lng para o marcador ser preciso
    const query = (lat && lng) ? `${lat},${lng}` : encodeURIComponent(address_formatted || address)
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${query}`

    // Usar o endereço formatado se disponível, senão o original
    const displayAddress = address_formatted || address

    // Tentar extrair cidade/estado
    // Se vier do Google, geralmente é "Rua X, 123 - Cidade, Estado, CEP, País"
    const addressParts = displayAddress.split(',').map(p => p.trim())

    let cityState = "Local sob consulta"
    if (addressParts.length >= 3) {
        // Padrão comum do Google: Bairro, Cidade - Estado
        // Vamos tentar pegar a parte que contém o hífen da cidade-estado
        const cityPart = addressParts.find(p => p.includes(' - ')) || addressParts[addressParts.length - 2]
        cityState = cityPart || "Localização"
    } else if (addressParts.length > 1) {
        cityState = addressParts[addressParts.length - 2]
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
            className="group relative overflow-hidden rounded-lg bg-white border border-border p-6"
        >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
                <div className="flex items-start gap-4 flex-1 min-w-0 w-full">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                        <MapPin className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/80 mb-0.5">Localização</p>
                        <h3 className="text-xl font-bold text-foreground leading-tight tracking-tight mb-1 truncate">{cityState}</h3>
                        <p className="text-sm text-muted-foreground/90 font-medium line-clamp-2 sm:line-clamp-1">
                            {displayAddress}
                        </p>
                    </div>
                </div>

                <div className="flex-shrink-0 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        size="lg"
                        asChild
                        className="w-full sm:w-auto rounded-lg gap-2 font-bold px-8 h-12 border-primary/20 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-sm"
                    >
                        <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                            <Navigation className="w-4 h-4" />
                            Ver no Mapa
                        </a>
                    </Button>
                </div>
            </div>

            {/* Fundo decorativo sutil */}
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-500">
                <MapPin className="w-32 h-32 rotate-12" />
            </div>
        </motion.div>
    )
}
