-- Authentication Setup Script
-- NOTE: First, create an admin user in Supabase Auth UI with email: admin@school.edu

-- Create a simple function to generate random passwords
CREATE OR REPLACE FUNCTION generate_password(length INT DEFAULT 8)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  password TEXT := '';
BEGIN
  IF length < 8 THEN
    length := 8;
  END IF;
  FOR i IN 1..length LOOP
    password := password || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN password;
END;
$$ LANGUAGE plpgsql VOLATILE;
