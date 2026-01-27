"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight, Home, ListChecks } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { AnimatedCheckIcon } from "./animated-check"

interface ConfirmationClientProps {
    registrationData: {
        id: string
        event_name: string
        belt: string
        age_group: string
        amount_cents: number
    }
}

export function PaymentConfirmationClient({ registrationData }: ConfirmationClientProps) {
    const [showOss, setShowOss] = React.useState(false)

    // Efeito para mostrar o "OSS!" após a animação inicial do Check
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setShowOss(true)
        }, 10600) // Permanência mínima de 10s + tempo de construção (~600ms)
        return () => clearTimeout(timer)
    }, [])

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] py-8 sm:py-12 overflow-hidden">
            <Card className="max-w-xl w-full border-none shadow-none bg-transparent">
                <CardContent className="space-y-10 flex flex-col items-center">

                    {/* Container de Animação Principal */}
                    <div className="relative flex items-center justify-center w-full min-h-[220px]">

                        {!showOss ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center"
                            >
                                <div className="mb-8">
                                    <AnimatedCheckIcon />
                                </div>
                                <motion.h1
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-2xl sm:text-3xl font-bold text-center text-foreground"
                                >
                                    Pagamento Confirmado!
                                </motion.h1>
                                <motion.p
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    className="text-3xl sm:text-4xl font-black text-center mt-6 text-primary leading-tight"
                                >
                                    Sua inscrição está garantida. <br /> Nos vemos no tatame.
                                </motion.p>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 15
                                }}
                                className="flex flex-col items-center"
                            >
                                <div className="text-8xl sm:text-9xl font-black tracking-tighter text-primary drop-shadow-[0_10px_10px_rgba(var(--primary-rgb),0.2)]">
                                    OSS!
                                </div>
                                <motion.div
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ delay: 0.4, duration: 0.8 }}
                                    className="h-1.5 w-24 bg-primary mt-4 rounded-full"
                                />
                            </motion.div>
                        )}
                    </div>

                    {/* Detalhes da Inscrição (Fade In Suave) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: showOss ? 0.3 : 1.5 }}
                        className="w-full bg-muted/40 rounded-2xl p-6 space-y-3 border border-border/50 backdrop-blur-sm"
                    >
                        <div className="flex justify-between items-center text-xs text-muted-foreground uppercase tracking-wider font-bold">
                            <span>Inscrição Confirmada</span>
                            <span className="font-mono">#{registrationData.id.slice(0, 8)}</span>
                        </div>
                        <h3 className="font-extrabold text-lg leading-tight">{registrationData.event_name}</h3>
                        <p className="text-sm font-medium text-muted-foreground">
                            {registrationData.belt} • {registrationData.age_group}
                        </p>
                    </motion.div>

                    {/* Ações */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: showOss ? 0.6 : 2.0 }}
                        className="flex flex-col sm:flex-row gap-3 w-full"
                    >
                        <Button className="flex-1 h-12 text-base font-bold" asChild>
                            <Link href="/painel/atleta">
                                <Home className="w-5 h-5 mr-2" />
                                Ir para meu Painel
                            </Link>
                        </Button>
                        <Button variant="outline" className="flex-1 h-12 text-base font-bold" asChild>
                            <Link href="/painel/atleta">
                                <ListChecks className="w-5 h-5 mr-2" />
                                Ver Inscrições
                            </Link>
                        </Button>
                    </motion.div>
                </CardContent>
            </Card>
        </div>
    )
}
