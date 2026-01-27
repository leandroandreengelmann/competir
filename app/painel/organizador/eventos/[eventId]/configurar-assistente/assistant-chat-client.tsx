"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    AssistantStateItem,
    CustomItem,
    updateAssistantStatusAction,
    addCustomAssistantItemAction,
    getAIHelpAction,
    formatAnswerAction
} from "@/app/actions/event-assistant"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
    MessageSquare,
    Play,
    Check,
    ArrowRight,
    HelpCircle,
    Plus,
    History,
    MoreHorizontal,
    SkipForward,
    Clock,
    Circle,
    ChevronRight,
    MinusCircle,
    Info,
    Edit2,
    Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"
import { FileUploader } from "./file-uploader"
import { getAttachmentsAction } from "@/app/actions/event-assistant-attachments"

interface AssistantChatClientProps {
    eventId: string
    initialKbItems: AssistantStateItem[]
    initialCustomItems: CustomItem[]
}

type Message = {
    role: 'bot' | 'user'
    content: string
    type?: 'question' | 'help' | 'preview' | 'formatted'
    term?: string
}

type FormattedStatus = 'idle' | 'formatting' | 'ready'

type Attachment = {
    id: string
    file_name: string
    file_type: string
    file_size: number
    file_url: string
}

export function AssistantChatClient({ eventId, initialKbItems, initialCustomItems }: AssistantChatClientProps) {
    const router = useRouter()
    const [kbItems, setKbItems] = React.useState(initialKbItems)
    const [customItems, setCustomItems] = React.useState(initialCustomItems)
    const [messages, setMessages] = React.useState<Message[]>([])
    const [currentIdx, setCurrentIdx] = React.useState<number | null>(null)

    // Novos estados para o fluxo de formatação
    const [draftRaw, setDraftRaw] = React.useState("")
    const [formattedDraft, setFormattedDraft] = React.useState<string | null>(null)
    const [formattedStatus, setFormattedStatus] = React.useState<FormattedStatus>('idle')
    const [hasSavedForCurrentQuestion, setHasSavedForCurrentQuestion] = React.useState(false)

    // Modo de edição inline na bolha
    const [isEditingFormatted, setIsEditingFormatted] = React.useState(false)
    const [editedFormattedText, setEditedFormattedText] = React.useState("")

    // Estado para anexos
    const [currentAttachments, setCurrentAttachments] = React.useState<Attachment[]>([])


    const [isFinished, setIsFinished] = React.useState(false)
    const [isSaving, setIsSaving] = React.useState(false)
    const [isAiLoading, setIsAiLoading] = React.useState(false)

    // Itens para customização final
    const [customQuestion, setCustomQuestion] = React.useState("")
    const [customAnswer, setCustomAnswer] = React.useState("")

    const scrollRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const startAssistant = () => {
        const nextIdx = kbItems.findIndex(item => item.status === 'PENDING')
        if (nextIdx !== -1) {
            loadQuestion(nextIdx, true)
        } else {
            setIsFinished(true)
            setMessages([{ role: 'bot', content: "Todas as perguntas da base já foram respondidas! Deseja adicionar algo mais?" }])
        }
    }

    const loadQuestion = async (idx: number, isStarting: boolean = false) => {
        const item = kbItems[idx]
        setCurrentIdx(idx)

        // Reset estados de formatação
        setFormattedDraft(null)
        setFormattedStatus('idle')
        setIsEditingFormatted(false)
        setEditedFormattedText("")

        // Carregar anexos existentes
        const existingAttachments = await getAttachmentsAction(eventId, item.term)
        setCurrentAttachments(existingAttachments)

        // Reset de anexos: limpa os anexos atuais se não houver anexos salvos
        // Isso garante que anexos de outra pergunta não apareçam aqui
        if (existingAttachments.length === 0) {
            setCurrentAttachments([])
        }

        // Se já tem resposta salva, carrega no rascunho
        const hasAnswer = item.status === 'ANSWERED' || item.status === 'APPROVED'
        setDraftRaw(hasAnswer ? (item.answer_raw || "") : "")
        setHasSavedForCurrentQuestion(hasAnswer)

        if (isStarting) {
            setMessages([
                { role: 'bot', content: `Olá! Vou te ajudar a configurar as informações do seu evento. Vamos começar?` },
                { role: 'bot', content: `Pergunta: ${item.term}`, type: 'question', term: item.term }
            ])
        } else {
            setMessages([
                { role: 'bot', content: `Pergunta: ${item.term}`, type: 'question', term: item.term }
            ])

            if (hasAnswer) {
                setMessages(prev => [
                    ...prev,
                    { role: 'bot', content: "Você já respondeu esta pergunta. Pode editar e reformatar se desejar." }
                ])
            }
        }

        // Scroll suave para o topo do chat
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    const handleFormatAndCorrect = async () => {
        // Permite formatar se houver texto OU anexos
        if ((!draftRaw.trim() && currentAttachments.length === 0) || currentIdx === null) {
            toast.error("Digite uma resposta ou anexe arquivos antes de formatar.")
            return
        }

        setFormattedStatus('formatting')

        // Se não houver texto, usa mensagem padrão
        const contentToFormat = draftRaw.trim() || "(Veja os anexos)"
        setMessages(prev => [...prev, { role: 'user', content: contentToFormat }])

        const term = kbItems[currentIdx].term
        const result = await formatAnswerAction(eventId, term, contentToFormat)

        if (result.success && result.formattedText) {
            setFormattedDraft(result.formattedText)
            setFormattedStatus('ready')
            setDraftRaw("") // Limpa o campo de texto após enviar
            setMessages(prev => [
                ...prev,
                {
                    role: 'bot' as const,
                    content: result.formattedText as string,
                    type: 'formatted' as const
                }
            ])
        } else {
            toast.error(result.error || "Erro ao formatar.")
            setFormattedStatus('idle')
        }
    }

    const handleSaveFormatted = async () => {
        if (!formattedDraft || currentIdx === null) return

        setIsSaving(true)
        const term = kbItems[currentIdx].term

        const result = await updateAssistantStatusAction(eventId, term, formattedDraft, 'APPROVED')

        if (result.success) {
            toast.success("Resposta salva com sucesso!")

            // Atualiza estado local
            const newKb = [...kbItems]
            newKb[currentIdx].answer_raw = formattedDraft
            newKb[currentIdx].status = 'APPROVED'
            setKbItems(newKb)
            setHasSavedForCurrentQuestion(true)

            // Limpar anexos após salvar (já foram persistidos)
            setCurrentAttachments([])

            setIsSaving(false)
        } else {
            toast.error(result.error)
            setIsSaving(false)
        }
    }

    // Salvar direto sem formatar (útil quando há apenas anexos)
    const handleSaveDirectly = async () => {
        if (currentIdx === null) return

        // Requer pelo menos texto OU anexos
        if (!draftRaw.trim() && currentAttachments.length === 0) {
            toast.error("Digite uma resposta ou anexe arquivos antes de salvar.")
            return
        }

        setIsSaving(true)
        const term = kbItems[currentIdx].term
        const contentToSave = draftRaw.trim() || "(Veja os anexos)"

        const result = await updateAssistantStatusAction(eventId, term, contentToSave, 'APPROVED')

        if (result.success) {
            toast.success("Resposta salva com sucesso!")

            // Atualiza estado local
            const newKb = [...kbItems]
            newKb[currentIdx].answer_raw = contentToSave
            newKb[currentIdx].status = 'APPROVED'
            setKbItems(newKb)
            setHasSavedForCurrentQuestion(true)

            // Limpar campos após salvar
            setDraftRaw("")
            setCurrentAttachments([])
            setFormattedDraft(null)
            setFormattedStatus('idle')

            setIsSaving(false)
        } else {
            toast.error(result.error)
            setIsSaving(false)
        }
    }

    const handleEditFormatted = () => {
        // Ativa modo de edição inline na bolha
        setIsEditingFormatted(true)
        setEditedFormattedText(formattedDraft || "")
    }

    const handleSaveEditedFormatted = async () => {
        // Salva o texto editado inline diretamente no banco
        if (!editedFormattedText.trim()) {
            toast.error("O texto não pode estar vazio.")
            return
        }

        if (currentIdx === null) return
        const q = kbItems[currentIdx]

        // Salva no banco
        const result = await updateAssistantStatusAction(
            eventId,
            q.term,
            editedFormattedText,
            "APPROVED"
        )

        if (result.success) {
            setFormattedDraft(editedFormattedText)
            setDraftRaw(editedFormattedText)
            setIsEditingFormatted(false)
            setHasSavedForCurrentQuestion(true)
            toast.success("Resposta salva com sucesso!")
        } else {
            toast.error(result.error || "Erro ao salvar.")
        }
    }

    const handleCancelEditFormatted = () => {
        // Cancela edição e volta ao modo visualização
        setIsEditingFormatted(false)
        setEditedFormattedText("")
    }

    const handleReformatInline = async () => {
        // Reformata o texto editado usando IA
        if (!editedFormattedText.trim() || currentIdx === null) {
            toast.error("Digite algum texto antes de reformatar.")
            return
        }

        setFormattedStatus('formatting')
        const term = kbItems[currentIdx].term
        const result = await formatAnswerAction(eventId, term, editedFormattedText)

        if (result.success && result.formattedText) {
            setEditedFormattedText(result.formattedText)
            setFormattedStatus('ready')
            toast.success("Texto reformatado!")
        } else {
            toast.error(result.error || "Erro ao reformatar.")
            setFormattedStatus('ready')
        }
    }


    const handleContinue = () => {
        // Permite continuar se houver resposta salva OU se houver apenas anexos
        const hasContent = hasSavedForCurrentQuestion || currentAttachments.length > 0

        if (!hasContent) {
            setMessages(prev => [
                ...prev,
                { role: 'bot', content: "Antes de continuar, formate e salve sua resposta ou anexe arquivos." }
            ])
            return
        }

        moveToNext()
    }

    const handleSkip = async () => {
        if (currentIdx === null) return

        const term = kbItems[currentIdx].term
        const result = await updateAssistantStatusAction(eventId, term, null, 'SKIPPED')

        if (result.success) {
            const newKb = [...kbItems]
            newKb[currentIdx].status = 'SKIPPED'
            setKbItems(newKb)

            setMessages(prev => [...prev, { role: 'user', content: "Passar pergunta." }])
            moveToNext()
        }
    }

    const showHelp = async () => {
        if (currentIdx === null) return
        const item = kbItems[currentIdx]

        setMessages(prev => [
            ...prev,
            { role: 'user', content: "Tenho dúvida sobre esta pergunta." }
        ])

        setIsAiLoading(true)

        try {
            const result = await getAIHelpAction(eventId, item.term, item.definition)

            if (result.success && result.helpText) {
                setMessages(prev => [
                    ...prev,
                    {
                        role: 'bot',
                        content: result.helpText as string,
                        type: 'help'
                    }
                ])
            } else {
                toast.error(result.error)
                setMessages(prev => [
                    ...prev,
                    {
                        role: 'bot',
                        content: result.fallback as string,
                        type: 'help'
                    }
                ])
            }
        } catch (error) {
            toast.error("Erro ao conectar com a IA.")
        } finally {
            setIsAiLoading(false)
        }
    }

    const jumpToQuestion = (idx: number) => {
        loadQuestion(idx, false)
    }

    const moveToNext = () => {
        const nextIdx = kbItems.findIndex((item, i) => item.status === 'PENDING' && (currentIdx === null || i > currentIdx))

        if (nextIdx !== -1) {
            loadQuestion(nextIdx, false)
        } else {
            setCurrentIdx(null)
            setIsFinished(true)
            setMessages(prev => [...prev, { role: 'bot', content: "Não tenho mais perguntas da base. Deseja adicionar alguma informação customizada?" }])
        }
    }

    const handleAddCustom = async () => {
        if (!customQuestion.trim() || !customAnswer.trim()) return

        setIsSaving(true)
        const result = await addCustomAssistantItemAction(eventId, customQuestion, customAnswer)

        if (result.success) {
            toast.success("Item customizado adicionado!")
            setCustomItems(prev => [...prev, { id: Math.random().toString(), question_text: customQuestion, answer_text: customAnswer }])
            setMessages(prev => [
                ...prev,
                { role: 'user', content: `Adicionar: ${customQuestion}` },
                { role: 'bot', content: "Item adicionado com sucesso!" }
            ])
            setCustomQuestion("")
            setCustomAnswer("")
        } else {
            toast.error(result.error)
        }
        setIsSaving(false)
    }

    return (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] h-[1200px]">
            {/* Histórico e Conversa */}
            <Card className="flex flex-col overflow-hidden shadow-md">
                <CardHeader className="border-b py-3 px-4 bg-muted/30">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        Conversa com Assistente
                    </CardTitle>
                </CardHeader>

                <CardContent
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
                >
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-500">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full blur-xl animate-pulse" />
                                <div className="relative p-6 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-lg">
                                    <MessageSquare className="h-12 w-12 text-primary" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">Inicie seu Assistente</h3>
                                <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                                    Vou te ajudar a preencher todas as informações gerais do seu campeonato de forma rápida e profissional.
                                </p>
                            </div>
                            <Button onClick={startAssistant} className="gap-2 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
                                <Play className="h-4 w-4" />
                                Começar Agora
                            </Button>
                        </div>
                    ) : (
                        messages.map((msg, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "flex flex-col max-w-[85%] animate-in slide-in-from-bottom-2 duration-300",
                                    msg.role === 'user' ? "ml-auto items-end" : "items-start"
                                )}
                            >
                                <div
                                    className={cn(
                                        "px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap shadow-sm transition-all duration-200",
                                        msg.role === 'user'
                                            ? "bg-primary text-primary-foreground rounded-tr-none shadow-md"
                                            : msg.type === 'formatted'
                                                ? "bg-gradient-to-br from-success/10 to-success/5 border-2 border-success/30 text-foreground rounded-tl-none w-full shadow-md"
                                                : "bg-muted text-foreground rounded-tl-none border hover:border-border/80"
                                    )}
                                >
                                    {/* Modo de edição inline na bolha formatada */}
                                    {msg.type === 'formatted' && isEditingFormatted ? (
                                        <div className="space-y-3">
                                            <Textarea
                                                value={editedFormattedText}
                                                onChange={(e) => setEditedFormattedText(e.target.value)}
                                                className="min-h-[120px] resize-none bg-white"
                                                placeholder="Edite o texto formatado..."
                                            />
                                            <div className="flex gap-2 pt-2 border-t border-green-300">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={handleCancelEditFormatted}
                                                    className="gap-1.5 text-xs h-8"
                                                >
                                                    Cancelar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={handleReformatInline}
                                                    disabled={formattedStatus === 'formatting' || !editedFormattedText.trim()}
                                                    className="gap-1.5 text-xs h-8"
                                                >
                                                    <Sparkles className="h-3 w-3" />
                                                    {formattedStatus === 'formatting' ? "Reformatando..." : "Reformatar com IA"}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={handleSaveEditedFormatted}
                                                    disabled={!editedFormattedText.trim()}
                                                    className="gap-1.5 text-xs h-8"
                                                >
                                                    <Check className="h-3 w-3" />
                                                    Salvar alterações
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {msg.content}

                                            {/* Botões na bolha formatada (modo visualização) */}
                                            {msg.type === 'formatted' && formattedStatus === 'ready' && !isEditingFormatted && (
                                                <div className="flex gap-2 mt-3 pt-3 border-t border-success/30">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={handleEditFormatted}
                                                        disabled={isSaving}
                                                        className="gap-1.5 text-xs h-8 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 hover:scale-105"
                                                    >
                                                        <Edit2 className="h-3 w-3" />
                                                        Editar
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={handleSaveFormatted}
                                                        disabled={isSaving}
                                                        className="gap-1.5 text-xs h-8 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
                                                    >
                                                        <Check className="h-3 w-3" />
                                                        {isSaving ? "Salvando..." : "Salvar"}
                                                    </Button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                                <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                    {msg.role === 'bot' ? 'Assistente AI' : 'Você'}
                                </span>
                            </div>
                        ))
                    )}
                    {isAiLoading && (
                        <div className="flex flex-col items-start max-w-[85%] animate-pulse">
                            <div className="bg-muted text-foreground rounded-2xl rounded-tl-none border px-4 py-2 text-sm italic">
                                O Assistente está pensando...
                            </div>
                        </div>
                    )}
                    {formattedStatus === 'formatting' && (
                        <div className="flex flex-col items-start max-w-[85%] animate-pulse">
                            <div className="bg-muted text-foreground rounded-2xl rounded-tl-none border px-4 py-2 text-sm italic flex items-center gap-2">
                                <Sparkles className="h-3.5 w-3.5 text-primary animate-spin" />
                                Formatando e corrigindo sua resposta...
                            </div>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="border-t p-4 flex flex-col gap-4">
                    {currentIdx !== null && (
                        <div className="w-full space-y-3">
                            <Textarea
                                placeholder="Digite sua resposta aqui... (quanto mais detalhes você fornecer, melhor será a formatação da IA)"
                                value={draftRaw}
                                onChange={(e) => setDraftRaw(e.target.value)}
                                className="resize-none min-h-[140px] text-sm leading-relaxed"
                                disabled={formattedStatus === 'formatting'}
                            />


                            <FileUploader
                                key={`uploader-${currentIdx}-${kbItems[currentIdx]?.term}`}
                                eventId={eventId}
                                kbTerm={kbItems[currentIdx].term}
                                initialAttachments={currentAttachments}
                                onAttachmentsChange={setCurrentAttachments}
                                disabled={formattedStatus === 'formatting' || isSaving}
                            />
                            <div className="space-y-3">
                                <div className="flex gap-3 justify-between flex-wrap">
                                    <div className="flex gap-3 flex-wrap">
                                        <Button
                                            variant="default"
                                            onClick={handleFormatAndCorrect}
                                            disabled={formattedStatus === 'formatting' || isSaving || (!draftRaw.trim() && currentAttachments.length === 0)}
                                            className="gap-2 h-11 px-5 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 font-medium"
                                        >
                                            <Sparkles className="h-5 w-5" />
                                            {formattedStatus === 'formatting' ? "Formatando..." : "Formatar e corrigir"}
                                        </Button>
                                        {currentAttachments.length > 0 && formattedStatus === 'idle' && (
                                            <Button
                                                variant="default"
                                                onClick={handleSaveDirectly}
                                                disabled={isSaving}
                                                className="gap-2 h-11 px-5 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 font-medium bg-success hover:bg-success/90"
                                            >
                                                <Check className="h-5 w-5" />
                                                {isSaving ? "Salvando..." : "Salvar"}
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            onClick={showHelp}
                                            disabled={isAiLoading || isSaving}
                                            className="gap-2 h-11 px-5 border-info/30 text-info hover:bg-info/10 hover:border-info/50 transition-all duration-200"
                                        >
                                            <HelpCircle className="h-5 w-5" />
                                            Tenho dúvida
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={handleSkip}
                                            disabled={isAiLoading || isSaving}
                                            className="gap-2 h-11 px-5 text-muted-foreground hover:text-foreground transition-all duration-200"
                                        >
                                            <SkipForward className="h-4 w-4" />
                                            Pular
                                        </Button>
                                    </div>
                                    <Button
                                        onClick={handleContinue}
                                        disabled={isSaving || !hasSavedForCurrentQuestion}
                                        className="gap-2 h-11 px-6 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 font-medium bg-success hover:bg-success/90"
                                    >
                                        <ArrowRight className="h-5 w-5" />
                                        {hasSavedForCurrentQuestion ? "Continuar" : "Salvar e continuar"}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground flex items-start gap-2 bg-muted/30 p-3 rounded-lg border border-border/50">
                                    <Info className="h-4 w-4 mt-0.5 shrink-0 text-info" />
                                    <span className="leading-relaxed">Escreva sua resposta, depois clique em <strong>"Formatar e corrigir"</strong> para o assistente melhorar o texto. Depois, salve e continue.</span>
                                </p>
                            </div>


                        </div>
                    )}

                    {isFinished && currentIdx === null && (
                        <div className="w-full p-4 border-2 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border-dashed border-primary/30 space-y-3 shadow-sm hover:shadow-md transition-all duration-300">
                            <p className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                                <Plus className="h-3.5 w-3.5" />
                                Adicionar Item Customizado
                            </p>
                            <Input
                                placeholder="Pergunta personalizada (ex: Estacionamento)"
                                value={customQuestion}
                                onChange={(e) => setCustomQuestion(e.target.value)}
                            />
                            <Textarea
                                placeholder="Resposta personalizada..."
                                value={customAnswer}
                                onChange={(e) => setCustomAnswer(e.target.value)}
                                className="h-20"
                            />
                            <Button
                                size="sm"
                                className="w-full gap-2"
                                onClick={handleAddCustom}
                                disabled={isSaving || !customQuestion.trim() || !customAnswer.trim()}
                            >
                                <Plus className="h-4 w-4" />
                                Adicionar ao Evento
                            </Button>
                        </div>
                    )}
                </CardFooter>
            </Card>

            {/* Resumo Lateral */}
            <div className="flex flex-col h-[1200px] gap-4">
                <div className="flex-1 min-w-0 overflow-y-auto px-1 space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <History className="h-4 w-4 text-muted-foreground" />
                            <h3 className="text-sm font-semibold">Resumo do Progresso</h3>
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground font-medium">
                                {kbItems.filter(item => item.status === 'APPROVED').length} de {kbItems.length} perguntas respondidas
                            </p>
                            <div className="w-full bg-muted rounded-full h-2.5 shadow-inner overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-primary to-primary/80 h-2.5 rounded-full transition-all duration-500 shadow-sm"
                                    style={{ width: `${(kbItems.filter(item => item.status === 'APPROVED').length / kbItems.length) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {kbItems.map((item, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "p-2.5 rounded-lg border text-xs flex items-center gap-2 transition-all duration-200",
                                    "cursor-pointer hover:shadow-sm active:scale-[0.98]",
                                    item.status === 'APPROVED' ? "bg-gradient-to-r from-success/10 to-success/5 border-success/30 text-success hover:border-success/50" :
                                        item.status === 'ANSWERED' ? "bg-gradient-to-r from-warning/10 to-warning/5 border-warning/30 text-warning hover:border-warning/50" :
                                            item.status === 'SKIPPED' ? "bg-muted border-border text-muted-foreground hover:bg-muted/80" :
                                                i === currentIdx ? "border-primary ring-2 ring-primary/30 bg-gradient-to-r from-primary/10 to-primary/5 shadow-sm" : "bg-card text-muted-foreground/60 hover:bg-accent/30 hover:border-border"
                                )}
                                onClick={() => jumpToQuestion(i)}
                                role="button"
                                tabIndex={0}
                                aria-label={`Ir para pergunta: ${item.term}`}
                                onKeyPress={(e) => e.key === 'Enter' && jumpToQuestion(i)}
                            >
                                <div className="shrink-0">
                                    {item.status === 'APPROVED' && <Check className="h-3.5 w-3.5 text-green-600" />}
                                    {item.status === 'ANSWERED' && <Clock className="h-3.5 w-3.5 text-amber-600" />}
                                    {item.status === 'SKIPPED' && <MinusCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                                    {(!item.status || item.status === 'PENDING') && i === currentIdx && <ChevronRight className="h-3.5 w-3.5 text-primary" />}
                                    {(!item.status || item.status === 'PENDING') && i !== currentIdx && <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />}
                                </div>
                                <span className="truncate flex-1 font-medium">{item.term}</span>
                            </div>
                        ))}

                        {customItems.length > 0 && (
                            <>
                                <div className="pt-2 pb-1 border-t text-[10px] uppercase font-bold text-muted-foreground">Customizados</div>
                                {customItems.map((item, i) => (
                                    <div key={i} className="p-2 rounded border border-primary/20 bg-primary/5 text-xs text-primary font-medium flex items-center gap-2">
                                        <Plus className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate">{item.question_text}</span>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>

                <div className="pt-1 px-1 shrink-0">
                    <Button
                        variant="default"
                        className="w-full gap-2 h-11 shadow-sm hover:shadow-md transition-all duration-200"
                        onClick={() => router.push(`/painel/organizador/eventos/${eventId}/informacoes-gerais`)}
                    >
                        <History className="h-4 w-4" />
                        Ver Perguntas Respondidas
                    </Button>
                </div>
            </div>
        </div>
    )
}
