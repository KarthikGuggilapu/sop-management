-- Create user_step_progress table to track step completion
CREATE TABLE public.user_step_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    sop_id uuid REFERENCES public.sops(id) ON DELETE CASCADE,
    step_id uuid REFERENCES public.sop_steps(id) ON DELETE CASCADE,
    completed boolean DEFAULT false,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, step_id)
);

-- Enable RLS
ALTER TABLE public.user_step_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own progress"
    ON public.user_step_progress
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER set_user_step_progress_updated_at
    BEFORE UPDATE ON public.user_step_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();