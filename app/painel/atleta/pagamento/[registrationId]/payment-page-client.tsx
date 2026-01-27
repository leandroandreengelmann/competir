"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { QrCode, Copy, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { createPixChargeAction } from "@/app/actions/asaas-payments"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface PaymentClientProps {
    registrationId: string
    registrationData: {
        id: string
        event_name: string
        belt: string
        age_group: string
        amount_cents: number
        status: string
    }
}

export function PaymentPageClient({ registrationId, registrationData }: PaymentClientProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)
    const [payment, setPayment] = React.useState<{
        id: string
        value_cents: number
        pix_qr_code: string
        pix_copy_paste: string
        expires_at: string
    } | null>(null)

    // Gerar cobrança ao montar componente
    React.useEffect(() => {
        async function generateCharge() {
            setIsLoading(true)
            try {
                const result = await createPixChargeAction(registrationId)

                if (result.success && result.payment) {
                    setPayment(result.payment)
                } else if (result.error) {
                    toast.error(result.error)
                }
            } catch (error) {
                console.error('Erro ao gerar cobrança:', error)
                toast.error('Erro ao gerar cobrança. Tente novamente.')
            } finally {
                setIsLoading(false)
            }
        }

        generateCharge()
    }, [registrationId])

    // Listener Realtime para redirecionamento automático pós-pagamento
    React.useEffect(() => {
        const supabase = createClient()

        const channel = supabase
            .channel(`registration-${registrationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'registrations',
                    filter: `id=eq.${registrationId}`
                },
                (payload) => {
                    console.log('[Realtime] Mudança detectada:', payload.new.status)
                    if (payload.new.status === 'paid') {
                        toast.success('Pagamento confirmado!')
                        router.replace(`/painel/atleta/pagamento-confirmado/${registrationId}`)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [registrationId, router])

    // Copiar código Pix
    const handleCopyPixCode = async () => {
        if (!payment) return

        try {
            await navigator.clipboard.writeText(payment.pix_copy_paste)
            toast.success('Código Pix copiado!')
        } catch (error) {
            toast.error('Erro ao copiar código')
        }
    }

    return (
        <div className="flex flex-col items-center justify-center py-4 sm:py-8">
            <Card className="max-w-xl w-full border-border/50 shadow-lg">
                <CardHeader className="text-center space-y-4 pb-2 sm:pb-6">
                    <div className="mx-auto w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                        <QrCode className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-3xl sm:text-4xl font-extrabold tracking-tight">Pagamento via Pix</CardTitle>
                    <p className="text-muted-foreground text-sm sm:text-base max-w-[280px] sm:max-w-none mx-auto">
                        Escaneie o QR Code ou copie o código Pix para garantir sua vaga
                    </p>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Informações da Inscrição */}
                    <div className="bg-muted/40 rounded-xl p-4 sm:p-5 space-y-3 border border-border/50">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Inscrição:</span>
                            <span className="font-mono font-medium opacity-70">#{registrationData.id}</span>
                        </div>
                        <div className="flex justify-between items-start text-sm gap-4">
                            <span className="text-muted-foreground shrink-0">Evento:</span>
                            <span className="font-semibold text-right leading-snug">{registrationData.event_name}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Categoria:</span>
                            <span className="font-medium">
                                {registrationData.belt} • {registrationData.age_group}
                            </span>
                        </div>
                        <div className="pt-2 border-t border-border/50 flex justify-between items-center">
                            <span className="text-muted-foreground font-medium">Total a pagar:</span>
                            <span className="text-xl font-black text-primary">
                                R$ {(registrationData.amount_cents / 100).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* Loading */}
                    {isLoading && (
                        <div className="py-12 flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="h-12 w-12 text-primary animate-spin" />
                            <p className="text-sm text-muted-foreground">Gerando cobrança Pix...</p>
                        </div>
                    )}

                    {/* QR Code e Código Pix */}
                    {!isLoading && payment && (
                        <>
                            {/* QR Code */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-center">
                                    <div className="bg-white p-3 sm:p-4 rounded-2xl border-2 border-primary/10 shadow-inner">
                                        <img
                                            src={`data:image/png;base64,${payment.pix_qr_code}`}
                                            alt="QR Code Pix"
                                            className="w-48 h-48 sm:w-64 sm:h-64"
                                        />
                                    </div>
                                </div>
                                <p className="text-center text-xs sm:text-sm text-muted-foreground font-medium">
                                    Aponte a câmera para o QR Code
                                </p>
                            </div>

                            {/* Código Pix Copia e Cola */}
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Link PIX para copiar</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 p-3 bg-muted/50 rounded-xl font-mono text-[10px] sm:text-xs break-all border border-border/50 line-clamp-2">
                                        {payment.pix_copy_paste}
                                    </div>
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        onClick={handleCopyPixCode}
                                        className="shrink-0 h-11 w-11 sm:h-12 sm:w-12 rounded-xl"
                                    >
                                        <Copy className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Informações */}
                            <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/10 rounded-xl">
                                <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-bold text-foreground">Liberação instantânea</p>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Sua vaga será confirmada assim que o pagamento for detectado.
                                    </p>
                                </div>
                            </div>

                            {/* Botão Actions */}
                            <div className="pt-2 space-y-4">
                                <Button className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20" disabled>
                                    <CheckCircle2 className="h-5 w-5 mr-2" />
                                    Pagamento em processamento
                                </Button>
                                <div className="flex items-center justify-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                    <p className="text-xs text-muted-foreground font-medium">
                                        Aguardando confirmação automática...
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Erro */}
                    {!isLoading && !payment && (
                        <div className="py-8 flex flex-col items-center space-y-4">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="h-8 w-8 text-red-600" />
                            </div>
                            <p className="text-sm text-muted-foreground text-center">
                                Não foi possível gerar a cobrança.
                                <br />
                                Tente novamente ou entre em contato com o suporte.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => window.location.reload()}
                            >
                                Tentar Novamente
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
