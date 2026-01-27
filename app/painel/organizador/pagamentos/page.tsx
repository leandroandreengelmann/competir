import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PaymentsPageClient } from './payments-page-client'

export default async function PaymentsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Verificar role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'organizador') {
    redirect('/login')
  }

  return <PaymentsPageClient />
}
