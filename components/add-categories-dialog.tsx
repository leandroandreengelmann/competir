"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { getAvailableCategoriesAction, addCategoriesToEventAction } from "@/app/actions/event-categories"
import { toast } from "sonner"

interface Category {
    id: string
    belt: string
    min_weight: number
    max_weight: number
    age_group: string
    registration_fee: number
}

interface AddCategoriesDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    eventId: string
    onSuccess: () => void
}

export function AddCategoriesDialog({ open, onOpenChange, eventId, onSuccess }: AddCategoriesDialogProps) {
    const [categories, setCategories] = React.useState<Category[]>([])
    const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
    const [isLoading, setIsLoading] = React.useState(false)
    const [isPending, setIsPending] = React.useState(false)

    // Carregar categorias disponíveis quando o modal abrir
    React.useEffect(() => {
        if (open) {
            setSelectedIds(new Set())
            loadCategories()
        }
    }, [open, eventId])

    async function loadCategories() {
        setIsLoading(true)
        try {
            const data = await getAvailableCategoriesAction(eventId)
            setCategories(data)
        } catch (error) {
            console.error('Erro ao carregar categorias:', error)
            toast.error('Erro ao carregar categorias disponíveis')
        } finally {
            setIsLoading(false)
        }
    }

    function toggleCategory(id: string) {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedIds(newSelected)
    }

    const MAX_BATCH = 50
    const isAllSelected = categories.length > 0 && selectedIds.size >= Math.min(categories.length, MAX_BATCH)

    function toggleAll() {
        if (isAllSelected) {
            setSelectedIds(new Set())
        } else {
            // Seleciona apenas as primeiras 50
            const batch = categories.slice(0, MAX_BATCH).map(c => c.id)
            setSelectedIds(new Set(batch))
            if (categories.length > MAX_BATCH) {
                toast.info(`Selecionadas as primeiras ${MAX_BATCH} categorias para garantir estabilidade.`)
            }
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (selectedIds.size === 0) {
            toast.error('Selecione pelo menos uma categoria')
            return
        }

        setIsPending(true)
        try {
            const result = await addCategoriesToEventAction(eventId, Array.from(selectedIds))

            if (result.success) {
                toast.success(result.message)
                onSuccess()
                onOpenChange(false)
            } else {
                toast.error(result.error || 'Erro ao adicionar categorias')
            }
        } catch (error) {
            console.error('Erro ao adicionar categorias:', error)
            toast.error('Erro ao adicionar categorias')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Adicionar Categorias ao Evento</DialogTitle>
                    <DialogDescription>
                        Selecione as categorias que deseja vincular a este evento.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="max-h-[400px] overflow-y-auto space-y-2 py-4">
                        {isLoading ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                Carregando categorias...
                            </p>
                        ) : categories.length === 0 ? (
                            <div className="border border-dashed rounded-lg p-8 text-center">
                                <p className="text-sm text-muted-foreground">
                                    Todas as suas categorias já estão vinculadas a este evento.
                                </p>
                            </div>
                        ) : (
                            <>
                                <Label
                                    className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors mb-4 sticky top-0 z-10"
                                >
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={toggleAll}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <div className="flex-1">
                                        <div className="font-bold text-sm text-primary uppercase tracking-tight">
                                            {categories.length > MAX_BATCH
                                                ? `Selecionar lote (primeiras ${MAX_BATCH} categorias)`
                                                : `Selecionar todas as ${categories.length} categorias`}
                                        </div>
                                        {categories.length > MAX_BATCH && (
                                            <div className="text-[10px] text-muted-foreground italic">
                                                Limite de segurança para evitar erros de rede.
                                            </div>
                                        )}
                                    </div>
                                </Label>

                                {categories.map((category) => (
                                    <Label
                                        key={category.id}
                                        htmlFor={`category-${category.id}`}
                                        className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            id={`category-${category.id}`}
                                            checked={selectedIds.has(category.id)}
                                            onChange={() => toggleCategory(category.id)}
                                            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <div className="flex-1 space-y-1">
                                            <div className="font-medium text-sm">
                                                {category.belt} • {category.age_group}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {category.min_weight === -1 && category.max_weight === -1 ? (
                                                    null
                                                ) : category.min_weight === 0 && category.max_weight === 0 ? (
                                                    'Livre'
                                                ) : (
                                                    `${category.min_weight}kg - ${category.max_weight}kg`
                                                )}
                                                {category.registration_fee > 0 && (
                                                    <> • Inscrição: R$ {category.registration_fee.toFixed(2)}</>
                                                )}
                                            </div>
                                        </div>
                                    </Label>
                                ))}
                            </>
                        )}
                    </div>

                    {!isLoading && categories.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                            {selectedIds.size} categoria(s) selecionada(s)
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending || isLoading || selectedIds.size === 0}
                        >
                            {isPending ? "Adicionando..." : "Adicionar ao Evento"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
