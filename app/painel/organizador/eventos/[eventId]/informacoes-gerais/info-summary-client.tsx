"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ArrowLeft, Edit, Send, Calendar, MapPin, CheckCircle, AlertCircle, Trash2, Save, Sparkles } from "lucide-react"
import { publishEventInfoAction, unpublishEventInfoAction, updateEventResponseAction, deleteEventResponseAction, formatAnswerAction } from "@/app/actions/event-assistant"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { AttachmentList } from "./attachment-list"
import { getAttachmentsAction, registerAttachmentAction, deleteAttachmentAction } from "@/app/actions/event-assistant-attachments"
import { createClient as createBrowserClient } from "@/lib/supabase/client"

type EventInfo = {
    id: string
    name: string
    date: string
    address: string
    info_published: boolean
    info_published_at: string | null
}

type Response = {
    kb_term: string
    answer_raw: string
}

type CustomItem = {
    question_text: string
    answer_text: string
}

type Attachment = {
    id: string
    file_name: string
    file_type: string
    file_size: number
    file_url: string
}

interface InfoSummaryClientProps {
    eventId: string
    event: EventInfo
    responses: Response[]
    customItems: CustomItem[]
}

export function InfoSummaryClient({ eventId, event, responses: initialResponses, customItems }: InfoSummaryClientProps) {
    const router = useRouter()

    // State para respostas (dinâmico)
    const [responses, setResponses] = React.useState(initialResponses)

    // State para modal de publicação
    const [showPublishDialog, setShowPublishDialog] = React.useState(false)
    const [showUnpublishDialog, setShowUnpublishDialog] = React.useState(false)
    const [isPublishing, setIsPublishing] = React.useState(false)
    const [isUnpublishing, setIsUnpublishing] = React.useState(false)

    // State para modal de edição
    const [editingResponse, setEditingResponse] = React.useState<Response | null>(null)
    const [editedAnswer, setEditedAnswer] = React.useState("")
    const [isSaving, setIsSaving] = React.useState(false)
    const [isFormatting, setIsFormatting] = React.useState(false)

    // State para modal de exclusão
    const [deletingResponse, setDeletingResponse] = React.useState<Response | null>(null)
    const [isDeleting, setIsDeleting] = React.useState(false)

    // State para anexos e gerenciamento
    const [attachmentsMap, setAttachmentsMap] = React.useState<Record<string, Attachment[]>>({})
    const [isUploadingAttachment, setIsUploadingAttachment] = React.useState(false)
    const [deletingAttachmentId, setDeletingAttachmentId] = React.useState<string | null>(null)

    const handlePublish = async () => {
        setIsPublishing(true)
        const result = await publishEventInfoAction(eventId)

        if (result.success) {
            toast.success("✅ Informações publicadas com sucesso!", {
                description: "As informações gerais agora estão visíveis no evento."
            })
            setShowPublishDialog(false)
            router.refresh()
        } else {
            toast.error(result.error)
        }
        setIsPublishing(false)
    }

    const handleUnpublish = async () => {
        setIsUnpublishing(true)
        const result = await unpublishEventInfoAction(eventId)

        if (result.success) {
            toast.success("✅ Informações despublicadas", {
                description: "As informações não estão mais visíveis publicamente."
            })
            setShowUnpublishDialog(false)
            router.refresh()
        } else {
            toast.error(result.error)
        }
        setIsUnpublishing(false)
    }

    // Carregar anexos para todas as respostas
    React.useEffect(() => {
        const loadAllAttachments = async () => {
            const attachmentsData: Record<string, Attachment[]> = {}
            const supabase = createBrowserClient()

            for (const response of responses) {
                const attachments = await getAttachmentsAction(eventId, response.kb_term)
                if (attachments.length > 0) {
                    // Tentar garantir que temos URLs acessíveis para imagens
                    const processedAttachments = await Promise.all(attachments.map(async (att) => {
                        if (att.file_type.startsWith('image/')) {
                            try {
                                // Extrair filePath da URL (Padrão: .../event-attachments/path/to/file)
                                const urlParts = att.file_url.split('/event-attachments/');
                                if (urlParts.length >= 2) {
                                    const filePath = urlParts[1].split('?')[0];

                                    // Gerar Signed URL (60 seg de expiração é suficiente para o preview)
                                    const { data, error } = await supabase.storage
                                        .from('event-attachments')
                                        .createSignedUrl(filePath, 60);

                                    if (data?.signedUrl) {
                                        return { ...att, file_url: data.signedUrl };
                                    }
                                }
                            } catch (e) {
                                console.error('[ERROR] Falha ao gerar signed URL:', e);
                            }
                        }
                        return att;
                    }))
                    attachmentsData[response.kb_term] = processedAttachments
                }
            }

            setAttachmentsMap(attachmentsData)
        }

        loadAllAttachments()
    }, [eventId, responses])

    const handleDeleteAttachment = async (attachmentId: string) => {
        setDeletingAttachmentId(attachmentId)
        try {
            const result = await deleteAttachmentAction(attachmentId)
            if (result.success) {
                // Atualizar estado local do attachmentsMap
                setAttachmentsMap(prev => {
                    const newMap = { ...prev }
                    for (const term in newMap) {
                        newMap[term] = newMap[term].filter(a => a.id !== attachmentId)
                    }
                    return newMap
                })
                toast.success("🗑️ Anexo excluído com sucesso")
            } else {
                toast.error(result.error || "Erro ao excluir anexo")
            }
        } catch (error) {
            console.error('[ERROR] Erro ao excluir anexo:', error)
            toast.error("Erro técnico ao excluir anexo")
        } finally {
            setDeletingAttachmentId(null)
        }
    }

    const handleUploadAttachment = async (kbTerm: string, files: FileList) => {
        setIsUploadingAttachment(true)
        let successCount = 0
        let errorCount = 0

        try {
            const supabase = createBrowserClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                toast.error("Sua sessão expirou. Por favor, faça login novamente.")
                return
            }

            for (let i = 0; i < files.length; i++) {
                const file = files[i]

                // 1. Gerar path único (seguindo padrão do backend anterior)
                const timestamp = Date.now()
                const sanitizedTerm = kbTerm.toLowerCase().replace(/[^a-z0-9]/g, '_')
                const fileName = `${timestamp}-${file.name.replace(/[^a-z0-9.]/gi, '_')}`
                const filePath = `${user.id}/${eventId}/${sanitizedTerm}/${fileName}`

                // 2. Upload direto para o Storage (Client-side)
                const { error: uploadError } = await supabase.storage
                    .from('event-attachments')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: false
                    })

                if (uploadError) {
                    console.error('Upload client error:', uploadError)
                    errorCount++
                    continue
                }

                // 3. Obter URL pública
                const { data: { publicUrl } } = supabase.storage
                    .from('event-attachments')
                    .getPublicUrl(filePath)

                // 4. Registrar metadados via Server Action (Apenas metadados, sem binário!)
                const result = await registerAttachmentAction({
                    eventId,
                    kbTerm,
                    fileUrl: publicUrl,
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size
                })

                if (result.success && result.attachmentId) {
                    successCount++
                    // Adicionar ao estado local
                    const newAttachment: Attachment = {
                        id: result.attachmentId,
                        file_name: file.name,
                        file_type: file.type,
                        file_size: file.size,
                        file_url: publicUrl
                    }

                    setAttachmentsMap(prev => ({
                        ...prev,
                        [kbTerm]: [...(prev[kbTerm] || []), newAttachment]
                    }))
                } else {
                    // Se falhou ao registrar no DB, tenta limpar o storage
                    await supabase.storage.from('event-attachments').remove([filePath])
                    errorCount++
                }
            }

            if (successCount > 0) {
                toast.success(successCount === 1 ? "✨ Anexo enviado!" : `✨ ${successCount} anexos enviados!`)
            }
            if (errorCount > 0) {
                toast.error(`${errorCount} arquivo(s) falharam no envio. Tente novamente.`)
            }
        } catch (error) {
            console.error('[ERROR] Erro no upload:', error)
            toast.error("Erro técnico ao enviar arquivos")
        } finally {
            setIsUploadingAttachment(false)
        }
    }

    const openEditDialog = (response: Response) => {
        setEditingResponse(response)
        setEditedAnswer(response.answer_raw)
    }

    const handleAIFormat = async () => {
        if (!editingResponse || !editedAnswer.trim()) return

        setIsFormatting(true)
        try {
            const result = await formatAnswerAction(eventId, editingResponse.kb_term, editedAnswer)

            if (result.success && result.formattedText) {
                // SÓ atualiza o textarea em caso de sucesso real
                setEditedAnswer(result.formattedText)
                toast.success("✨ Resposta formatada com sucesso!")
            } else {
                // Em caso de erro, NUNCA atualiza o editedAnswer (preserva o original)
                toast.error(result.error || "Não foi possível formatar o texto. Verifique se o conteúdo está claro.")
            }
        } catch (error) {
            console.error('[ERROR] Erro ao formatar com IA:', error)
            toast.error("Erro técnico ao tentar formatar. O texto original foi preservado.")
        } finally {
            setIsFormatting(false)
        }
    }

    const handleUpdateResponse = async () => {
        if (!editingResponse) return

        setIsSaving(true)
        const result = await updateEventResponseAction(eventId, editingResponse.kb_term, editedAnswer)

        if (result.success) {
            // Atualizar estado local
            setResponses(prev => prev.map(r =>
                r.kb_term === editingResponse.kb_term
                    ? { ...r, answer_raw: editedAnswer.trim() }
                    : r
            ))
            toast.success("✅ Resposta atualizada!")
            setEditingResponse(null)
            setEditedAnswer("")
        } else {
            toast.error(result.error)
        }
        setIsSaving(false)
    }

    const openDeleteDialog = (response: Response) => {
        setDeletingResponse(response)
    }

    const handleDeleteResponse = async () => {
        if (!deletingResponse) return

        setIsDeleting(true)
        const result = await deleteEventResponseAction(eventId, deletingResponse.kb_term)

        if (result.success) {
            // Remover do estado local
            setResponses(prev => prev.filter(r => r.kb_term !== deletingResponse.kb_term))
            toast.success("🗑️ Resposta excluída")
            setDeletingResponse(null)
        } else {
            toast.error(result.error)
        }
        setIsDeleting(false)
    }

    const totalItems = responses.length + customItems.length

    return (
        <>
            {/* Cabeçalho com Contexto do Evento - Grid Assimétrico */}
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-start">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                            Informações Gerais
                        </h1>
                        <div className="flex flex-col gap-2">
                            <p className="text-xl font-semibold text-primary">{event.name}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-secondary border border-border/50 transition-all hover:border-border hover:shadow-sm">
                                    <Calendar className="h-4 w-4 text-primary shrink-0" />
                                    <span className="font-medium">{event.date}</span>
                                </div>
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-secondary border border-border/50 transition-all hover:border-border hover:shadow-sm">
                                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                                    <span className="font-medium truncate">{event.address}</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                            Revise com atenção. Após publicar, estas informações serão exibidas para atletas e público na página do evento.
                        </p>
                    </div>

                    {/* Status Badge - Destacado */}
                    <div className="flex justify-start lg:justify-end">
                        {event.info_published ? (
                            <Badge variant="default" className="gap-2 px-4 py-2 bg-success hover:bg-success/90 shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105">
                                <CheckCircle className="h-4 w-4" />
                                <span className="font-medium">
                                    Publicado {event.info_published_at && `em ${format(new Date(event.info_published_at), "dd/MM/yyyy", { locale: ptBR })}`}
                                </span>
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="gap-2 px-4 py-2 shadow-sm transition-all duration-300 hover:shadow-md">
                                <AlertCircle className="h-4 w-4" />
                                <span className="font-medium">Rascunho - Não publicado</span>
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            {/* Resumo das Respostas */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">Resumo das Informações</h2>
                    <Badge variant="outline" className="text-base px-3 py-1">
                        {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                    </Badge>
                </div>

                {totalItems === 0 ? (
                    <Card className="border-dashed animate-in fade-in duration-500">
                        <CardContent className="p-12 text-center">
                            <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                <AlertCircle className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-lg font-medium text-muted-foreground mb-2">Nenhuma informação aprovada ainda</p>
                            <p className="text-sm text-muted-foreground">Complete o assistente e aprove as respostas para vê-las aqui.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {/* Respostas da KB com Animação Staggered */}
                        {responses.map((response, i) => (
                            <Card
                                key={i}
                                className="group transition-all duration-300 hover:shadow-lg hover:border-primary/20 animate-in fade-in slide-in-from-bottom-2"
                                style={{
                                    animationDelay: `${i * 100}ms`,
                                    animationFillMode: 'backwards'
                                }}
                            >
                                <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                                    <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground font-bold group-hover:text-foreground transition-colors">
                                        {response.kb_term}
                                    </CardTitle>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEditDialog(response)}
                                            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-all duration-200 hover:scale-110"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openDeleteDialog(response)}
                                            className="h-8 w-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 hover:scale-110"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">
                                        {response.answer_raw}
                                    </p>
                                    {attachmentsMap[response.kb_term] && (
                                        <AttachmentList
                                            kbTerm={response.kb_term}
                                            attachments={attachmentsMap[response.kb_term]}
                                            onDelete={handleDeleteAttachment}
                                            onUpload={handleUploadAttachment}
                                            isUploading={isUploadingAttachment}
                                            isDeleting={deletingAttachmentId}
                                            className="mt-4 pt-4 border-t border-border/30"
                                        />
                                    )}
                                </CardContent>
                            </Card>
                        ))}

                        {/* Itens Customizados */}
                        {customItems.length > 0 && (
                            <>
                                <div className="pt-6 flex items-center gap-3">
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                                    <h3 className="text-xs font-bold text-primary uppercase tracking-widest px-3">
                                        Informações Customizadas
                                    </h3>
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
                                </div>
                                {customItems.map((item, i) => (
                                    <Card
                                        key={i}
                                        className="group border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 transition-all duration-300 hover:shadow-lg hover:border-primary/50 animate-in fade-in slide-in-from-bottom-2"
                                        style={{
                                            animationDelay: `${(responses.length + i) * 100}ms`,
                                            animationFillMode: 'backwards'
                                        }}
                                    >
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-sm uppercase tracking-widest text-primary font-bold flex items-center gap-2 group-hover:gap-3 transition-all">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                {item.question_text}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">
                                                {item.answer_text}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Ações - Layout Aprimorado */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-8 border-t border-border/50">
                <Button
                    variant="ghost"
                    onClick={() => router.push(`/painel/organizador/eventos/${eventId}`)}
                    className="gap-2 transition-all duration-200 hover:gap-3 hover:bg-surface-secondary"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao evento
                </Button>

                <div className="flex flex-col sm:flex-row gap-3">
                    {event.info_published ? (
                        <Button
                            variant="outline"
                            onClick={() => setShowUnpublishDialog(true)}
                            className="gap-2 transition-all duration-200 hover:gap-3 text-destructive hover:bg-destructive/5 hover:border-destructive/30"
                        >
                            <AlertCircle className="h-4 w-4" />
                            Despublicar informações
                        </Button>
                    ) : (
                        totalItems > 0 && (
                            <Button
                                onClick={() => setShowPublishDialog(true)}
                                className="gap-2 transition-all duration-200 hover:gap-3 shadow-md hover:shadow-lg hover:scale-105"
                            >
                                <Send className="h-4 w-4" />
                                Publicar informações do evento
                            </Button>
                        )
                    )}
                </div>
            </div>

            {/* Modal de Edição */}
            <Dialog open={!!editingResponse} onOpenChange={(open) => !open && setEditingResponse(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Editar Resposta</DialogTitle>
                        <DialogDescription className="sr-only">
                            Edite a resposta desta pergunta
                        </DialogDescription>
                    </DialogHeader>

                    {editingResponse && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">
                                    Pergunta:
                                </label>
                                <p className="text-base font-semibold mt-1">
                                    {editingResponse.kb_term}
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium">
                                    Resposta:
                                </label>
                                <Textarea
                                    value={editedAnswer}
                                    onChange={(e) => setEditedAnswer(e.target.value)}
                                    className="mt-2 min-h-[200px]"
                                    placeholder="Digite a resposta..."
                                />
                            </div>

                            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                <span>Edite manualmente a resposta abaixo. Esta alteração substituirá o conteúdo atual.</span>
                            </p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setEditingResponse(null)}
                            disabled={isSaving}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleAIFormat}
                            disabled={isFormatting || isSaving || !editedAnswer.trim()}
                            className="gap-2 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all duration-200"
                        >
                            {isFormatting ? (
                                <>
                                    <Sparkles className="h-4 w-4 animate-spin" />
                                    Formatando...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4" />
                                    Formatar com IA
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={handleUpdateResponse}
                            disabled={isSaving || isFormatting || !editedAnswer.trim() || editedAnswer.trim().length < 3}
                            className="gap-2"
                        >
                            {isSaving ? (
                                <>Salvando...</>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Salvar alterações
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Exclusão */}
            <Dialog open={!!deletingResponse} onOpenChange={(open) => !open && setDeletingResponse(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Excluir Resposta?</DialogTitle>
                        <DialogDescription className="sr-only">
                            Confirme a exclusão desta resposta
                        </DialogDescription>
                    </DialogHeader>

                    {deletingResponse && (
                        <div className="space-y-4">
                            <div className="flex items-start gap-2 text-sm">
                                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                                <p>
                                    Tem certeza que deseja excluir esta resposta?
                                </p>
                            </div>

                            <div className="pl-7">
                                <p className="text-sm font-medium">
                                    Pergunta: {deletingResponse.kb_term}
                                </p>
                            </div>

                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                <p>Esta ação não poderá ser desfeita.</p>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeletingResponse(null)}
                            disabled={isDeleting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteResponse}
                            disabled={isDeleting}
                            className="gap-2"
                        >
                            {isDeleting ? (
                                <>Excluindo...</>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4" />
                                    Confirmar exclusão
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Confirmação de Publicação */}
            <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Publicar Informações Gerais?</DialogTitle>
                        <DialogDescription>
                            Ao publicar, estas informações ficarão visíveis na página do evento.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-4">
                        <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span><strong>{totalItems}</strong> {totalItems === 1 ? 'pergunta respondida' : 'perguntas respondidas'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{event.name}</span>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowPublishDialog(false)}
                            disabled={isPublishing}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handlePublish}
                            disabled={isPublishing}
                            className="gap-2"
                        >
                            {isPublishing ? (
                                <>Publicando...</>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    Confirmar Publicação
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Confirmação de Despublicação */}
            <Dialog open={showUnpublishDialog} onOpenChange={setShowUnpublishDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Despublicar Informações Gerais?</DialogTitle>
                        <DialogDescription>
                            As informações gerais deixarão de ser exibidas na página pública do evento.
                            Você poderá republicá-las a qualquer momento.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <span>Esta ação ocultará as respostas e anexos para o público atleta.</span>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowUnpublishDialog(false)}
                            disabled={isUnpublishing}
                        >
                            Manter publicado
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleUnpublish}
                            disabled={isUnpublishing}
                            className="gap-2"
                        >
                            {isUnpublishing ? (
                                <>Despublicando...</>
                            ) : (
                                <>
                                    <AlertCircle className="h-4 w-4" />
                                    Confirmar Despublicação
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
