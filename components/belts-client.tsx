"use client"

import * as React from "react"
import { useState } from "react"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, Tags, Loader2 } from "lucide-react"
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
import { createBeltAction, updateBeltAction, deleteBeltAction } from "@/app/actions/belts"
import { toast } from "sonner"

interface Belt {
    id: string
    name: string
    created_at: string
}

interface BeltsClientProps {
    initialBelts: Belt[]
}

export function BeltsClient({ initialBelts }: BeltsClientProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedBelt, setSelectedBelt] = useState<Belt | null>(null)

    const isEditing = !!selectedBelt

    async function handleFormAction(prevState: any, formData: FormData) {
        let result
        if (isEditing && selectedBelt) {
            result = await updateBeltAction(selectedBelt.id, prevState, formData)
        } else {
            result = await createBeltAction(prevState, formData)
        }

        if (result.success) {
            toast.success(result.message)
            setIsDialogOpen(false)
            setSelectedBelt(null)
        }
        return result
    }

    const [state, action, isPending] = useActionState(handleFormAction, { success: false })

    const handleAdd = () => {
        setSelectedBelt(null)
        setIsDialogOpen(true)
    }

    const handleEdit = (belt: Belt) => {
        setSelectedBelt(belt)
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta faixa? Isso pode afetar categorias existentes.")) return

        const result = await deleteBeltAction(id)
        if (result.success) {
            toast.success(result.message)
        } else {
            toast.error(result.error || "Erro ao excluir faixa.")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Faixas</h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie as graduações disponíveis para as categorias.
                    </p>
                </div>
                <Button onClick={handleAdd} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Faixa
                </Button>
            </div>

            <Card className="border-border/50 shadow-sm">
                <CardHeader>
                    <CardTitle>Lista de Faixas</CardTitle>
                    <CardDescription>
                        Faixas cadastradas que aparecem no seletor do organizador.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80%]">Nome da Faixa</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {initialBelts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="h-48 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <Tags className="h-10 w-10 mb-2 opacity-20" />
                                            <p>Nenhuma faixa cadastrada.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                initialBelts.map((belt) => (
                                    <TableRow key={belt.id} className="group">
                                        <TableCell className="font-semibold text-lg">{belt.name}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(belt)}
                                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(belt.id)}
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
                        <DialogTitle>{isEditing ? "Editar Faixa" : "Nova Faixa"}</DialogTitle>
                        <DialogDescription>
                            Informe a descrição da faixa que será exibida no sistema.
                        </DialogDescription>
                    </DialogHeader>
                    <form action={action} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Descrição da Faixa</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="Ex: Branca, Marrom e Roxa, Absoluto..."
                                defaultValue={selectedBelt?.name}
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
                                {isEditing ? "Salvar Alterações" : "Criar Faixa"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
