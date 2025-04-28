import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import crypto from 'crypto'

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
    if (userError || !currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if Resend is properly configured

    if (!resend) {
      console.error('Resend API key is not configured');
      return NextResponse.json(
        { error: 'Email service is not configured' },
        { status: 500 }
      );
    }
    

    const { email, role: inviteRole } = await request.json();

    // Create the invitation in the database
    const { data: invite, error: inviteError } = await supabase
      .from('team_invites')
      .insert({
        email,
        role: inviteRole,
        invited_by: currentUser.id,
        status: 'pending',
        token: crypto.randomUUID()
      })
      .select()
      .single()

    if (inviteError || !invite) {
      throw new Error('Failed to create invitation')
    }

    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/signup?token=${invite.token}&email=${encodeURIComponent(email)}`;
    
    try {
      await resend.emails.send({
        from: 'Team Invites <onboarding@resend.dev>',
        to: email,
        subject: 'You\'ve been invited to join the team',
        html: `
          <h2>Team Invitation</h2>
          <p>Hello,</p>
          <p>${currentUser?.user_metadata?.first_name || 'Someone'} ${currentUser?.user_metadata?.last_name || ''} has invited you to join their team.</p>
          <p>You've been invited as a <strong>${inviteRole}</strong>.</p>
          <p>Click the link below to accept the invitation and create your account:</p>
          <p><a href="${inviteUrl}">Accept Invitation</a></p>
          <p>This invitation link will expire in 7 days.</p>
          <p>If you don't want to accept this invitation, you can ignore this email.</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send invitation email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Invitation sent successfully',
      data: invite
    });

  } catch (error: any) {
    console.error('Team invite error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create invite' },
      { status: 500 }
    );
  }
}







