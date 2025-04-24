CREATE OR REPLACE FUNCTION public.accept_team_invitation(
  p_token uuid,
  p_user_id uuid,
  p_email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update invitation status
  UPDATE public.team_invites
  SET status = 'accepted',
      updated_at = NOW()
  WHERE token = p_token
    AND email = p_email
    AND status = 'pending';

  -- Create team member entry
  INSERT INTO public.team_members (
    user_id,
    email,
    role,
    status,
    created_by
  )
  SELECT 
    p_user_id,
    p_email,
    role,
    'active',
    invited_by
  FROM public.team_invites
  WHERE token = p_token
    AND email = p_email;
END;
$$;