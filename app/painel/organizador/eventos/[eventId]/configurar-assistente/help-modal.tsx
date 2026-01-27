"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Info, MessageSquare, HelpCircle, SkipForward, ListChecks, Check } from "lucide-react"

export function HelpModal() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 shrink-0">
                    <Info className="h-4 w-4" />
                    Como funciona?
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Como funciona o Assistente?</DialogTitle>
                    <DialogDescription>
                        Entenda como usar esta ferramenta para configurar seu evento rapidamente.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    <div className="space-y-2">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                                <MessageSquare className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">O que é o chat?</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    O assistente vai te fazer perguntas baseadas em eventos de Jiu-Jitsu anteriores.
                                    Você responde, e ele formata tudo bonitinho antes de publicar.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                                <HelpCircle className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">Para que serve "Tenho dúvida sobre esta pergunta"?</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Se você não entender uma pergunta, clique aqui.
                                    O assistente vai explicar melhor e dar exemplos práticos.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                                <SkipForward className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">O que significa "Pular esta pergunta"?</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Algumas perguntas podem não se aplicar ao seu evento (ex: VIP, sorteios).
                                    Você pode pular e voltar depois, se quiser.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                                <ListChecks className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">Como funciona o resumo lateral?</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Mostra todas as perguntas e o que você já respondeu.
                                    Use para navegar e ver seu progresso em tempo real.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-green-100 shrink-0">
                                <Check className="h-4 w-4 text-green-700" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">Quando as respostas são salvas?</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    <strong className="text-foreground">Nada é salvo automaticamente!</strong>
                                    {" "}Você sempre precisa aprovar antes de publicar qualquer informação.
                                    Isso garante que você tenha controle total sobre o que vai aparecer no seu evento.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <DialogTrigger asChild>
                        <Button>Entendi</Button>
                    </DialogTrigger>
                </div>
            </DialogContent>
        </Dialog>
    )
}
