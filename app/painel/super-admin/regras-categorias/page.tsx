import { CATEGORY_RULES_DESCRIPTION } from "@/lib/category-rules"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldCheck, Ban, CheckCircle2, AlertCircle } from "lucide-react"

export default function RegrasCategoriasPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Regras de Compatibilidade</h1>
                <p className="text-muted-foreground">
                    Visualização das regras automáticas de Faixa × Categoria aplicadas no sistema.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {CATEGORY_RULES_DESCRIPTION.map((rule, idx) => (
                    <Card key={idx} className="overflow-hidden border-primary/10">
                        <CardHeader className="bg-primary/5 py-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                                {rule.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <h4 className="text-sm font-bold flex items-center gap-2 text-green-600 uppercase tracking-wider">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Permitido
                                </h4>
                                <ul className="space-y-1">
                                    {rule.allowed.map((item, i) => (
                                        <li key={i} className="text-sm text-foreground flex items-start gap-2">
                                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="space-y-2 pt-2 border-t border-dashed">
                                <h4 className="text-sm font-bold flex items-center gap-2 text-destructive uppercase tracking-wider">
                                    <Ban className="h-4 w-4" />
                                    Bloqueado
                                </h4>
                                <ul className="space-y-1">
                                    {rule.blocked.map((item, i) => (
                                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                            <span className="h-1.5 w-1.5 rounded-full bg-destructive/30 mt-1.5 shrink-0" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900">
                <CardContent className="p-4 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-amber-800 dark:text-amber-400">Informação Técnica</p>
                        <p className="text-xs text-amber-700 dark:text-amber-500">
                            Estas regras são aplicadas de forma automatizada tanto no cadastro manual quanto na geração por IA.
                            Qualquer alteração requer modificação no módulo central do sistema.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
