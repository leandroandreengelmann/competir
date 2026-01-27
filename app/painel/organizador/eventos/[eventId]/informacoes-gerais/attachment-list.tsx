"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { FileText, Image as ImageIcon, ExternalLink, Trash2, Plus, Loader2 } from "lucide-react"
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
import { cn } from "@/lib/utils"

type Attachment = {
    id: string
    file_name: string
    file_type: string
    file_size: number
    file_url: string
}

interface AttachmentListProps {
    kbTerm: string
    attachments: Attachment[]
    onDelete: (attachmentId: string) => Promise<void>
    onUpload: (kbTerm: string, files: FileList) => Promise<void>
    isUploading?: boolean
    isDeleting?: string | null // ID do anexo sendo deletado
    className?: string
}

export function AttachmentList({
    kbTerm,
    attachments,
    onDelete,
    onUpload,
    isUploading = false,
    isDeleting = null,
    className
}: AttachmentListProps) {
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    const isImage = (type: string) => type.startsWith('image/')

    const handleUploadClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await onUpload(kbTerm, e.target.files)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const images = attachments.filter(a => isImage(a.file_type))
    const files = attachments.filter(a => !isImage(a.file_type))

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Anexos ({attachments.length})
                </p>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                    accept="image/*,application/pdf"
                />
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleUploadClick}
                    disabled={isUploading}
                    className="h-7 px-2 text-primary hover:text-primary hover:bg-primary/10 gap-1"
                >
                    {isUploading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <Plus className="h-3.5 w-3.5" />
                    )}
                    <span className="text-[10px] font-bold uppercase">Adicionar</span>
                </Button>
            </div>

            {attachments.length === 0 && !isUploading && (
                <p className="text-xs text-muted-foreground italic">Nenhum anexo.</p>
            )}

            {/* Grid de Imagens */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {images.map((img) => (
                        <div key={img.id} className="group relative aspect-video rounded-md overflow-hidden border bg-muted shadow-sm hover:shadow-md transition-all duration-300">
                            <img
                                src={img.file_url}
                                alt={img.file_name}
                                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const parent = target.parentElement;
                                    if (parent) {
                                        parent.classList.add('flex', 'items-center', 'justify-center');
                                        const icon = document.createElement('div');
                                        icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image text-muted-foreground opacity-20"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                                        parent.appendChild(icon.firstChild!);
                                    }
                                }}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                                <a
                                    href={img.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
                                    title="Abrir original"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </a>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <button
                                            disabled={isDeleting === img.id}
                                            className="p-1.5 rounded-full bg-destructive/20 hover:bg-destructive/40 text-white transition-colors"
                                            title="Deletar anexo"
                                        >
                                            {isDeleting === img.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Excluir anexo?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta ação removerá permanentemente a imagem "{img.file_name}" deste item.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => onDelete(img.id)}
                                                className="bg-destructive hover:bg-destructive/90"
                                            >
                                                Excluir
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lista de Outros Arquivos */}
            {files.length > 0 && (
                <div className="space-y-1.5">
                    {files.map((file) => (
                        <div
                            key={file.id}
                            className="group flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 transition-all duration-200"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded bg-destructive/10 flex items-center justify-center shrink-0">
                                    <FileText className="h-4 w-4 text-destructive" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-medium truncate max-w-[150px] sm:max-w-[250px]">
                                        {file.file_name}
                                    </p>
                                    <span className="text-[10px] text-muted-foreground uppercase font-bold">
                                        {formatFileSize(file.file_size)} • PDF
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <a
                                    href={file.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </a>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <button
                                            disabled={isDeleting === file.id}
                                            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                            {isDeleting === file.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Excluir anexo?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta ação removerá permanentemente o arquivo "{file.file_name}" deste item.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => onDelete(file.id)}
                                                className="bg-destructive hover:bg-destructive/90"
                                            >
                                                Excluir
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isUploading && (
                <div className="flex items-center gap-2 text-[10px] font-bold text-primary animate-pulse">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    SUBINDO NOVOS ARQUIVOS...
                </div>
            )}
        </div>
    )
}
