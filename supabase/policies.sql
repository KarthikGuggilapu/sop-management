-- First drop existing policies
DROP POLICY IF EXISTS "Users can create SOPs" ON sops;
DROP POLICY IF EXISTS "Users can view their own SOPs" ON sops;
DROP POLICY IF EXISTS "Users can update their own SOPs" ON sops;
DROP POLICY IF EXISTS "Users can delete their own SOPs" ON sops;

-- Enable RLS
ALTER TABLE sops ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create SOPs"
ON sops FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view their own SOPs"
ON sops FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Users can update their own SOPs"
ON sops FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own SOPs"
ON sops FOR DELETE
TO authenticated
USING (auth.uid() = created_by);
