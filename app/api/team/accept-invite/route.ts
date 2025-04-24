import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get token and email from request body
    const { token, email } = await request.json()

    // Verify the invitation exists and is valid
    const { data: invite, error: inviteError } = await supabase
      .from('team_invites')
      .select('*')
      .eq('token', token)
      .eq('email', email)
      .eq('status', 'pending')
      .single()

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 400 }
      )
    }

    // Begin transaction
    const { error: transactionError } = await supabase.rpc('accept_team_invitation', {
      p_token: token,
      p_user_id: user.id,
      p_email: email
    })

    if (transactionError) {
      throw transactionError
    }

    return NextResponse.json({
      message: 'Invitation accepted successfully'
    })

  } catch (error: any) {
    console.error('Accept invite error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to accept invitation' },
      { status: 500 }
    )
  }
}