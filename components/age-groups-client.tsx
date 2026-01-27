"use client"

import * as React from "react"
import { useState } from "react"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, Users, Loader2 } from "lucide-react"
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
import { createAgeGroupAction, updateAgeGroupAction, deleteAgeGroupAction } from "@/app/actions/age-groups"
import { toast } from "sonner"

interface AgeGroup {
    id: string
    name: string
    created_at: string
}

interface AgeGroupsClientProps {
    initialAgeGroups: AgeGroup[]
}

export function AgeGroupsClient({ initialAgeGroups }: AgeGroupsClientProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedGroup, setSelectedGroup] = useState<AgeGroup | null>(null)

    const isEditing = !!selectedGroup

    async function handleFormAction(prevState: any, formData: FormData) {
        let result
        if (isEditing && selectedGroup) {
            result = await updateAgeGroupAction(selectedGroup.id, prevState, formData)
        } else {
            result = await createAgeGroupAction(prevState, formData)
        }

        if (result.success) {
            toast.success(result.message)
            setIsDialogOpen(false)
            setSelectedGroup(null)
        }
        return result
    }

    const [state, action, isPending] = useActionState(handleFormAction, { success: false })

    const handleAdd = () => {
        setSelectedGroup(null)
        setIsDialogOpen(true)
    }

    const handleEdit = (group: AgeGroup) => {
        setSelectedGroup(group)
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta faixa etária? Isso pode afetar categorias existentes.")) return

        const result = await deleteAgeGroupAction(id)
        if (result.success) {
            toast.success(result.message)
        } else {
            toast.error(result.error || "Erro ao excluir faixa etária.")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Faixas Etárias</h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie as faixas etárias disponíveis para as categorias.
                    </p>
                </div>
                <Button onClick={handleAdd} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Faixa Etária
                </Button>
            </div>

            <Card className="border-border/50 shadow-sm">
                <CardHeader>
                    <CardTitle>Lista de Faixas Etárias</CardTitle>
                    <CardDescription>
                        Faixas etárias cadastradas (Ex: Adulto, Juvenil, Master 1).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80%]">Descrição da Idade</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {initialAgeGroups.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="h-48 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <Users className="h-10 w-10 mb-2 opacity-20" />
                                            <p>Nenhuma faixa etária cadastrada.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                initialAgeGroups.map((group) => (
                                    <TableRow key={group.id} className="group">
                                        <TableCell className="font-semibold text-lg">{group.name}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(group)}
                                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(group.id)}
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "Editar Faixa Etária" : "Nova Faixa Etária"}</DialogTitle>
                        <DialogDescription>
                            Informe o nome da faixa etária (Ex: Adulto, Juvenil, Master 2).
                        </DialogDescription>
                    </DialogHeader>
                    <form action={action} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Descrição da Idade</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="Ex: Adulto, Juvenil, Master 1, Master 2..."
                                defaultValue={selectedGroup?.name}
                                required
                                autoFocus
                            />
                        </div>

                        {state?.error && (
                            <p className="text-sm font-medium text-destructive">{state.error}</p>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending} className="gap-2">
                                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                {isEditing ? "Salvar Alterações" : "Criar Faixa Etária"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
