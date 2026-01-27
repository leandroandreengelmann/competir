"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Image as ImageIcon } from "lucide-react"

interface EventPosterSquareProps {
    imageUrl: string | null
    eventName: string
}

export function EventPosterSquare({ imageUrl, eventName }: EventPosterSquareProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="group relative"
        >
            <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted ring-1 ring-black/5">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={`Poster do evento ${eventName}`}
                        className="relative h-full w-full object-cover"
                        loading="eager"
                    />
                ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-muted/50">
                        <div className="p-6 rounded-full bg-white/50">
                            <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                        <p className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                            Sem imagem oficial
                        </p>
                    </div>
                )}
            </div>

            {/* Micro-interação: Brilho discreto ao passar o mouse */}
            <div className="absolute inset-0 rounded-lg pointer-events-none ring-1 ring-inset ring-black/5 group-hover:ring-primary/20 transition-all duration-300" />
        </motion.div>
    )
}
