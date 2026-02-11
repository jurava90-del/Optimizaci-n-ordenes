import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function IndexPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    return redirect('/dashboard')
  }

  return redirect('/login')
}
