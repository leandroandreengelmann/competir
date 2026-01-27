"use client"

import * as React from "react"
import { Upload, X } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface EventImageUploadProps {
    currentImageUrl?: string
    onImageChange: (file: File | null) => void
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export function EventImageUpload({ currentImageUrl, onImageChange }: EventImageUploadProps) {
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(currentImageUrl || null)
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
    const [error, setError] = React.useState<string>("")
    const [isDragging, setIsDragging] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    // Validar tipo de arquivo
    function validateImage(file: File): string | null {
        if (!ALLOWED_TYPES.includes(file.type)) {
            return "Formato inválido. Use JPG, PNG ou WEBP."
        }
        return null
    }

    // Processar arquivo selecionado
    function handleFileChange(file: File | null) {
        if (!file) {
            setSelectedFile(null)
            setPreviewUrl(currentImageUrl || null)
            setError("")
            onImageChange(null)
            return
        }

        const validationError = validateImage(file)
        if (validationError) {
            setError(validationError)
            return
        }

        setError("")
        setSelectedFile(file)
        onImageChange(file)

        // Criar preview
        const reader = new FileReader()
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    // Handler de input file
    function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] || null
        handleFileChange(file)
    }

    // Handler de drag & drop
    function handleDrop(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault()
        setIsDragging(false)

        const file = e.dataTransfer.files[0]
        if (file) {
            handleFileChange(file)
        }
    }

    function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault()
        setIsDragging(true)
    }

    function handleDragLeave() {
        setIsDragging(false)
    }

    // Remover imagem
    function handleRemove() {
        setSelectedFile(null)
        setPreviewUrl(null)
        setError("")
        onImageChange(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    return (
        <div className="space-y-2">
            <Label htmlFor="eventImage">Imagem de Divulgação (Opcional)</Label>

            {!previewUrl ? (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`
                        border-2 border-dashed rounded-lg p-8
                        hover:border-primary/50 transition-colors cursor-pointer
                        flex flex-col items-center justify-center gap-3
                        ${isDragging ? 'border-primary bg-primary/5' : 'border-border'}
                        ${error ? 'border-destructive' : ''}
                    `}
                >
                    <Upload className={`h-10 w-10 ${error ? 'text-destructive' : 'text-muted-foreground'}`} />
                    <div className="text-center">
                        <p className="text-sm font-medium text-foreground">
                            Clique para selecionar ou arraste a imagem aqui
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            JPG, PNG ou WEBP
                        </p>
                    </div>
                    <input
                        ref={fileInputRef}
                        id="eventImage"
                        name="eventImage"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleInputChange}
                        className="hidden"
                    />
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Preview da imagem */}
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-border">
                        <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Botão remover */}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemove}
                        className="text-destructive hover:text-destructive w-full sm:w-auto"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Remover imagem
                    </Button>
                </div>
            )}

            {/* Mensagem de erro */}
            {error && (
                <p className="text-sm text-destructive mt-2">
                    {error}
                </p>
            )}
        </div>
    )
}
