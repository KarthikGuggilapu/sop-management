-- Drop existing table if it exists
DROP TABLE IF EXISTS team_members CASCADE;

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    email TEXT NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes
CREATE INDEX idx_team_members_email ON team_members(email);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);

-- Enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view teams they belong to" ON team_members;
DROP POLICY IF EXISTS "Team members can be managed by admins and managers" ON team_members;

-- RLS Policies
CREATE POLICY "Users can view teams they belong to"
    ON team_members
    FOR SELECT
    TO authenticated
    USING (
        email = auth.jwt()->>'email' OR
        created_by = auth.uid() OR
        (SELECT role FROM team_members WHERE email = auth.jwt()->>'email') IN ('admin', 'manager')
    );

CREATE POLICY "Team members can be managed by admins and managers"
    ON team_members
    FOR ALL
    TO authenticated
    USING (
        (SELECT role FROM team_members WHERE email = auth.jwt()->>'email') IN ('admin', 'manager')
    );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_team_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER team_members_updated_at
    BEFORE UPDATE ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_team_members_updated_at();


