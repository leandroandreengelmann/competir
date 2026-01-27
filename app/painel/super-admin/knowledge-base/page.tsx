import { listKnowledgeEntriesAction } from "@/app/actions/knowledge-base"
import { KnowledgeBaseClient } from "./knowledge-base-client"

export default async function KnowledgeBasePage() {
    const initialEntries = await listKnowledgeEntriesAction()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Base de Conhecimento do Evento</h1>
                <p className="text-muted-foreground">
                    Gerencie informações e textos que servirão de base para a IA do campeonato.
                </p>
            </div>

            <KnowledgeBaseClient initialEntries={initialEntries} />
        </div>
    )
}
