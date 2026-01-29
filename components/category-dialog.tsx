"use client"

import * as React from "react"
import { useActionState } from "react"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createCategoryAction, updateCategoryAction } from "@/app/actions/categories"

interface Category {
    id?: string
    belt_id?: string
    age_group_id?: string
    belt: string // legada
    min_weight: number
    max_weight: number
    age_group: string // legada
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

interface CategoryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    category?: Category | null
    belts: Belt[]
    ageGroups: AgeGroup[]
    onSuccess: () => void
}

export function CategoryDialog({ open, onOpenChange, category, belts, ageGroups, onSuccess }: CategoryDialogProps) {
    const isEditing = !!category?.id

    // Action personalizada para lidar com update
    async function formAction(prevState: any, formData: FormData) {
        let result
        if (isEditing && category?.id) {
            result = await updateCategoryAction(category.id, prevState, formData)
        } else {
            result = await createCategoryAction(prevState, formData)
        }

        if (result.success) {
            onSuccess()
            onOpenChange(false)
        }
        return result
    }

    const [state, action, isPending] = useActionState(formAction, { success: false })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Categoria" : "Cadastrar Categoria"}</DialogTitle>
                    <DialogDescription>
                        Defina os parâmetros da categoria de competição.
                    </DialogDescription>
                </DialogHeader>
                <form action={action} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="belt_id">Faixa</Label>
                        <Select name="belt_id" defaultValue={category?.belt_id} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a faixa" />
                            </SelectTrigger>
                            <SelectContent>
                                {belts.map((belt) => (
                                    <SelectItem key={belt.id} value={belt.id}>
                                        {belt.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="min_weight">Peso Inicial (kg) - Opcional</Label>
                            <Input
                                id="min_weight"
                                name="min_weight"
                                type="number"
                                step="0.1"
                                defaultValue={category?.min_weight && category.min_weight > 0 ? category.min_weight : ''}
                                placeholder="Deixe vazio para livre"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="max_weight">Peso Final (kg) - Opcional</Label>
                            <Input
                                id="max_weight"
                                name="max_weight"
                                type="number"
                                step="0.1"
                                defaultValue={category?.max_weight && category.max_weight > 0 ? category.max_weight : ''}
                                placeholder="Deixe vazio para livre"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="age_group_id">Faixa Etária</Label>
                        <Select name="age_group_id" defaultValue={category?.age_group_id} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a idade" />
                            </SelectTrigger>
                            <SelectContent>
                                {ageGroups.map((group) => (
                                    <SelectItem key={group.id} value={group.id}>
                                        {group.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="registration_fee">Valor da Inscrição (R$)</Label>
                        <Input
                            id="registration_fee"
                            name="registration_fee"
                            type="number"
                            step="0.01"
                            defaultValue={category?.registration_fee || 0}
                            placeholder="0,00"
                            required
                        />
                    </div>

                    {state?.error && (
                        <p className="text-sm font-medium text-destructive">{state.error}</p>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Salvando..." : "Salvar Categoria"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
