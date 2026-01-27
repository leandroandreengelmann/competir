'use server'

import { createClient } from '@/lib/supabase/server'

export async function getCurrentUser() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Buscar dados do perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, email, cpf, role, phone')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    cpf: profile.cpf,
    role: profile.role,
    phone: profile.phone
  }
}
