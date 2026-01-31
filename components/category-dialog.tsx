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
import { getAgeGroupContext, getBeltType, isCompatible } from "@/lib/category-rules"

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
    categories: Category[]
    onSuccess: () => void
}

export function CategoryDialog({ open, onOpenChange, category, belts, ageGroups, categories, onSuccess }: CategoryDialogProps) {
    const isEditing = !!category?.id
    const [selectedBeltId, setSelectedBeltId] = React.useState<string | undefined>(category?.belt_id)
    const [selectedAgeGroupId, setSelectedAgeGroupId] = React.useState<string | undefined>(category?.age_group_id)
    const [minWeight, setMinWeight] = React.useState<string>(category?.min_weight && category.min_weight > 0 ? category.min_weight.toString() : '')
    const [maxWeight, setMaxWeight] = React.useState<string>(category?.max_weight && category.max_weight > 0 ? category.max_weight.toString() : '')
    const [registrationFee, setRegistrationFee] = React.useState<string>(category?.registration_fee ? category.registration_fee.toString() : '0')

    // Resetar estados quando o dialog abre
    React.useEffect(() => {
        if (open) {
            setSelectedBeltId(category?.belt_id)
            setSelectedAgeGroupId(category?.age_group_id)
            setMinWeight(category?.min_weight && category.min_weight > 0 ? category.min_weight.toString() : '')
            setMaxWeight(category?.max_weight && category.max_weight > 0 ? category.max_weight.toString() : '')
            setRegistrationFee(category?.registration_fee ? category.registration_fee.toString() : '0')
        }
    }, [open, category])

    const selectedBelt = belts.find(b => b.id === selectedBeltId)
    const selectedAgeGroup = ageGroups.find(g => g.id === selectedAgeGroupId)

    // Filtragem de Age Groups
    const filteredAgeGroups = ageGroups.filter(group => {
        if (!selectedBelt) return true

        // Se estiver editando e for o id original, permitir para não quebrar
        if (isEditing && group.id === category?.age_group_id) return true

        const { compatible } = isCompatible(selectedBelt.name, group.name)
        return compatible
    })

    // Validação de Duplicidade (apenas para peso livre conforme solicitado)
    const isWeightFree = !minWeight && !maxWeight
    const isDuplicate = !isEditing && isWeightFree && selectedBeltId && selectedAgeGroupId && categories.some(c =>
        c.belt_id === selectedBeltId &&
        c.age_group_id === selectedAgeGroupId &&
        c.min_weight === -1 &&
        c.max_weight === -1
    )

    // Validação extra por compatibilidade (Contract rules)
    let compatibilityError = ""
    if (selectedBelt && selectedAgeGroup) {
        const { compatible, error } = isCompatible(selectedBelt.name, selectedAgeGroup.name)
        if (!compatible) {
            compatibilityError = error || "Essa combinação de faixa e categoria não é permitida."
        }
    }

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
                        <Select
                            name="belt_id"
                            defaultValue={category?.belt_id}
                            onValueChange={setSelectedBeltId}
                            required
                        >
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

                    <div className="grid grid-cols-2 gap-4 hidden">
                        <div className="space-y-2">
                            <Label htmlFor="min_weight">Peso Inicial (kg) - Opcional</Label>
                            <Input
                                id="min_weight"
                                name="min_weight"
                                type="number"
                                step="0.1"
                                value={minWeight}
                                onChange={(e) => setMinWeight(e.target.value)}
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
                                value={maxWeight}
                                onChange={(e) => setMaxWeight(e.target.value)}
                                placeholder="Deixe vazio para livre"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="age_group_id">Categoria</Label>
                        <Select
                            name="age_group_id"
                            defaultValue={category?.age_group_id}
                            onValueChange={setSelectedAgeGroupId}
                            required
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredAgeGroups.map((group) => (
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
                            value={registrationFee}
                            onChange={(e) => setRegistrationFee(e.target.value)}
                            placeholder="0,00"
                            required
                        />
                        {(parseFloat(registrationFee) <= 0 || !registrationFee) && (
                            <p className="text-[10px] font-medium text-destructive uppercase tracking-widest">
                                O valor da inscrição é obrigatório e deve ser maior que zero
                            </p>
                        )}
                    </div>

                    {compatibilityError && (
                        <p className="text-sm font-medium text-destructive">{compatibilityError}</p>
                    )}

                    {isDuplicate && (
                        <p className="text-sm font-medium text-amber-600">Essa categoria já está cadastrada.</p>
                    )}

                    {state?.error && (
                        <p className="text-sm font-medium text-destructive">{state.error}</p>
                    )}

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={isPending || isDuplicate || !!compatibilityError || parseFloat(registrationFee) <= 0 || !registrationFee}
                        >
                            {isPending ? "Salvando..." : "Salvar Categoria"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
