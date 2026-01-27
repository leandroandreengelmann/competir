"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Paperclip, X, FileText, Image as ImageIcon, Upload, Loader2, Eye } from "lucide-react"
import { toast } from "sonner"
import { uploadAttachmentAction, deleteAttachmentAction } from "@/app/actions/event-assistant-attachments"
import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

type Attachment = {
    id: string
    file_name: string
    file_type: string
    file_size: number
    file_url: string
}

interface FileUploaderProps {
    eventId: string
    kbTerm: string
    initialAttachments?: Attachment[]
    onAttachmentsChange?: (attachments: Attachment[]) => void
    disabled?: boolean
}

export function FileUploader({
    eventId,
    kbTerm,
    initialAttachments = [],
    onAttachmentsChange,
    disabled = false
}: FileUploaderProps) {
    const [attachments, setAttachments] = React.useState<Attachment[]>(initialAttachments)
    const [isUploading, setIsUploading] = React.useState(false)
    const [isDragging, setIsDragging] = React.useState(false)
    const [previewImage, setPreviewImage] = React.useState<Attachment | null>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
        onAttachmentsChange?.(attachments)
    }, [attachments, onAttachmentsChange])

    const handleFileSelect = async (files: FileList | null) => {
        if (!files || files.length === 0) return

        setIsUploading(true)

        for (let i = 0; i < files.length; i++) {
            const file = files[i]

            // Validação no frontend
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
            if (!allowedTypes.includes(file.type)) {
                toast.error(`Arquivo "${file.name}" não permitido. Use JPG, PNG, WEBP ou PDF.`)
                continue
            }

            if (file.size > 10 * 1024 * 1024) {
                toast.error(`Arquivo "${file.name}" muito grande. Máximo: 10MB.`)
                continue
            }

            try {
                const result = await uploadAttachmentAction(eventId, kbTerm, file)

                if (result.success && result.attachmentId && result.fileUrl) {
                    const newAttachment: Attachment = {
                        id: result.attachmentId,
                        file_name: file.name,
                        file_type: file.type,
                        file_size: file.size,
                        file_url: result.fileUrl
                    }
                    setAttachments(prev => [...prev, newAttachment])
                    toast.success(`✅ "${file.name}" anexado com sucesso!`)
                } else {
                    toast.error(result.error || "Erro ao fazer upload")
                }
            } catch (error) {
                toast.error(`Erro ao enviar "${file.name}"`)
            }
        }

        setIsUploading(false)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleDelete = async (attachmentId: string, fileName: string) => {
        const result = await deleteAttachmentAction(attachmentId)

        if (result.success) {
            setAttachments(prev => prev.filter(a => a.id !== attachmentId))
            toast.success(`🗑️ "${fileName}" removido`)
        } else {
            toast.error(result.error || "Erro ao remover arquivo")
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (!disabled) setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        if (disabled) return

        const files = e.dataTransfer.files
        handleFileSelect(files)
    }

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    const isImage = (type: string) => type.startsWith('image/')

    return (
        <div className="space-y-3">
            {/* Upload Area */}
            <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Anexar arquivos (opcional)</span>
            </div>

            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200",
                    isDragging
                        ? "border-primary bg-primary/5 scale-[1.02]"
                        : "border-border hover:border-primary/50 hover:bg-accent/30",
                    disabled && "opacity-50 cursor-not-allowed",
                    isUploading && "opacity-60"
                )}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                    disabled={disabled || isUploading}
                />

                {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        <p className="text-sm text-muted-foreground">Enviando arquivos...</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <div className="p-3 rounded-full bg-primary/10">
                            <Upload className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <Button
                                type="button"
                                variant="link"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={disabled}
                                className="text-sm font-medium px-0"
                            >
                                Clique para enviar
                            </Button>
                            <span className="text-sm text-muted-foreground"> ou arraste arquivos aqui</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Imagens (JPG, PNG, WEBP) ou PDFs • Máx. 10MB por arquivo
                        </p>
                    </div>
                )}
            </div>

            {/* Lista de Anexos */}
            {attachments.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Anexados ({attachments.length})
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {(attachments.reduce((sum, a) => sum + a.file_size, 0) / (1024 * 1024)).toFixed(1)}MB total
                        </p>
                    </div>
                    <div className="max-h-[200px] overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {attachments.map((attachment) => (
                                <div
                                    key={attachment.id}
                                    className="flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-accent/30 transition-colors group"
                                >
                                    <div className="shrink-0">
                                        {isImage(attachment.file_type) ? (
                                            <div className="w-8 h-8 rounded bg-success/10 flex items-center justify-center">
                                                <ImageIcon className="h-4 w-4 text-success" />
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded bg-destructive/10 flex items-center justify-center">
                                                <FileText className="h-4 w-4 text-destructive" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium truncate">{attachment.file_name}</p>
                                        <div className="flex items-center gap-1">
                                            <span className="text-[10px] text-muted-foreground">
                                                {formatFileSize(attachment.file_size)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {isImage(attachment.file_type) && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setPreviewImage(attachment)}
                                                disabled={disabled}
                                                className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(attachment.id, attachment.file_name)}
                                            disabled={disabled}
                                            className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Preview de Imagem */}
            <Dialog open={previewImage !== null} onOpenChange={(open) => !open && setPreviewImage(null)}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{previewImage?.file_name}</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center justify-center p-4 bg-muted/30 rounded-lg">
                        {previewImage && (
                            <img
                                src={previewImage.file_url}
                                alt={previewImage.file_name}
                                className="max-w-full max-h-[70vh] object-contain rounded"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
