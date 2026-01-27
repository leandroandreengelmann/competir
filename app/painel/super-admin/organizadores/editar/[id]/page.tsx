import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/app/actions/user'
import EditOrganizerClient from './edit-client'

type PageProps = {
    params: Promise<{
        id: string
    }>
}

export default async function EditOrganizerPage({ params }: PageProps) {
    const user = await getCurrentUser()

    // Security: Only super_admin can access
    if (!user || user.role !== 'super_admin') {
        redirect('/login')
    }

    const { id } = await params

    const supabase = await createClient()

    // Fetch organizer data
    const { data: organizer } = await supabase
        .from('profiles')
        .select('id, name, email, role')
        .eq('id', id)
        .eq('role', 'organizador')
        .single()

    if (!organizer) {
        redirect('/painel/super-admin/organizadores')
    }

    return <EditOrganizerClient organizerData={organizer} />
}
