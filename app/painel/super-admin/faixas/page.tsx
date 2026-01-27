import { getBeltsAction } from "@/app/actions/belts"
import { BeltsClient } from "@/components/belts-client"

export const dynamic = 'force-dynamic'

export default async function FaixasPage() {
    const belts = await getBeltsAction()

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-0">
            <BeltsClient initialBelts={belts} />
        </div>
    )
}
