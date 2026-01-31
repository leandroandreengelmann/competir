"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle, Loader2, CheckCircle2, Trash2, FileText, RefreshCw } from "lucide-react"
import { auditCategoriesAction, deleteCategoryAction } from "@/app/actions/categories"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AICategoryCheckerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function AICategoryCheckerDialog({
    open,
    onOpenChange,
    onSuccess
}: AICategoryCheckerDialogProps) {
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [report, setReport] = useState<any>(null)
    const [activeTab, setActiveTab] = useState("duplicates")

    const handleAudit = async () => {
        setIsAnalyzing(true)
        try {
            const result = await auditCategoriesAction()
            if (result.success) {
                setReport(result.report)
            } else {
                toast.error(result.error || "Erro ao realizar auditoria.")
            }
        } catch (error) {
            toast.error("Erro de conexão ao realizar auditoria.")
        } finally {
            setIsAnalyzing(false)
        }
    }

    useEffect(() => {
        if (open) {
            handleAudit()
        } else {
            setReport(null)
        }
    }, [open])

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta categoria inconsistente?")) return

        const result = await deleteCategoryAction(id)
        if (result.success) {
            toast.success("Categoria excluída com sucesso!")
            handleAudit()
            if (onSuccess) onSuccess()
        } else {
            toast.error(result.error || "Erro ao excluir categoria.")
        }
    }

    const handleGeneratePdf = async () => {
        if (!report) return
        toast.info("Iniciando geração do PDF...")
        try {
            const response = await fetch('/api/organizador/categories-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ report })
            })

            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `relatorio-categorias-${new Date().toISOString().split('T')[0]}.pdf`
                a.click()
                toast.success("Relatório gerado com sucesso!")
            } else {
                toast.error("Erro ao gerar PDF.")
            }
        } catch (error) {
            toast.error("Erro ao gerar relatório PDF.")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] h-[85vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                        <AlertCircle className="h-6 w-6 text-primary" />
                        Conferir categorias com IA
                    </DialogTitle>
                    <DialogDescription className="text-base text-muted-foreground">
                        Análise determinística baseada nas regras oficiais CBJJ 2024/2025.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex flex-col gap-4 p-6 pt-2 overflow-hidden">
                    {isAnalyzing ? (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <div className="text-center">
                                <h3 className="font-bold text-lg">Analisando Categorias...</h3>
                                <p className="text-muted-foreground text-sm">Cruzando seus dados com as regras oficiais.</p>
                            </div>
                        </div>
                    ) : report ? (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Resumo em destaque */}
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <SummaryMiniCard
                                    label="Duplicadas"
                                    count={report.summary.duplicatesCount}
                                    color="text-destructive"
                                    bgColor="bg-destructive/5"
                                    borderColor="border-destructive/20"
                                />
                                <SummaryMiniCard
                                    label="Fora do Padrão"
                                    count={report.summary.outOfPatternCount}
                                    color="text-amber-600"
                                    bgColor="bg-amber-500/5"
                                    borderColor="border-amber-500/20"
                                />
                                <SummaryMiniCard
                                    label="Faltantes"
                                    count={report.summary.missingCount}
                                    color="text-blue-600"
                                    bgColor="bg-blue-500/5"
                                    borderColor="border-blue-500/20"
                                />
                            </div>

                            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                                <TabsList className="grid grid-cols-3 w-full shrink-0">
                                    <TabsTrigger value="duplicates" className="relative">
                                        Duplicadas
                                        {report.summary.duplicatesCount > 0 && (
                                            <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-bold text-white shadow-sm">
                                                {report.summary.duplicatesCount}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="pattern" className="relative">
                                        Fora do Padrão
                                        {report.summary.outOfPatternCount > 0 && (
                                            <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-bold text-white shadow-sm">
                                                {report.summary.outOfPatternCount}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="missing" className="relative">
                                        Faltantes
                                        {report.summary.missingCount > 0 && (
                                            <span className="ml-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-500 px-1.5 text-[11px] font-bold text-white shadow-sm">
                                                {report.summary.missingCount}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                </TabsList>

                                <div className="flex-1 mt-4 overflow-hidden">
                                    <TabsContent value="duplicates" className="h-full m-0">
                                        <div className="h-full pr-4 overflow-y-auto">
                                            {report.duplicates.length === 0 ? (
                                                <EmptyState icon={<CheckCircle2 className="h-8 w-8 text-green-500" />} title="Sem duplicatas" description="Todas as suas categorias são únicas." />
                                            ) : (
                                                <div className="space-y-3 pb-4">
                                                    {report.duplicates.map((item: any, idx: number) => (
                                                        <InconsistencyCard
                                                            key={idx}
                                                            item={item}
                                                            onDelete={() => handleDelete(item.category.id)}
                                                            badgeColor="bg-destructive/10 text-destructive"
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="pattern" className="h-full m-0">
                                        <div className="h-full pr-4 overflow-y-auto">
                                            {report.outOfPattern.length === 0 ? (
                                                <EmptyState icon={<CheckCircle2 className="h-8 w-8 text-green-500" />} title="Tudo no padrão" description="Todas as categorias seguem as regras CBJJ." />
                                            ) : (
                                                <div className="space-y-3 pb-4">
                                                    {report.outOfPattern.map((item: any, idx: number) => (
                                                        <InconsistencyCard
                                                            key={idx}
                                                            item={item}
                                                            onDelete={() => handleDelete(item.category.id)}
                                                            badgeColor="bg-amber-500/10 text-amber-600"
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="missing" className="h-full m-0">
                                        <div className="h-full pr-4 overflow-y-auto">
                                            {report.missing.length === 0 ? (
                                                <EmptyState icon={<CheckCircle2 className="h-8 w-8 text-green-500" />} title="Grade completa" description="Você possui todas as categorias oficiais." />
                                            ) : (
                                                <div className="space-y-3 pb-4">
                                                    {report.missing.map((item: any, idx: number) => (
                                                        <MissingCard key={idx} item={item} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground italic">
                            Aguardando análise...
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 pt-0 gap-3 border-t border-primary/5 bg-muted/10">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isAnalyzing}>
                        Fechar
                    </Button>
                    {report && (
                        <>
                            <Button variant="ghost" className="gap-2" onClick={handleAudit} disabled={isAnalyzing}>
                                <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                                Reavaliar
                            </Button>
                            <Button className="gap-2" onClick={handleGeneratePdf} disabled={isAnalyzing}>
                                <FileText className="h-4 w-4" />
                                Relatório PDF
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function InconsistencyCard({ item, onDelete, badgeColor }: { item: any; onDelete: () => void; badgeColor: string }) {
    const { category, reason } = item
    return (
        <CardContainer>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm tracking-tight">{category.belt} • {category.age_group}</span>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {reason}
                </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onDelete} className="text-muted-foreground hover:text-destructive shrink-0">
                <Trash2 className="h-4 w-4" />
            </Button>
        </CardContainer>
    )
}

function MissingCard({ item }: { item: any }) {
    return (
        <CardContainer>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm tracking-tight">{item.belt} • {item.age_group}</span>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    {item.reason}
                </p>
            </div>
        </CardContainer>
    )
}

function CardContainer({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 p-3 bg-card rounded-xl border border-primary/5 shadow-sm hover:shadow-md transition-all">
            {children}
        </div>
    )
}

function SummaryMiniCard({ label, count, color, bgColor, borderColor }: { label: string; count: number; color: string; bgColor: string; borderColor: string }) {
    return (
        <div className={`flex flex-col items-center justify-center p-3 rounded-xl border ${borderColor} ${bgColor} transition-all`}>
            <span className={`text-[10px] font-black uppercase tracking-wider mb-1 opacity-70 ${color}`}>{label}</span>
            <span className={`text-3xl font-black ${color}`}>{count}</span>
        </div>
    )
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-12">
            <div className="p-3 bg-primary/5 rounded-full">{icon}</div>
            <div>
                <h4 className="font-bold">{title}</h4>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
    )
}
