"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { deleteEventAction } from "@/app/actions/events"
import { toast } from "sonner"

interface DeleteEventButtonProps {
    eventId: string
    eventName: string
}

export function DeleteEventButton({ eventId, eventName }: DeleteEventButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [open, setOpen] = useState(false)

    async function handleDelete() {
        setIsLoading(true)
        try {
            const result = await deleteEventAction(eventId)

            if (result.success) {
                toast.success(result.message || "Evento excluído com sucesso")
                setOpen(false)
            } else {
                toast.error(result.error || "Erro ao excluir evento")
            }
        } catch (error) {
            toast.error("Ocorreu um erro inesperado")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-secondary-foreground/60 hover:text-destructive transition-colors">
                    <Trash2 className="h-5 w-5" />
                    <span className="sr-only">Excluir evento</span>
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Evento</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tem certeza que deseja excluir o evento <strong>{eventName}</strong>?
                        Esta ação não pode ser desfeita e todos os dados relacionados ao evento serão perdidos.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            handleDelete()
                        }}
                        disabled={isLoading}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isLoading ? "Excluindo..." : "Excluir Evento"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
