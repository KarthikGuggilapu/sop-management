import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: members, error } = await supabase
      .from('team_members')
      .select('id, email, name, role, created_at, status, updated_at')
      .order('created_at', { ascending: false })

    if (error) throw error
    
    return NextResponse.json(members || []) // Ensure we always return an array
  } catch (error) {
    console.error('Error fetching team members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team members' }, 
      { status: 500 }
    )
  }
}

