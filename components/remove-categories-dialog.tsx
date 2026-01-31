"use client"

import * as React from "react"
import { Search, Trash2, AlertTriangle, CheckCircle2, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { removeCategoryFromEventAction } from "@/app/actions/event-categories"

interface Category {
    id: string
    belt: string
    age_group: string
    min_weight: number
    max_weight: number
    registration_fee: number
}

interface RemoveCategoriesDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    eventId: string
    categories: Category[]
    onSuccess: () => void
}

export function RemoveCategoriesDialog({
    open,
    onOpenChange,
    eventId,
    categories,
    onSuccess,
}: RemoveCategoriesDialogProps) {
    const [searchTerm, setSearchTerm] = React.useState("")
    const [isRemoving, setIsRemoving] = React.useState<string | null>(null)

    // Lógica de busca multi-termo
    const filteredCategories = React.useMemo(() => {
        if (!searchTerm) return categories

        const terms = searchTerm
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .split(/\s+/)

        return categories.filter((cat) => {
            const content = `${cat.belt} ${cat.age_group}`.toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")

            return terms.every(term => content.includes(term))
        })
    }, [categories, searchTerm])

    // Lógica de duplicidade por nome
    const duplicatesByName = React.useMemo(() => {
        const groups = new Map<string, Category[]>()
        categories.forEach(cat => {
            const key = `${cat.belt} ${cat.age_group} ${cat.min_weight}-${cat.max_weight}`.toLowerCase().trim()
            if (!groups.has(key)) groups.set(key, [])
            groups.get(key)!.push(cat)
        })
        return Array.from(groups.entries()).filter(([_, items]) => items.length > 1)
    }, [categories])

    // Lógica de duplicidade por estrutura (Faixa + Idade/Categoria + Peso)
    const duplicatesByStructure = React.useMemo(() => {
        const groups = new Map<string, Category[]>()
        categories.forEach(cat => {
            // Chave composta incluindo peso
            const weightKey = (cat.min_weight === -1 && cat.max_weight === -1)
                ? 'Sem Peso'
                : cat.min_weight === 0 && cat.max_weight === 0
                    ? 'Livre'
                    : `${cat.min_weight}kg-${cat.max_weight}kg`

            const key = `${cat.belt}|${cat.age_group}|${weightKey}`.toLowerCase()

            if (!groups.has(key)) groups.set(key, [])
            groups.get(key)!.push(cat)
        })
        return Array.from(groups.entries()).filter(([_, items]) => items.length > 1)
    }, [categories])

    async function handleRemove(categoryId: string) {
        if (!confirm("Deseja realmente retirar esta categoria deste evento?")) return

        setIsRemoving(categoryId)
        try {
            const result = await removeCategoryFromEventAction(eventId, categoryId)
            if (result.success) {
                toast.success("Categoria retirada com sucesso")
                onSuccess()
            } else {
                toast.error(result.error || "Erro ao retirar categoria")
            }
        } catch (error) {
            toast.error("Erro na comunicação com o servidor")
        } finally {
            setIsRemoving(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Trash2 className="h-5 w-5 text-destructive" />
                        Retirar Categorias do Evento
                    </DialogTitle>
                    <DialogDescription>
                        Remova categorias deste evento ou identifique duplicidades indesejadas.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="search" className="flex-1 flex flex-col min-h-0">
                    <div className="px-6">
                        <TabsList className="grid w-full grid-cols-2 mt-4">
                            <TabsTrigger value="search" className="gap-2">
                                <Search className="h-4 w-4" />
                                Buscar Associadas
                            </TabsTrigger>
                            <TabsTrigger value="duplicates" className="gap-2">
                                <Copy className="h-4 w-4" />
                                Detector de Duplicidade
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="search" className="flex-1 flex flex-col p-6 pt-4 gap-4 min-h-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Busque por faixa ou idade (ex: branca master)..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        <div className="flex-1 border rounded-md overflow-y-auto">
                            <div className="p-4 space-y-2">
                                {filteredCategories.length === 0 ? (
                                    <p className="text-center text-sm text-muted-foreground py-8">
                                        Nenhuma categoria encontrada para este termo.
                                    </p>
                                ) : (
                                    filteredCategories.map((cat) => (
                                        <div key={cat.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline">{cat.belt}</Badge>
                                                    <span className="text-sm font-medium">{cat.age_group}</span>
                                                </div>
                                                <div className="text-xs font-bold text-primary">
                                                    {cat.min_weight === -1 && cat.max_weight === -1 ? (
                                                        null
                                                    ) : cat.min_weight === 0 && cat.max_weight === 0 ? (
                                                        'Livre'
                                                    ) : (
                                                        `${cat.min_weight}kg - ${cat.max_weight}kg`
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleRemove(cat.id)}
                                                disabled={isRemoving === cat.id}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Retirar
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="duplicates" className="flex-1 flex flex-col p-6 pt-4 gap-4 min-h-0">
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4 flex gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-semibold text-amber-800 dark:text-amber-400">Categorias Duplicadas</p>
                                <p className="text-amber-700 dark:text-amber-500">
                                    Abaixo listamos categorias que parecem ser a mesma (mesmo nome ou estrutura). Remova as extras conforme necessário.
                                </p>
                            </div>
                        </div>

                        <div className="flex-1 border rounded-md overflow-y-auto">
                            <div className="p-4 space-y-6">
                                {duplicatesByStructure.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                                        <CheckCircle2 className="h-10 w-10 text-green-500" />
                                        <p className="text-sm text-muted-foreground">Tudo certo! Nenhuma duplicidade detectada.</p>
                                    </div>
                                ) : (
                                    duplicatesByStructure.map(([name, items]) => (
                                        <div key={name} className="space-y-3">
                                            <h3 className="text-sm font-bold border-l-2 border-primary pl-2 uppercase tracking-tight text-primary">
                                                {name.split('|').join(' • ')}
                                            </h3>
                                            <div className="space-y-2">
                                                {items.map((cat, idx) => (
                                                    <div key={cat.id} className="flex items-center justify-between p-3 border rounded-lg bg-background shadow-sm">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-medium text-muted-foreground uppercase mb-1">
                                                                Instância {idx + 1}
                                                            </span>
                                                            <span className="text-sm">{cat.belt} • {cat.age_group}</span>
                                                            <span className="text-xs font-bold text-primary">
                                                                {cat.min_weight === -1 && cat.max_weight === -1 ? (
                                                                    null
                                                                ) : cat.min_weight === 0 && cat.max_weight === 0 ? (
                                                                    'Livre'
                                                                ) : (
                                                                    `${cat.min_weight}kg - ${cat.max_weight}kg`
                                                                )}
                                                            </span>
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-destructive border-destructive/20 hover:bg-destructive/10"
                                                            onClick={() => handleRemove(cat.id)}
                                                            disabled={isRemoving === cat.id}
                                                        >
                                                            Remover esta
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
