"use client"

import * as React from "react"
import { useFormStatus } from "react-dom"
import { saveOpenAIConfigAction, OpenAIConfig, ActionState } from "@/app/actions/system-config"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Key, Save, CheckCircle2, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface OpenAIConfigClientProps {
    initialConfig: OpenAIConfig
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending} className="gap-2">
            {pending ? "Salvando..." : (
                <>
                    <Save className="h-4 w-4" />
                    Salvar Configuração
                </>
            )}
        </Button>
    )
}

export function OpenAIConfigClient({ initialConfig }: OpenAIConfigClientProps) {
    const [config, setConfig] = React.useState<OpenAIConfig>(initialConfig)
    const formRef = React.useRef<HTMLFormElement>(null)

    async function handleSubmit(formData: FormData) {
        const result = await saveOpenAIConfigAction({}, formData)

        if (result.success) {
            toast.success(result.message)
            formRef.current?.reset()
            // Atualizar estado local para mostrar que está configurado
            setConfig({
                isConfigured: true,
                updatedAt: new Date().toISOString()
            })
        } else {
            toast.error(result.error)
        }
    }

    return (
        <Card className="max-w-2xl">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5 text-primary" />
                        Credenciais da API
                    </CardTitle>
                    {config.isConfigured ? (
                        <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200 gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Configurado
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200 gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Não Configurado
                        </Badge>
                    )}
                </div>
                <CardDescription>
                    A chave de API será armazenada de forma criptografada e nunca será exibida após o salvamento.
                </CardDescription>
            </CardHeader>
            <form ref={formRef} action={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="api_key">OpenAI API Key</Label>
                        <Input
                            id="api_key"
                            name="api_key"
                            type="password"
                            placeholder="sk-..."
                            required
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Insira sua chave secreta da OpenAI. Mantenha esta informação protegida.
                        </p>
                    </div>

                    {config.isConfigured && config.updatedAt && (
                        <div className="text-xs text-muted-foreground pt-2">
                            Última atualização: {new Date(config.updatedAt).toLocaleString('pt-BR')}
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <SubmitButton />
                </CardFooter>
            </form>
        </Card>
    )
}
