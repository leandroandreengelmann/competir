"use client"

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createCategoryAction } from "@/app/actions/categories"
import { toast } from "sonner"
import { Sparkles, Loader2, XCircle, CheckCircle2, Play, CircleSlash, AlertCircle, SkipForward, RotateCcw } from "lucide-react"
import {
    getAgeGroupDivision,
    isBeltCompatible,
    getCBJJWeightClasses,
    isMixedAbsoluteBelt
} from "@/lib/cbjj-gi-rules"
import { motion, AnimatePresence } from "framer-motion"

// Eliminada persistência via localStorage para garantir reset total a cada abertura.
// O diálogo é remontado via key no CategoriesClient.

interface Belt {
    id: string
    name: string
}

interface AgeGroup {
    id: string
    name: string
}

interface Category {
    id: string
    belt_id?: string
    age_group_id?: string
    min_weight: number
    max_weight: number
}

interface LogEntry {
    id: string
    label: string
    status: 'success' | 'skip' | 'error'
    message?: string
}

interface ProgressState {
    current: number
    total: number
    created: number
    skipped: number
    errors: number
}


interface AICategoryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    belts: Belt[]
    ageGroups: AgeGroup[]
    existingCategories: Category[]
    onSuccess: () => void
}

export function AICategoryDialog({
    open,
    onOpenChange,
    belts,
    ageGroups,
    existingCategories,
    onSuccess
}: AICategoryDialogProps) {
    const [registrationFee, setRegistrationFee] = useState("120")
    const [autoWeights, setAutoWeights] = useState(true)
    const [isProcessing, setIsProcessing] = useState(false)
    const [isCancelled, setIsCancelled] = useState(false)
    const [progress, setProgress] = useState<ProgressState>({ current: 0, total: 0, created: 0, skipped: 0, errors: 0 })
    const [logs, setLogs] = useState<LogEntry[]>([])

    const scrollRef = useRef<HTMLDivElement>(null)
    const cancelRef = useRef<boolean>(false)


    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [logs])

    const handleStop = () => {
        cancelRef.current = true
        setIsCancelled(true)
        setIsProcessing(false)
        toast.warning("Geração interrompida.")
    }

    const handleReset = () => {
        if (isProcessing) return
        setRegistrationFee("120")
        setAutoWeights(true)
        setProgress({ current: 0, total: 0, created: 0, skipped: 0, errors: 0 })
        setLogs([])
        setIsCancelled(false)
    }

    const handleGenerate = async () => {
        setIsProcessing(true)
        setIsCancelled(false)
        cancelRef.current = false

        const allJobs: any[] = []

        // Auxiliares de busca de faixa
        const beltMap = new Map<string, string>()
        belts.forEach((b: Belt) => {
            const norm = b.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            beltMap.set(norm, b.id)
        })

        const findBeltId = (names: string[]) => {
            for (const name of names) {
                const id = beltMap.get(name)
                if (id) return id
            }
            return null
        }

        // 1. Mapear todas as combinações possíveis (Jobs)
        for (const ageGroup of ageGroups) {
            const division = getAgeGroupDivision(ageGroup.name)

            if (division === 'Unknown') {
                allJobs.push({
                    label: `Idade: ${ageGroup.name}`,
                    skipImmediately: true,
                    skipMessage: "Pulada (Regra CBJJ: age_group não reconhecido)"
                })
                continue
            }

            // A) Categorias de Peso
            for (const belt of belts) {
                if (!isBeltCompatible(belt.name, ageGroup.name)) {
                    allJobs.push({
                        label: `${belt.name} • ${ageGroup.name}`,
                        skipImmediately: true,
                        skipMessage: "Pulada (Regra CBJJ: Faixa incompatível com Idade)"
                    })
                    continue
                }

                const weightClasses = autoWeights ? getCBJJWeightClasses(ageGroup.name) : []

                if (autoWeights && weightClasses.length > 0) {
                    for (const wc of weightClasses) {
                        allJobs.push({
                            belt_id: belt.id,
                            age_group_id: ageGroup.id,
                            min_weight: wc.min_weight,
                            max_weight: wc.max_weight,
                            mode: "RANGE",
                            label: `${belt.name} • ${ageGroup.name}`
                        })
                    }
                } else {
                    allJobs.push({
                        belt_id: belt.id,
                        age_group_id: ageGroup.id,
                        min_weight: -1,
                        max_weight: -1,
                        mode: "FREE",
                        label: `${belt.name} • ${ageGroup.name}`
                    })
                }
            }

            // B) Categorias de Absoluto
            if (division === 'Adulto' || division === 'Master') {
                const mixedId = findBeltId(["preta", "marrom", "roxa", "azul"])
                if (mixedId) {
                    allJobs.push({
                        belt_id: mixedId,
                        age_group_id: ageGroup.id,
                        min_weight: -1,
                        max_weight: -1,
                        mode: "FREE",
                        isMixed: true,
                        label: `Absoluto Misto • ${ageGroup.name} (Azul a Preta)`
                    })
                }
                const brancaId = findBeltId(["branca"])
                if (brancaId) {
                    allJobs.push({
                        belt_id: brancaId,
                        age_group_id: ageGroup.id,
                        min_weight: -1,
                        max_weight: -1,
                        mode: "FREE",
                        label: `Branca • ${ageGroup.name} (Absoluto)`
                    })
                }
            } else {
                for (const belt of belts) {
                    if (isBeltCompatible(belt.name, ageGroup.name)) {
                        allJobs.push({
                            belt_id: belt.id,
                            age_group_id: ageGroup.id,
                            min_weight: -1,
                            max_weight: -1,
                            mode: "FREE",
                            label: `${belt.name} • ${ageGroup.name}`
                        })
                    }
                }
            }
        }

        if (allJobs.length === 0) {
            toast.info("Nenhuma combinação compatível encontrada.")
            setIsProcessing(false)
            return
        }

        if (progress.current === 0) {
            setProgress((prev: ProgressState) => ({ ...prev, total: allJobs.length }))
        }

        const mixedBeltsSet = new Set<string>()
        belts.forEach((b: Belt) => { if (isMixedAbsoluteBelt(b.name, "Adulto")) mixedBeltsSet.add(b.id) })

        const existingKeySet = new Set<string>()
        const combinationModeMap = new Map<string, "FREE" | "RANGE" | "BOTH">()

        existingCategories.forEach((c: Category) => {
            const mode = (c.min_weight === -1 && c.max_weight === -1) ? "FREE" : "RANGE"
            const comboKey = `${c.belt_id}|${c.age_group_id}`
            existingKeySet.add(`${c.belt_id}|${c.age_group_id}|${mode === "FREE" ? "free" : "range"}|${Number(c.min_weight)}|${Number(c.max_weight)}`)

            if (mode === "FREE" && mixedBeltsSet.has(c.belt_id!)) {
                const ag = ageGroups.find((a: AgeGroup) => a.id === c.age_group_id)
                if (ag && (getAgeGroupDivision(ag.name) === 'Adulto' || getAgeGroupDivision(ag.name) === 'Master')) {
                    existingKeySet.add(`MIXED_ABS|${c.age_group_id}`)
                }
            }

            const cm = combinationModeMap.get(comboKey)
            if (!cm) combinationModeMap.set(comboKey, mode)
            else if (cm !== mode) combinationModeMap.set(comboKey, "BOTH")
        })

        for (let i = progress.current; i < allJobs.length; i++) {
            if (cancelRef.current) break

            const job = allJobs[i]

            if (job.skipImmediately) {
                setProgress((prev: ProgressState) => ({ ...prev, current: i + 1, skipped: prev.skipped + 1 }))
                setLogs((prev: LogEntry[]) => [...prev.slice(-49), { id: Math.random().toString(), label: job.label, status: 'skip', message: job.skipMessage }])
                continue
            }

            const jobKey = job.isMixed
                ? `MIXED_ABS|${job.age_group_id}`
                : `${job.belt_id}|${job.age_group_id}|${job.mode === "FREE" ? "free" : "range"}|${job.min_weight}|${job.max_weight}`

            if (existingKeySet.has(jobKey)) {
                setProgress((prev: ProgressState) => ({ ...prev, current: i + 1, skipped: prev.skipped + 1 }))
                setLogs((prev: LogEntry[]) => [...prev.slice(-49), { id: Math.random().toString(), label: job.label, status: 'skip', message: "Já existe no banco" }])
                continue
            }

            const comboKey = `${job.belt_id}|${job.age_group_id}`
            const existingMode = combinationModeMap.get(comboKey)
            if (existingMode && existingMode !== job.mode && existingMode !== "BOTH") {
                const msg = job.mode === "RANGE" ? "Conflito: já existe Peso Livre" : "Conflito: já existem categorias com peso"
                setProgress((prev: ProgressState) => ({ ...prev, current: i + 1, skipped: prev.skipped + 1 }))
                setLogs((prev: LogEntry[]) => [...prev.slice(-49), { id: Math.random().toString(), label: job.label, status: 'skip', message: msg }])
                continue
            }

            const formData = new FormData()
            formData.append('belt_id', job.belt_id)
            formData.append('age_group_id', job.age_group_id)
            formData.append('registration_fee', registrationFee)
            if (job.min_weight !== -1) formData.append('min_weight', job.min_weight.toString())
            if (job.max_weight !== -1) formData.append('max_weight', job.max_weight.toString())

            try {
                const result = await createCategoryAction({ success: false }, formData)
                if (result.success) {
                    existingKeySet.add(jobKey)
                    setProgress((prev: ProgressState) => ({ ...prev, current: i + 1, created: prev.created + 1 }))
                    setLogs((prev: LogEntry[]) => [...prev.slice(-49), { id: Math.random().toString(), label: job.label, status: 'success' }])
                } else {
                    setProgress((prev: ProgressState) => ({ ...prev, current: i + 1, errors: prev.errors + 1 }))
                    setLogs((prev: LogEntry[]) => [...prev.slice(-49), { id: Math.random().toString(), label: job.label, status: 'error', message: String(result.error) }])
                }
            } catch (error) {
                setProgress((prev: ProgressState) => ({ ...prev, current: i + 1, errors: prev.errors + 1 }))
                setLogs((prev: LogEntry[]) => [...prev.slice(-49), { id: Math.random().toString(), label: job.label, status: 'error', message: "Erro de conexão" }])
            }

            await new Promise(r => setTimeout(r, 100))
        }

        const isFinished = !cancelRef.current && progress.total > 0
        setIsProcessing(false)
        if (isFinished) {
            toast.success("Processamento concluído!")
            onSuccess()
        }
    }

    return (
        <Dialog open={open} onOpenChange={isProcessing ? undefined : onOpenChange}>
            <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                        <Sparkles className="h-6 w-6 text-primary" />
                        Inteligência de Categorias
                    </DialogTitle>
                    <DialogDescription className="text-base text-muted-foreground">
                        Sincronização robusta com proteção contra duplicidade e conflitos.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex flex-col gap-4 p-6 pt-2 overflow-hidden">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-primary/5">
                        <div className="space-y-1.5">
                            <Label htmlFor="ai_registration_fee" className="text-xs font-bold uppercase tracking-wider opacity-60">Inscrição (R$)</Label>
                            <Input
                                id="ai_registration_fee"
                                type="number"
                                step="0.01"
                                value={registrationFee}
                                onChange={(e) => setRegistrationFee(e.target.value)}
                                disabled={isProcessing || progress.current > 0}
                                className="h-10 text-lg font-bold border-primary/10 bg-card"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5 justify-center">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="auto_weights"
                                    checked={autoWeights}
                                    onChange={(e) => setAutoWeights(e.target.checked)}
                                    disabled={isProcessing || progress.current > 0}
                                    className="w-4 h-4 rounded border-primary/20 text-primary cursor-pointer"
                                />
                                <Label htmlFor="auto_weights" className={`text-sm font-semibold cursor-pointer ${autoWeights ? 'text-primary' : 'text-muted-foreground'}`}>
                                    Categorias Oficiais CBJJ
                                </Label>
                            </div>
                            <p className="text-[10px] text-muted-foreground italic pl-6 leading-tight">
                                Proteção automática contra duplicidade.
                            </p>
                        </div>
                    </div>

                    {(isProcessing || progress.current > 0) && (
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between px-1 text-sm font-bold tracking-tight">
                                <div className="flex items-center gap-2">
                                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <CircleSlash className="h-4 w-4 text-amber-500" />}
                                    <span className={isProcessing ? "text-primary animate-pulse" : "text-amber-500"}>
                                        {isProcessing ? "Executando..." : "Em pausa"}
                                    </span>
                                </div>
                                <span className="font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded text-xs">
                                    {progress.current} / {progress.total}
                                </span>
                            </div>

                            <div className="relative h-4 w-full bg-secondary/30 rounded-full overflow-hidden border border-primary/5">
                                <motion.div
                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/80 to-primary"
                                    initial={{ width: 0 }}
                                    animate={{ width: progress.total > 0 ? `${(progress.current / progress.total) * 100}%` : 0 }}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-2 py-1">
                                <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-3 text-center">
                                    <div className="text-xl font-bold text-green-600">{progress.created}</div>
                                    <div className="text-[9px] font-black uppercase text-green-700/60">Criadas</div>
                                </div>
                                <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3 text-center">
                                    <div className="text-xl font-bold text-amber-600">{progress.skipped}</div>
                                    <div className="text-[9px] font-black uppercase text-amber-700/60">Puladas</div>
                                </div>
                                <div className="bg-destructive/5 border border-destructive/10 rounded-lg p-3 text-center">
                                    <div className="text-xl font-bold text-destructive">{progress.errors}</div>
                                    <div className="text-[9px] font-black uppercase text-destructive/60">Erros</div>
                                </div>
                            </div>

                            <div ref={scrollRef} className="h-40 overflow-y-auto rounded-xl bg-muted/30 border border-primary/5 p-4 space-y-2 shadow-inner scrollbar-thin scrollbar-thumb-primary/10">
                                <AnimatePresence initial={false}>
                                    {logs.map((log: LogEntry) => (
                                        <motion.div
                                            key={log.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center justify-between text-xs bg-card p-2 rounded-lg border border-primary/5 shadow-sm"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                {log.status === 'success' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : log.status === 'skip' ? <SkipForward className="h-4 w-4 text-amber-500" /> : <AlertCircle className="h-4 w-4 text-destructive" />}
                                                <div className="flex flex-col truncate">
                                                    <span className="font-semibold text-foreground/80">{log.label}</span>
                                                    {log.message && <span className="text-[10px] text-muted-foreground italic">{log.message}</span>}
                                                </div>
                                            </div>
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${log.status === 'success' ? "bg-green-500/10 text-green-600" : log.status === 'skip' ? "bg-amber-500/10 text-amber-600" : "bg-destructive/10 text-destructive"}`}>
                                                {log.status === 'success' ? "Ok" : log.status === 'skip' ? "Pulada" : "Erro"}
                                            </span>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 pt-0 gap-3 border-t border-primary/5 bg-muted/10">
                    <div className="flex-1 flex gap-2">
                        {progress.current > 0 && !isProcessing && (
                            <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-destructive gap-1 px-2">
                                <RotateCcw className="h-3.5 w-3.5" /> Reiniciar
                            </Button>
                        )}
                    </div>
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isProcessing}>Fechar</Button>
                    {isProcessing ? (
                        <Button variant="destructive" onClick={handleStop} className="gap-2 font-bold shadow-lg shadow-destructive/10">
                            <XCircle className="h-4 w-4" /> Parar
                        </Button>
                    ) : (
                        <Button
                            onClick={handleGenerate}
                            disabled={!registrationFee || parseFloat(registrationFee) < 0 || (progress.total > 0 && progress.current === progress.total)}
                            className="gap-2 min-w-[140px] font-bold shadow-lg shadow-primary/20"
                        >
                            <Sparkles className="h-4 w-4" /> Iniciar Geração
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
