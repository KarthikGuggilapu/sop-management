import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Verify the current user has permission to invite
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the request body
    const { email, role } = await request.json()

    // Validate input
    if (!email || !role || !['admin', 'manager', 'user'].includes(role)) {
      return NextResponse.json(
        { error: 'Valid email and role (admin, manager, or user) are required' },
        { status: 400 }
      )
    }

    // Check if user is already a team member
    const { data: existingMember, error: memberError } = await supabase
      .from('team_members')
      .select('id')
      .eq('email', email)
      .single()

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a team member' },
        { status: 400 }
      )
    }

    // Check for existing pending invite
    const { data: existingInvite, error: inviteError } = await supabase
      .from('team_invites')
      .select('id, status')
      .eq('email', email)
      .eq('status', 'pending')
      .single()

    if (existingInvite) {
      return NextResponse.json(
        { error: 'An invitation is already pending for this email' },
        { status: 400 }
      )
    }

    // Create the invite - token will be auto-generated
    const { data: invite, error: createError } = await supabase
      .from('team_invites')
      .insert([
        {
          email,
          role,
          invited_by: user.id,
          status: 'pending'
        }
      ])
      .select()
      .single()

    if (createError) {
      console.error('Error creating invite:', createError)
      throw createError
    }

    // Get inviter's name
    const { data: inviter } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single()

    // Send invitation email
    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/signup?token=${invite.token}&email=${encodeURIComponent(email)}`
    
    await resend.emails.send({
      from: 'Team Invites <onboarding@resend.dev>',
      to: email,
      subject: 'You\'ve been invited to join the team',
      html: `
        <h2>Team Invitation</h2>
        <p>Hello,</p>
        <p>${inviter?.first_name} ${inviter?.last_name} has invited you to join their team.</p>
        <p>You've been invited as a <strong>${role}</strong>.</p>
        <p>Click the link below to accept the invitation and create your account:</p>
        <p><a href="${inviteUrl}">Accept Invitation</a></p>
        <p>This invitation link will expire in 7 days.</p>
        <p>If you don't want to accept this invitation, you can ignore this email.</p>
      `
    })

    return NextResponse.json({
      message: 'Invitation sent successfully',
      data: invite
    })

  } catch (error: any) {
    console.error('Team invite error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create invite' },
      { status: 500 }
    )
  }
}







