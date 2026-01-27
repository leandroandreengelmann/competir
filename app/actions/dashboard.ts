"use server"

import { getCurrentUser } from "./user"
import { createClient } from "@/lib/supabase/server"
import { startOfDay, subDays, format } from "date-fns"

export type DashboardMetrics = {
    total: number
    paid: number
    pending: number
    cancelled: number
    totalCents: number
}

export type ChartDataPoint = {
    label: string
    value: number
}

export async function getDashboardMetricsAction(eventId?: string) {
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') {
        throw new Error("Não autorizado")
    }

    const timerLabel = `[Perf] getDashboardMetricsAction - ${eventId}`
    console.time(timerLabel)

    try {
        const supabase = await createClient()

        // Otimização: Query única com JOIN (!inner) filtrando pelo organizador diretamente nas inscrições.
        // Isso remove a necessidade de buscar IDs de eventos em uma query separada.
        let query = supabase
            .from('registrations')
            .select('status, amount_cents, events!inner(organizer_id)')
            .eq('events.organizer_id', user.id)

        if (eventId && eventId !== 'all') {
            query = query.eq('event_id', eventId)
        }

        const { data: registrations, error } = await query

        if (error) {
            console.error('Erro na query de métricas:', error)
            return {
                success: true,
                metrics: { total: 0, paid: 0, pending: 0, cancelled: 0, totalCents: 0 }
            }
        }

        if (!registrations || registrations.length === 0) {
            console.timeEnd(timerLabel)
            return {
                success: true,
                metrics: { total: 0, paid: 0, pending: 0, cancelled: 0, totalCents: 0 }
            }
        }

        // Agregação eficiente em uma única iteração
        const metrics: DashboardMetrics = {
            total: registrations.length,
            paid: 0,
            pending: 0,
            cancelled: 0,
            totalCents: 0
        }

        for (const reg of registrations) {
            if (reg.status === 'paid') {
                metrics.paid++
                metrics.totalCents += reg.amount_cents || 0
            } else if (reg.status === 'pending_payment') {
                metrics.pending++
            } else if (reg.status === 'cancelled') {
                metrics.cancelled++
            }
        }

        console.timeEnd(timerLabel)
        return { success: true, metrics }
    } catch (error) {
        console.error('Erro ao buscar métricas (fallback):', error)
        console.timeEnd(timerLabel)
        return {
            success: true,
            metrics: { total: 0, paid: 0, pending: 0, cancelled: 0, totalCents: 0 }
        }
    }
}

export async function getDashboardChartDataAction(options: {
    eventId?: string
    period: 'dia' | 'semana' | 'mes'
    metric: 'inscricoes' | 'pagas' | 'pendentes'
}) {
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') {
        throw new Error("Não autorizado")
    }

    const { eventId, period, metric } = options
    const timerLabel = `[Perf] getDashboardChartDataAction - ${eventId} - ${period}`
    console.time(timerLabel)

    try {
        const supabase = await createClient()

        // Calcular data limite
        let dateLimit: Date
        let series: { label: string, key: string }[] = []

        if (period === 'dia') {
            dateLimit = startOfDay(new Date())
            for (let i = 0; i < 24; i++) {
                series.push({ label: `${i.toString().padStart(2, '0')}h`, key: i.toString().padStart(2, '0') })
            }
        } else if (period === 'semana') {
            dateLimit = startOfDay(subDays(new Date(), 6))
            const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
            for (let i = 6; i >= 0; i--) {
                const date = subDays(new Date(), i)
                series.push({ label: weekdays[date.getDay()], key: format(date, 'yyyy-MM-dd') })
            }
        } else {
            dateLimit = startOfDay(subDays(new Date(), 29))
            for (let i = 29; i >= 0; i--) {
                const date = subDays(new Date(), i)
                series.push({ label: format(date, 'dd/MM'), key: format(date, 'yyyy-MM-dd') })
            }
        }

        // Otimização: Query única com JOIN (!inner)
        let query = supabase
            .from('registrations')
            .select('created_at, status, events!inner(organizer_id)')
            .eq('events.organizer_id', user.id)
            .gte('created_at', dateLimit.toISOString())

        if (eventId && eventId !== 'all') {
            query = query.eq('event_id', eventId)
        }

        if (metric === 'pagas') {
            query = query.eq('status', 'paid')
        } else if (metric === 'pendentes') {
            query = query.eq('status', 'pending_payment')
        }

        const { data: registrations, error } = await query

        if (error) {
            console.error('Erro na query de gráfico:', error)
            return { success: true, data: [] }
        }

        // Agrupar por período
        const counts: Record<string, number> = {}

        for (const reg of registrations || []) {
            const date = new Date(reg.created_at)
            let key: string

            if (period === 'dia') {
                key = date.getHours().toString().padStart(2, '0')
            } else {
                key = format(date, 'yyyy-MM-dd')
            }

            counts[key] = (counts[key] || 0) + 1
        }

        const finalSeries = series.map(s => ({
            label: s.label,
            value: counts[s.key] || 0
        }))

        console.timeEnd(timerLabel)
        return { success: true, data: finalSeries }
    } catch (error) {
        console.error('Erro ao buscar dados do gráfico (fallback):', error)
        console.timeEnd(timerLabel)
        return { success: true, data: [] }
    }
}

export async function getOrganizerEventsAction() {
    const user = await getCurrentUser()
    if (!user || user.role !== 'organizador') {
        throw new Error("Não autorizado")
    }

    try {
        const supabase = await createClient()

        const { data: events } = await supabase
            .from('events')
            .select('id, name')
            .eq('organizer_id', user.id)
            .order('date', { ascending: false })

        return { success: true, events: events || [] }
    } catch (error) {
        console.error('Erro ao buscar eventos:', error)
        throw new Error("Erro ao buscar eventos")
    }
}
