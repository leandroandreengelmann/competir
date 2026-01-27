import { getLoginBackgroundAction } from "@/app/actions/system-config"
import { LoginConfigClient } from "./login-config-client"

export default async function LoginBackgroundPage() {
    const config = await getLoginBackgroundAction()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Background do Login</h1>
                <p className="text-muted-foreground">
                    Gerencie as imagens de fundo que aparecem na página de autenticação.
                    Recomendado usar imagens de alta qualidade para Desktop e Mobile.
                </p>
            </div>

            <LoginConfigClient initialConfig={config} />
        </div>
    )
}
