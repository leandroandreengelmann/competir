import { getAgeGroupsAction } from "@/app/actions/age-groups"
import { AgeGroupsClient } from "@/components/age-groups-client"

export const dynamic = 'force-dynamic'

export default async function FaixasEtariasPage() {
    const ageGroups = await getAgeGroupsAction()

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-0">
            <AgeGroupsClient initialAgeGroups={ageGroups} />
        </div>
    )
}
