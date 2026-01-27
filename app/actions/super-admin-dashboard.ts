'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from './user'

export async function getSuperAdminMetricsAction() {
    const user = await getCurrentUser()

    if (!user || user.role !== 'super_admin') {
        throw new Error('Não autorizado')
    }

    const adminClient = createAdminClient()
    const today = new Date().toISOString()

    // 1. Total de Usuários
    const { count: totalUsers } = await adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })

    // 2. Total de Organizadores
    const { count: totalOrganizers } = await adminClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'organizador')

    // 3. Total de Eventos (Total)
    const { count: totalEvents } = await adminClient
        .from('events')
        .select('*', { count: 'exact', head: true })

    // 4. Eventos Ativos (date >= hoje)
    const { count: activeEvents } = await adminClient
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('date', today)

    // 5. Eventos Inativos (date < hoje)
    const { count: inactiveEvents } = await adminClient
        .from('events')
        .select('*', { count: 'exact', head: true })
        .lt('date', today)

    return {
        totalUsers: totalUsers || 0,
        totalOrganizers: totalOrganizers || 0,
        totalEvents: totalEvents || 0,
        activeEvents: activeEvents || 0,
        inactiveEvents: inactiveEvents || 0
    }
}
