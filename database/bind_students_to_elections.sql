-- Bind students to elections
-- 1. Add election_id column to students table with ON DELETE CASCADE
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS election_id UUID REFERENCES elections(id) ON DELETE CASCADE;

-- 2. Create an index for performance
CREATE INDEX IF NOT EXISTS idx_students_election_id ON students(election_id);