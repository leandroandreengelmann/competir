"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Pencil, Trash2, Tags, Sparkles, Search, AlertCircle, Filter, Activity } from "lucide-react"
import { CategoryDialog } from "@/components/category-dialog"
import { AICategoryDialog } from "@/components/ai-category-dialog"
import { AICategoryCheckerDialog } from "@/components/ai-category-checker-dialog"
import { deleteCategoryAction, deleteAllCategoriesAction, deleteSelectedCategoriesAction, updateAllCategoriesFeeAction } from "@/app/actions/categories"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DollarSign } from "lucide-react"

interface Category {
    id: string
    belt: string
    belt_id?: string
    min_weight: number
    max_weight: number
    min_age: number
    max_age: number
    age_group: string
    age_group_id?: string
    registration_fee: number
    registrations?: { status: string }[]
}

interface Belt {
    id: string
    name: string
}

interface AgeGroup {
    id: string
    name: string
}

interface CategoriesClientProps {
    initialCategories: Category[]
    belts: Belt[]
    ageGroups: AgeGroup[]
}

export function CategoriesClient({ initialCategories, belts, ageGroups }: CategoriesClientProps) {
    const router = useRouter()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isAIDialogOpen, setIsAIDialogOpen] = useState(false)
    const [isCheckerDialogOpen, setIsCheckerDialogOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [aiDialogKey, setAiDialogKey] = useState(0)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isBulkFeeDialogOpen, setIsBulkFeeDialogOpen] = useState(false)
    const [newBulkFee, setNewBulkFee] = useState<string>("0")
    const [isUpdatingFee, setIsUpdatingFee] = useState(false)
    const [showOnlyActive, setShowOnlyActive] = useState(false)

    // Normalização para busca
    // Normalização para busca
    const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

    const filteredCategories = initialCategories.filter(cat => {
        // Filtro de Atividade
        if (showOnlyActive && (!cat.registrations || cat.registrations.length === 0)) {
            return false
        }

        if (!searchTerm) return true

        const terms = normalize(searchTerm).split(" ").filter(t => t.length > 0)

        // Formatações de preço para busca
        const priceValue = cat.registration_fee.toString()
        const priceFormatted = cat.registration_fee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })

        // Construção do índice de busca da categoria
        // Inclui: Faixa, Idade (Categoria), Peso Mínimo, Peso Máximo, Preço e descritivos como "livre" ou "kg"
        const searchableText = normalize(`
            ${cat.belt} 
            ${cat.age_group} 
            ${cat.min_weight}kg 
            ${cat.max_weight}kg 
            ${cat.min_weight === 0 && cat.max_weight === 0 ? 'livre absoluto' : ''}
            R$ ${priceFormatted} 
            ${priceValue}
        `)

        // Lógica AND: A categoria deve conter TODOS os termos digitados
        return terms.every(term => searchableText.includes(term))
    })

    const handleAdd = () => {
        setSelectedCategory(null)
        setIsDialogOpen(true)
    }

    const handleEdit = (category: Category) => {
        setSelectedCategory(category)
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta categoria?")) return

        const result = await deleteCategoryAction(id)
        if (result.success) {
            toast.success("Categoria excluída com sucesso!")
        } else {
            toast.error(result.error || "Erro ao excluir categoria.")
        }
    }

    const handleDeleteAll = async () => {
        const result = await deleteAllCategoriesAction()
        if (result.success) {
            toast.success(result.message || "Todas as categorias foram excluídas!")
        } else {
            toast.error(result.error || "Erro ao excluir categorias.")
        }
    }

    const handleBulkFeeUpdate = async () => {
        const fee = parseFloat(newBulkFee)
        if (isNaN(fee) || fee < 0) {
            toast.error("Por favor, insira um preço válido (mínimo 0).")
            return
        }

        setIsUpdatingFee(true)
        try {
            const result = await updateAllCategoriesFeeAction(fee)
            if (result.success) {
                toast.success(result.message)
                setIsBulkFeeDialogOpen(false)
                router.refresh()
            } else {
                toast.error(result.error || "Erro ao atualizar preços.")
            }
        } catch (error) {
            console.error(error)
            toast.error("Erro ao processar atualização em massa.")
        } finally {
            setIsUpdatingFee(false)
        }
    }

    const handleBulkDelete = async () => {
        const ids = Array.from(selectedIds)
        const result = await deleteSelectedCategoriesAction(ids)
        if (result.success) {
            toast.success(result.message)
            setSelectedIds(new Set())
        } else {
            toast.error(result.error || "Erro ao excluir categorias.")
        }
    }

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedIds(newSelected)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Categorias</h1>
                    <p className="text-muted-foreground">
                        Gerencie as faixas e idades das competições.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {selectedIds.size > 0 && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    className="gap-2 w-full sm:w-auto animate-in fade-in slide-in-from-top-1"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Excluir selecionadas ({selectedIds.size})
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir {selectedIds.size} categorias?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta ação excluirá permanentemente as categorias selecionadas.
                                        Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        Sim, excluir selecionadas
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    <Button
                        variant="outline"
                        onClick={() => setIsBulkFeeDialogOpen(true)}
                        className="gap-2 w-full sm:w-auto border-primary/20 hover:border-primary/50 hover:bg-primary/5"
                    >
                        <DollarSign className="h-4 w-4 text-primary" />
                        Alterar preço de todas
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setAiDialogKey(prev => prev + 1)
                            router.refresh()
                            setIsAIDialogOpen(true)
                        }}
                        className="gap-2 w-full sm:w-auto border-primary/20 hover:border-primary/50 hover:bg-primary/5"
                    >
                        <Sparkles className="h-4 w-4 text-primary" />
                        Gerar com IA
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setIsCheckerDialogOpen(true)}
                        className="gap-2 w-full sm:w-auto border-primary/20 hover:border-primary/50 hover:bg-primary/5"
                    >
                        <AlertCircle className="h-4 w-4 text-primary" />
                        Conferir com IA
                    </Button>
                    <Button onClick={handleAdd} className="gap-2 w-full sm:w-auto">
                        <Plus className="h-4 w-4" />
                        Nova Categoria
                    </Button>
                    {initialCategories.length > 0 && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:bg-destructive/10" title="Excluir todas">
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta ação excluirá permanentemente TODAS as suas {initialCategories.length} categorias.
                                        Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                        Sim, excluir tudo
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-card p-4 rounded-lg border border-primary/10 shadow-sm">
                <div className="relative flex-1 w-full flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por faixa, categoria ou valor..."
                            className="pl-10 h-10 border-primary/10 focus-visible:ring-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button
                        variant={showOnlyActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowOnlyActive(!showOnlyActive)}
                        className={`h-10 gap-2 transition-all ${showOnlyActive ? 'bg-primary text-primary-foreground shadow-md' : 'border-primary/10 hover:border-primary/30'}`}
                        title={showOnlyActive ? "Mostrando apenas ativas" : "Mostrar apenas categorias com inscritos"}
                    >
                        {showOnlyActive ? <Activity className="h-4 w-4 animate-pulse" /> : <Filter className="h-4 w-4" />}
                        <span className="hidden md:inline">Ativas</span>
                    </Button>
                </div>
                <div className="flex items-center gap-4 text-sm font-medium shrink-0 bg-muted/50 px-4 py-2 rounded-md">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase opacity-50 font-black">Total</span>
                        <span className="text-primary">{initialCategories.length}</span>
                    </div>
                    <div className="w-px h-8 bg-primary/10" />
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase opacity-50 font-black">Filtrados</span>
                        <span className={searchTerm ? "text-amber-500" : "text-muted-foreground"}>
                            {filteredCategories.length}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCategories.length === 0 ? (
                    <Card className="col-span-full border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                            <Tags className="h-12 w-12 text-muted-foreground/20" />
                            <div className="space-y-1">
                                <h3 className="font-bold text-xl">
                                    {searchTerm ? "Nenhum resultado para sua busca" : "Nenhuma categoria encontrada"}
                                </h3>
                                <p className="text-muted-foreground max-w-sm">
                                    {searchTerm
                                        ? "Tente ajustar os termos ou limpe o filtro para ver todas as categorias."
                                        : "Cadastre as categorias para que os organizadores possam utilizá-las nos eventos."}
                                </p>
                            </div>
                            {searchTerm && (
                                <Button onClick={() => setSearchTerm("")} variant="ghost" className="text-primary">
                                    Limpar Filtro
                                </Button>
                            )}
                            {!searchTerm && (
                                <Button onClick={handleAdd} variant="outline" className="w-full sm:w-auto">
                                    Cadastrar Categoria
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    filteredCategories.map((cat) => {
                        const isSelected = selectedIds.has(cat.id)
                        return (
                            <Card
                                key={cat.id}
                                className={`relative overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isSelected ? 'ring-2 ring-primary border-primary bg-primary/5' : 'border-primary/5 bg-card'
                                    }`}
                            >
                                <div className="p-4 space-y-4">
                                    {/* Header Section */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-6 bg-primary rounded-full" />
                                            <h3 className="text-sm font-black uppercase tracking-tight text-foreground/80">
                                                {cat.belt}
                                            </h3>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary rounded-full"
                                                onClick={() => handleEdit(cat)}
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive rounded-full"
                                                onClick={() => handleDelete(cat.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Body Section: Category & Pricing */}
                                    <div className="space-y-3">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">Categoria</span>
                                            <span className="font-bold text-sm text-foreground truncate">
                                                {cat.age_group}
                                            </span>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-2 gap-4 pb-1">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-muted-foreground font-black uppercase tracking-widest text-[9px] opacity-70">Peso</span>
                                                <span className="text-foreground font-bold">
                                                    {(!cat.min_weight || cat.min_weight === -1) && (!cat.max_weight || cat.max_weight === -1)
                                                        ? '---'
                                                        : cat.min_weight === 0 && cat.max_weight === 0
                                                            ? 'Livre'
                                                            : `${cat.min_weight ?? 0}-${cat.max_weight ?? 0}kg`}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-muted-foreground font-black uppercase tracking-widest text-[9px] opacity-70">Idade</span>
                                                <span className="text-foreground font-bold">
                                                    {(!cat.min_age || cat.min_age === -1) && (!cat.max_age || cat.max_age === -1)
                                                        ? '---'
                                                        : cat.min_age === 0 && cat.max_age === 0
                                                            ? 'Livre'
                                                            : `${cat.min_age ?? 0}-${cat.max_age ?? 0} anos`}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Activity Bar Section */}
                                        <div className="pt-3 border-t border-primary/5">
                                            <div className="flex items-end justify-between mb-2">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-muted-foreground font-black uppercase tracking-widest text-[9px] opacity-70">Inscritos</span>
                                                    <div className="flex items-baseline gap-1.5">
                                                        <span className={`text-xl font-black ${cat.registrations?.length ? 'text-primary' : 'text-muted-foreground/40'}`}>
                                                            {cat.registrations?.length || 0}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground font-medium underline underline-offset-2 decoration-primary/20">atletas</span>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end">
                                                    <span className="text-muted-foreground font-black uppercase tracking-widest text-[9px] opacity-70 mb-0.5">Financeiro</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-[10px] font-black text-green-600 leading-none">
                                                                {cat.registrations?.filter(r => r.status === 'paid').length || 0} P
                                                            </span>
                                                            <span className="text-[10px] font-black text-amber-600 leading-none">
                                                                {cat.registrations?.filter(r => r.status === 'pending_payment').length || 0} A
                                                            </span>
                                                        </div>
                                                        <div className="h-6 w-[2px] bg-primary/10 rounded-full" />
                                                        <span className="text-primary font-black text-sm">
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cat.registration_fee)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Selection Check for Bulk Actions */}
                                {cat.registrations?.length ? (
                                    <div className="absolute bottom-0 right-0 p-1">
                                        <div className="bg-primary/10 text-primary text-[8px] font-black uppercase px-1.5 py-0.5 rounded-tl-lg">Ativa</div>
                                    </div>
                                ) : null}

                                {/* Selection Checkbox */}
                                <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => {
                                            e.stopPropagation()
                                            toggleSelection(cat.id)
                                        }}
                                        className="w-4 h-4 rounded border-primary/20 text-primary cursor-pointer"
                                    />
                                </div>
                            </Card>
                        )
                    })
                )}
            </div>

            <CategoryDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                category={selectedCategory}
                belts={belts}
                ageGroups={ageGroups}
                categories={initialCategories}
                onSuccess={() => {
                    router.refresh()
                }}
            />
            <AICategoryDialog
                key={aiDialogKey}
                open={isAIDialogOpen}
                onOpenChange={setIsAIDialogOpen}
                belts={belts}
                ageGroups={ageGroups}
                existingCategories={initialCategories}
                onSuccess={() => {
                    router.refresh()
                }}
            />
            <AICategoryCheckerDialog
                open={isCheckerDialogOpen}
                onOpenChange={setIsCheckerDialogOpen}
                onSuccess={() => {
                    router.refresh()
                }}
            />

            <Dialog open={isBulkFeeDialogOpen} onOpenChange={setIsBulkFeeDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Alterar preço de todas as categorias</DialogTitle>
                        <DialogDescription>
                            Isso atualizará o preço de todas as {initialCategories.length} categorias cadastradas.
                            Esta ação é irreversível.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="newFee">Novo Preço (R$)</Label>
                            <Input
                                id="newFee"
                                type="number"
                                min="0"
                                step="0.01"
                                value={newBulkFee}
                                onChange={(e) => setNewBulkFee(e.target.value)}
                                placeholder="0,00"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsBulkFeeDialogOpen(false)} disabled={isUpdatingFee}>
                            Cancelar
                        </Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button disabled={isUpdatingFee || parseFloat(newBulkFee) < 0 || newBulkFee === ""}>
                                    {isUpdatingFee ? "Atualizando..." : "Atualizar Tudo"}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        O preço de TODAS as {initialCategories.length} categorias será alterado para
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(newBulkFee) || 0)}.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleBulkFeeUpdate} className="bg-primary hover:bg-primary/90">
                                        Sim, atualizar todos os preços
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
