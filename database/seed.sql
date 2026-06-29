-- Insert sample classes
INSERT INTO classes (name) VALUES 
  ('10A'),
  ('10B'),
  ('11A'),
  ('11B');

-- Insert sample students with passwords
INSERT INTO students (student_id, first_name, last_name, class_id, password)
SELECT 
  'S' || LPAD(CAST(ROW_NUMBER() OVER () AS TEXT), 4, '0') AS student_id,
  first_name,
  last_name,
  (SELECT id FROM classes ORDER BY random() LIMIT 1) AS class_id,
  'password123' AS password
FROM (
  VALUES
    ('John', 'Doe'),
    ('Jane', 'Smith'),
    ('Mike', 'Johnson'),
    ('Sarah', 'Williams'),
    ('David', 'Brown'),
    ('Emily', 'Davis'),
    ('Chris', 'Miller'),
    ('Amanda', 'Wilson'),
    ('James', 'Moore'),
    ('Jessica', 'Taylor')
) AS names(first_name, last_name);

-- Insert sample candidates
INSERT INTO candidates (name, position, manifesto) VALUES 
  ('Alex Thompson', 'School President', 'I will work hard to improve our school facilities and organize more events!'),
  ('Maria Garcia', 'School President', 'My focus is on better communication between students and teachers.'),
  ('David Chen', 'Vice President', 'Let''s make our lunch breaks more fun with new activities!'),
  ('Sophia Robinson', 'Vice President', 'I will push for longer library hours and more books.'),
  ('James Lee', 'Treasurer', 'I will manage our funds responsibly and be transparent.'),
  ('Olivia Martinez', 'Secretary', 'I will keep accurate records and communicate clearly with everyone.');
