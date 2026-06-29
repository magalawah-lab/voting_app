-- Row Level Security (RLS) Setup for Voting App
-- NOTE: For testing purposes, we're disabling RLS.
-- For production, you should create proper policies!

-- Disable RLS on all tables for testing
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE candidates DISABLE ROW LEVEL SECURITY;
ALTER TABLE votes DISABLE ROW LEVEL SECURITY;

-- Alternatively, if you want to enable RLS with permissive policies (for testing):
-- Enable RLS first
-- ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE students ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations
-- CREATE POLICY "Enable all operations for all users" ON classes FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Enable all operations for all users" ON students FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Enable all operations for all users" ON candidates FOR ALL USING (true) WITH CHECK (true);
-- CREATE POLICY "Enable all operations for all users" ON votes FOR ALL USING (true) WITH CHECK (true);
