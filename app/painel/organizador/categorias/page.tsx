import { getCurrentUser } from "@/app/actions/user"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CategoriesClient } from "@/components/categories-client"
import { getBeltsAction } from "@/app/actions/belts"
import { getAgeGroupsAction } from "@/app/actions/age-groups"

async function getCategories(userId: string) {
    const supabase = await createClient()

    const { data: categories, error } = await supabase
        .from('categories')
        .select(`
            *,
            registrations(status)
        `)
        .eq('organizer_id', userId)
        .order('belt')
        .order('min_weight')

    if (error) {
        console.error('Erro ao buscar categorias:', error)
        return []
    }

    return categories || []
}

export default async function CategoriasPage() {
    const user = await getCurrentUser()

    if (!user || user.role !== 'organizador') {
        redirect('/login')
    }

    const categories = await getCategories(user.id)
    const belts = await getBeltsAction()
    const ageGroups = await getAgeGroupsAction()

    return (
        <CategoriesClient
            initialCategories={categories}
            belts={belts}
            ageGroups={ageGroups}
        />
    )
}
