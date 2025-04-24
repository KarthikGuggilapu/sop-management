import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ProfilePage from './page'

export default async function ProfileLayout() {
  const supabase = await createClient()

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect('/login')
  }

  // Get the user's profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) {
    throw new Error('Failed to fetch profile')
  }

  return <ProfilePage profile={profile} />
}