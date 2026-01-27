"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, FileIcon, Image as ImageIcon, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface Attachment {
    id: string
    file_name: string
    file_url: string
    file_type: string
}

interface FAQItem {
    id: string
    question: string
    answer: string
    attachments?: Attachment[]
}

interface EventFAQAccordionProps {
    items: FAQItem[]
}

export function EventFAQAccordion({ items }: EventFAQAccordionProps) {
    const [openId, setOpenId] = React.useState<string | null>(items[0]?.id || null)

    const toggle = (id: string) => {
        setOpenId(openId === id ? null : id)
    }

    return (
        <div className="space-y-4">
            {items.map((item) => (
                <div
                    key={item.id}
                    className={cn(
                        "group border rounded-lg overflow-hidden transition-all duration-300 bg-card",
                        openId === item.id ? "ring-1 ring-primary/20 border-primary/30" : "hover:border-primary/30"
                    )}
                >
                    <button
                        onClick={() => toggle(item.id)}
                        className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                    >
                        <span className={cn(
                            "text-lg font-bold transition-colors duration-300",
                            openId === item.id ? "text-primary" : "text-foreground group-hover:text-primary/80"
                        )}>
                            {item.question}
                        </span>
                        <motion.div
                            animate={{ rotate: openId === item.id ? 180 : 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-full bg-muted transition-colors duration-300",
                                openId === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                            )}
                        >
                            <ChevronDown className="w-5 h-5" />
                        </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                        {openId === item.id && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                            >
                                <div className="px-6 pb-8 border-t bg-muted/5">
                                    <div className="pt-6 space-y-6">
                                        {/* Resposta */}
                                        <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                            {item.answer}
                                        </div>

                                        {/* Anexos */}
                                        {item.attachments && item.attachments.length > 0 && (
                                            <div className="flex flex-col gap-6">
                                                {item.attachments.map((att) => (
                                                    <div
                                                        key={att.id}
                                                        className="group/att relative overflow-hidden rounded-lg border bg-background/50 p-2 transition-all duration-300"
                                                    >
                                                        {att.file_type.startsWith('image/') ? (
                                                            <div className="space-y-2">
                                                                <div className="relative rounded-lg overflow-hidden bg-black/5">
                                                                    <img
                                                                        src={att.file_url}
                                                                        alt={att.file_name}
                                                                        className="w-full h-auto object-contain"
                                                                        loading="lazy"
                                                                    />
                                                                    <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                                                        <Button variant="secondary" size="sm" asChild className="gap-2">
                                                                            <a href={att.file_url} target="_blank" rel="noopener noreferrer">
                                                                                <ImageIcon className="w-4 h-4" />
                                                                                Ver em tamanho real
                                                                            </a>
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                                <p className="text-xs px-1 text-muted-foreground">{att.file_name}</p>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-between gap-3 p-2">
                                                                <div className="flex items-center gap-3 overflow-hidden">
                                                                    <div className="flex-shrink-0 p-2.5 bg-primary/10 rounded-lg text-primary">
                                                                        <FileIcon className="w-5 h-5" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-semibold truncate text-foreground">{att.file_name}</p>
                                                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Documento PDF</p>
                                                                    </div>
                                                                </div>
                                                                <Button variant="ghost" size="icon" asChild className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                                                                    <a href={att.file_url} target="_blank" rel="noopener noreferrer">
                                                                        <ExternalLink className="w-4 h-4" />
                                                                    </a>
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ))}
        </div>
    )
}
