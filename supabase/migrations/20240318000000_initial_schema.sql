-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS public.sop_steps CASCADE;
DROP TABLE IF EXISTS public.sops CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create ENUM types
CREATE TYPE public.sop_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE public.step_status AS ENUM ('not_started', 'in_progress', 'completed');

-- PROFILES TABLE
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    first_name text,
    last_name text,
    display_name text,
    avatar_url text,
    email text NOT NULL,
    phone text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    location text,
    company text,
    department text,
    title text,
    last_active timestamp with time zone,
    bio text,
    is_active boolean DEFAULT true,
    is_verified boolean DEFAULT false,
    metadata jsonb DEFAULT '{}'::jsonb,
    full_name text,
    notification_preferences jsonb DEFAULT '{"push": true, "email": true}'::jsonb,
    role text DEFAULT 'user'::text,
    language text DEFAULT 'en'::text,
    timezone text
);

-- SOPS (Standard Operating Procedures) TABLE
CREATE TABLE public.sops (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title character varying NOT NULL,
    description text,
    category character varying,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    status public.sop_status DEFAULT 'draft'::public.sop_status
);

-- SOP STEPS TABLE
CREATE TABLE public.sop_steps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sop_id uuid REFERENCES public.sops(id) ON DELETE CASCADE,
    title character varying NOT NULL,
    what text,
    why text,
    how text,
    video_url text,
    order_index integer NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- TAGS TABLE
CREATE TABLE public.tags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name character varying NOT NULL UNIQUE,
    color text DEFAULT '#cccccc'::text
);

-- SOP TAGS (Junction Table) 
CREATE TABLE public.sop_tags (
    sop_id uuid NOT NULL REFERENCES public.sops(id) ON DELETE CASCADE,
    tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (sop_id, tag_id)
);

-- USER STEP PROGRESS TABLE
CREATE TABLE public.user_step_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    step_id uuid REFERENCES public.sop_steps(id) ON DELETE CASCADE,
    status public.step_status DEFAULT 'not_started'::public.step_status,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- USER ACTIVITY TABLE
CREATE TABLE public.user_activity (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type character varying NOT NULL,
    sop_id uuid REFERENCES public.sops(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create indexes for better query performance
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_sops_created_by ON public.sops(created_by);
CREATE INDEX idx_sops_status ON public.sops(status);
CREATE INDEX idx_sop_steps_sop_id ON public.sop_steps(sop_id);
CREATE INDEX idx_sop_steps_order ON public.sop_steps(sop_id, order_index);
CREATE INDEX idx_user_step_progress_user ON public.user_step_progress(user_id);
CREATE INDEX idx_user_step_progress_step ON public.user_step_progress(step_id);
CREATE INDEX idx_user_activity_user ON public.user_activity(user_id);
CREATE INDEX idx_user_activity_sop ON public.user_activity(sop_id);
CREATE INDEX idx_sop_tags_sop ON public.sop_tags(sop_id);
CREATE INDEX idx_sop_tags_tag ON public.sop_tags(tag_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_sops_updated_at
    BEFORE UPDATE ON public.sops
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_sop_steps_updated_at
    BEFORE UPDATE ON public.sop_steps
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_user_step_progress_updated_at
    BEFORE UPDATE ON public.user_step_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sop_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_step_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- SOPs policies
CREATE POLICY "Users can view all published SOPs"
    ON public.sops FOR SELECT
    USING (status = 'published' OR created_by = auth.uid());

CREATE POLICY "Users can create SOPs"
    ON public.sops FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own SOPs"
    ON public.sops FOR UPDATE
    USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own SOPs"
    ON public.sops FOR DELETE
    USING (created_by = auth.uid());

-- SOP Steps policies
CREATE POLICY "Users can view steps of visible SOPs"
    ON public.sop_steps FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.sops
            WHERE sops.id = sop_steps.sop_id
            AND (sops.status = 'published' OR sops.created_by = auth.uid())
        )
    );

CREATE POLICY "Users can modify steps of their SOPs"
    ON public.sop_steps FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.sops
            WHERE sops.id = sop_steps.sop_id
            AND sops.created_by = auth.uid()
        )
    );

-- Tags policies
CREATE POLICY "Everyone can view tags"
    ON public.tags FOR SELECT
    USING (true);

CREATE POLICY "Users can create tags"
    ON public.tags FOR INSERT
    WITH CHECK (true);

-- SOP Tags policies
CREATE POLICY "Everyone can view SOP tags"
    ON public.sop_tags FOR SELECT
    USING (true);

CREATE POLICY "Users can modify tags of their SOPs"
    ON public.sop_tags FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.sops
            WHERE sops.id = sop_tags.sop_id
            AND sops.created_by = auth.uid()
        )
    );

-- User Step Progress policies
CREATE POLICY "Users can view their own progress"
    ON public.user_step_progress FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own progress"
    ON public.user_step_progress FOR ALL
    USING (user_id = auth.uid());

-- User Activity policies
CREATE POLICY "Users can view activity on accessible SOPs"
    ON public.user_activity FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.sops
            WHERE sops.id = user_activity.sop_id
            AND (sops.status = 'published' OR sops.created_by = auth.uid())
        )
    );

CREATE POLICY "System can create activity records"
    ON public.user_activity FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Add comment for documentation
COMMENT ON SCHEMA public IS 'Schema for SOP Management System';

-- Create sop_step_completions table
CREATE TABLE public.sop_step_completions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    step_id uuid REFERENCES public.sop_steps(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    completed_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create indexes
CREATE INDEX idx_sop_step_completions_step ON public.sop_step_completions(step_id);
CREATE INDEX idx_sop_step_completions_user ON public.sop_step_completions(user_id);

-- Enable RLS
ALTER TABLE public.sop_step_completions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own completions"
    ON public.sop_step_completions
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid());


