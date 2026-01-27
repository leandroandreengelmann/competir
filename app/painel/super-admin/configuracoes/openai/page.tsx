import { getOpenAIConfigAction } from "@/app/actions/system-config"
import { OpenAIConfigClient } from "./openai-config-client"

export default async function OpenAIConfigPage() {
    const config = await getOpenAIConfigAction()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Configuração OpenAI</h1>
                <p className="text-muted-foreground">
                    Configure a chave de API para habilitar as funções de inteligência artificial do sistema.
                </p>
            </div>

            <OpenAIConfigClient initialConfig={config} />
        </div>
    )
}
