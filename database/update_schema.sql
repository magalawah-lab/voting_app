-- Safe schema update to add election functionality to existing database

-- 1. Add elections table
CREATE TABLE IF NOT EXISTS elections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add election_id column to candidates
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS election_id UUID REFERENCES elections(id) ON DELETE CASCADE;

-- 3. Add election_id column to votes
ALTER TABLE votes 
ADD COLUMN IF NOT EXISTS election_id UUID REFERENCES elections(id) ON DELETE CASCADE;

-- 4. Update the unique constraint on votes
-- First, drop the old constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'votes_student_id_position_key'
  ) THEN
    ALTER TABLE votes DROP CONSTRAINT votes_student_id_position_key;
  END IF;
END$$;

-- Then add the new unique constraint that includes election_id
ALTER TABLE votes 
ADD CONSTRAINT votes_election_id_student_id_position_key 
UNIQUE (election_id, student_id, position);

-- 5. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_candidates_election_id ON candidates(election_id);
CREATE INDEX IF NOT EXISTS idx_votes_election_id ON votes(election_id);
