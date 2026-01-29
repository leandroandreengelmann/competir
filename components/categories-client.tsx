"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Pencil, Trash2, Tags } from "lucide-react"
import { CategoryDialog } from "@/components/category-dialog"
import { deleteCategoryAction } from "@/app/actions/categories"
import { toast } from "sonner"

interface Category {
    id: string
    belt: string
    belt_id?: string
    min_weight: number
    max_weight: number
    age_group: string
    age_group_id?: string
    registration_fee: number
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
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

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

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Categorias</h1>
                    <p className="text-muted-foreground">
                        Gerencie as faixas, pesos e idades das competições.
                    </p>
                </div>
                <Button onClick={handleAdd} className="gap-2 w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                    Nova Categoria
                </Button>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {initialCategories.length === 0 ? (
                    <Card className="col-span-full">
                        <CardContent className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                            <Tags className="h-12 w-12 text-muted-foreground/30" />
                            <div className="space-y-1">
                                <h3 className="font-semibold text-lg">Nenhuma categoria encontrada</h3>
                                <p className="text-muted-foreground max-w-sm">
                                    Cadastre as categorias para que os organizadores possam utilizá-las nos eventos.
                                </p>
                            </div>
                            <Button onClick={handleAdd} variant="outline" className="w-full sm:w-auto">
                                Cadastrar Categoria
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    initialCategories.map((cat) => (
                        <Card key={cat.id} className="group hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-bold">
                                    {cat.belt}
                                </CardTitle>
                                <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9"
                                        onClick={() => handleEdit(cat)}
                                    >
                                        <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9"
                                        onClick={() => handleDelete(cat.id)}
                                    >
                                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-1 text-sm">
                                    {cat.min_weight > 0 && (
                                        <p className="text-muted-foreground">
                                            Peso: <span className="text-foreground font-medium">
                                                {cat.min_weight}kg - {cat.max_weight}kg
                                            </span>
                                        </p>
                                    )}
                                    <p className="text-muted-foreground">
                                        Categoria: <span className="text-foreground font-medium">{cat.age_group}</span>
                                    </p>
                                    <p className="text-muted-foreground mt-2 pt-2 border-t">
                                        Inscrição: <span className="text-primary font-bold">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cat.registration_fee)}
                                        </span>
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <CategoryDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                category={selectedCategory}
                belts={belts}
                ageGroups={ageGroups}
                onSuccess={() => {
                    // revalidatePath na Action cuidará da atualização
                }}
            />
        </div>
    )
}
