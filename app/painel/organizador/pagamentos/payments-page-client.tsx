"use client"

import * as React from "react"
import { useActionState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreditCard, CheckCircle2, AlertCircle } from "lucide-react"
import { getOrganizerAsaasCredentialsAction, saveOrganizerAsaasCredentialsAction } from "@/app/actions/asaas"
import { toast } from "sonner"

const initialState = {
    error: undefined,
    success: undefined,
    message: undefined
}

export function PaymentsPageClient() {
    const [credentials, setCredentials] = React.useState<{
        hasApiKey: boolean
        apiKeyLast4: string | null
        environment: 'sandbox' | 'production'
        is_active: boolean
    } | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)
    const [environment, setEnvironment] = React.useState<'sandbox' | 'production'>('sandbox')
    const [isActive, setIsActive] = React.useState(true)
    const [state, formAction] = useActionState(saveOrganizerAsaasCredentialsAction, initialState)

    // Carregar credenciais existentes
    React.useEffect(() => {
        async function loadCredentials() {
            try {
                const data = await getOrganizerAsaasCredentialsAction()
                setCredentials(data)
                if (data) {
                    setEnvironment(data.environment)
                    setIsActive(data.is_active)
                }
            } catch (error) {
                console.error('Erro ao carregar credenciais:', error)
                toast.error('Erro ao carregar credenciais')
            } finally {
                setIsLoading(false)
            }
        }
        loadCredentials()
    }, [])

    // Exibir toast quando houver resposta da action
    React.useEffect(() => {
        if (state.success) {
            toast.success(state.message || 'Credenciais salvas com sucesso!')
            // Recarregar credenciais para atualizar status
            getOrganizerAsaasCredentialsAction().then(data => {
                setCredentials(data)
                if (data) {
                    setEnvironment(data.environment)
                    setIsActive(data.is_active)
                }
            })
        } else if (state.error) {
            toast.error(state.error)
        }
    }, [state])

    return (
        <div className="space-y-8">
            {/* Cabeçalho */}
            <div className="border-b pb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="h-12 w-12 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                            Integração de Pagamentos
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                            Configure sua conta Asaas para receber pagamentos via Pix
                        </p>
                    </div>
                </div>
            </div>

            {/* Formulário */}
            <div className="max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle>Credenciais Asaas</CardTitle>
                        <CardDescription>
                            Configure sua API Key do Asaas para habilitar pagamentos via Pix nos seus eventos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                Carregando configurações...
                            </div>
                        ) : (
                            <form action={formAction} className="space-y-6">
                                {/* Status da API Key */}
                                {credentials?.hasApiKey && (
                                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <span className="text-sm text-green-700">
                                            Chave cadastrada
                                            {credentials.apiKeyLast4 && ` (termina em ****${credentials.apiKeyLast4})`}
                                        </span>
                                    </div>
                                )}

                                {/* API Key */}
                                <div className="space-y-2">
                                    <Label htmlFor="api_key">
                                        API Key do Asaas
                                        {credentials?.hasApiKey && (
                                            <span className="text-xs text-muted-foreground ml-2">
                                                (deixe em branco para manter a chave atual)
                                            </span>
                                        )}
                                    </Label>
                                    <Input
                                        id="api_key"
                                        name="api_key"
                                        type="password"
                                        placeholder={credentials?.hasApiKey ? "Digite uma nova chave para substituir" : "Digite sua API Key do Asaas"}
                                        className="font-mono"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Obtenha sua API Key no painel do Asaas em Configurações → Integrações
                                    </p>
                                </div>

                                {/* Ambiente */}
                                <div className="space-y-2">
                                    <Label htmlFor="environment">Ambiente</Label>
                                    <Select
                                        name="environment"
                                        value={environment}
                                        onValueChange={(val) => setEnvironment(val as 'sandbox' | 'production')}
                                    >
                                        <SelectTrigger id="environment">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sandbox">Sandbox (Testes)</SelectItem>
                                            <SelectItem value="production">Produção</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Use Sandbox para testes e Produção para pagamentos reais
                                    </p>
                                </div>

                                {/* Status */}
                                <div className="space-y-2">
                                    <Label htmlFor="is_active">Status da Integração</Label>
                                    <Select
                                        name="is_active"
                                        value={isActive ? '1' : '0'}
                                        onValueChange={(val) => setIsActive(val === '1')}
                                    >
                                        <SelectTrigger id="is_active">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Ativo</SelectItem>
                                            <SelectItem value="0">Inativo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        Defina como Inativo para desabilitar temporariamente a integração
                                    </p>
                                </div>

                                {/* Botão */}
                                <div className="flex items-center justify-between pt-4 border-t">
                                    <div className="text-xs text-muted-foreground">
                                        {credentials?.hasApiKey ? (
                                            <span className="flex items-center gap-1.5">
                                                <AlertCircle className="h-3.5 w-3.5" />
                                                Última atualização configurada
                                            </span>
                                        ) : (
                                            <span>Configure sua primeira integração</span>
                                        )}
                                    </div>
                                    <Button type="submit">
                                        {credentials?.hasApiKey ? 'Atualizar Configurações' : 'Salvar Configurações'}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>

                {/* Informações Adicionais */}
                <Card className="mt-6 bg-muted/30">
                    <CardHeader>
                        <CardTitle className="text-base">Sobre esta Integração</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-2">
                        <p>
                            • Esta configuração permite que você receba pagamentos via Pix usando a plataforma Asaas.
                        </p>
                        <p>
                            • Cada organizador configura suas próprias credenciais de forma independente.
                        </p>
                        <p>
                            • Os pagamentos dos atletas serão creditados diretamente na sua conta Asaas.
                        </p>
                        <p>
                            • Use o ambiente Sandbox para testar a integração antes de ativar em Produção.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
