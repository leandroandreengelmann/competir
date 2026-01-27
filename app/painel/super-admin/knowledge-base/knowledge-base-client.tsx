"use client"

import * as React from "react"
import { useFormStatus } from "react-dom"
import {
    createKnowledgeEntryAction,
    updateKnowledgeEntryAction,
    deleteKnowledgeEntryAction,
    KnowledgeEntry,
    ActionState
} from "@/app/actions/knowledge-base"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Pencil, Trash2, Plus, X, Save } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog"

interface KnowledgeBaseClientProps {
    initialEntries: KnowledgeEntry[]
}

function SubmitButton({ label }: { label: string }) {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending} className="gap-2">
            {pending ? "Salvando..." : (
                <>
                    <Save className="h-4 w-4" />
                    {label}
                </>
            )}
        </Button>
    )
}

export function KnowledgeBaseClient({ initialEntries }: KnowledgeBaseClientProps) {
    const [entries, setEntries] = React.useState<KnowledgeEntry[]>(initialEntries)
    const [editingEntry, setEditingEntry] = React.useState<KnowledgeEntry | null>(null)
    const formRef = React.useRef<HTMLFormElement>(null)

    // Reset lista local ao receber novos dados do server (revalidatePath)
    React.useEffect(() => {
        setEntries(initialEntries)
    }, [initialEntries])

    async function handleAdd(formData: FormData) {
        const result = await createKnowledgeEntryAction({}, formData)
        if (result.success) {
            toast.success(result.message)
            formRef.current?.reset()
        } else {
            toast.error(result.error)
        }
    }

    async function handleUpdate(formData: FormData) {
        if (!editingEntry) return
        const result = await updateKnowledgeEntryAction(editingEntry.id, {}, formData)
        if (result.success) {
            toast.success(result.message)
            setEditingEntry(null)
        } else {
            toast.error(result.error)
        }
    }

    async function handleDelete(id: string) {
        const result = await deleteKnowledgeEntryAction(id)
        if (result.success) {
            toast.success(result.message)
        } else {
            toast.error(result.error)
        }
    }

    return (
        <div className="grid gap-8 lg:grid-cols-2">
            {/* Formulário de Criação/Edição */}
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {editingEntry ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                            {editingEntry ? "Editar Entrada" : "Nova Entrada"}
                        </CardTitle>
                        <CardDescription>
                            Adicione informações detalhadas, regras ou conteúdos de ajuda.
                        </CardDescription>
                    </CardHeader>
                    <form
                        ref={formRef}
                        action={editingEntry ? handleUpdate : handleAdd}
                    >
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="label">Título / Label (Opcional)</Label>
                                <Input
                                    id="label"
                                    name="label"
                                    placeholder="Ex: Regras de Desistência"
                                    defaultValue={editingEntry?.label || ""}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="content">Conteúdo (Informação do Campeonato)</Label>
                                <Textarea
                                    id="content"
                                    name="content"
                                    placeholder="Cole aqui o conteúdo..."
                                    className="min-h-[300px]"
                                    defaultValue={editingEntry?.content || ""}
                                    required
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            {editingEntry ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditingEntry(null)}
                                    className="gap-2"
                                >
                                    <X className="h-4 w-4" />
                                    Cancelar
                                </Button>
                            ) : <div></div>}
                            <SubmitButton label={editingEntry ? "Atualizar" : "Salvar"} />
                        </CardFooter>
                    </form>
                </Card>
            </div>

            {/* Listagem de Entradas */}
            <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    Entradas Salvas
                    <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {entries.length}
                    </span>
                </h3>

                {entries.length === 0 ? (
                    <Card className="border-dashed flex flex-col items-center justify-center p-12 text-center">
                        <p className="text-muted-foreground">Nenhuma entrada cadastrada ainda.</p>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {entries.map((entry) => (
                            <Card key={entry.id} className="relative group overflow-hidden">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-1">
                                            <CardTitle className="text-base truncate">
                                                {entry.label || `Entrada #${entry.id}`}
                                            </CardTitle>
                                            <CardDescription className="text-xs">
                                                Criado em: {new Date(entry.created_at).toLocaleString('pt-BR')}
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                onClick={() => {
                                                    setEditingEntry(entry)
                                                    window.scrollTo({ top: 0, behavior: 'smooth' })
                                                }}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Excluir Entrada?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Esta ação não pode ser desfeita. A informação será removida permanentemente da base.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDelete(entry.id)}
                                                            className="bg-destructive hover:bg-destructive/90"
                                                        >
                                                            Confirmar Exclusão
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                                        {entry.content}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
