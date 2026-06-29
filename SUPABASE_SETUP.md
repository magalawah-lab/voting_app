# Supabase Setup Guide

Follow these steps to set up your Supabase database for the voting app:

## Step 1: Open Supabase SQL Editor
1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **"SQL Editor"** in the left sidebar
4. Click **"New Query"** to create a new query

## Step 2: Run the Schema Script
1. Copy the entire content of `database/schema.sql`
2. Paste it into the SQL Editor
3. Click **"Run"** to execute the query
4. This will create all the necessary tables and indexes

## Step 3: Disable Row Level Security (IMPORTANT!)
1. Copy the entire content of `database/rls-setup.sql`
2. Paste it into a new SQL Editor query
3. Click **"Run"** to execute the query
4. This will disable RLS so the app can access your tables (for testing)

## Step 4: Run the Seed Script (Optional)
If you want to test with sample data:
1. Copy the entire content of `database/seed.sql`
2. Paste it into a new SQL Editor query
3. Click **"Run"** to execute the query
4. This will add sample classes, students, and candidates

## Step 5: Verify the Tables
Go to **"Table Editor"** in the left sidebar of your Supabase dashboard and verify you have these tables:
- `classes`
- `students`
- `candidates`
- `votes`

## Testing the App
Once your database is set up:
1. Open your browser and go to `http://localhost:3000`
2. Go to Admin Panel → Manage Classes to add classes
3. Go to Admin Panel → Manage Students to add students
4. Go to Admin Panel → Manage Candidates to add candidates
5. Go to Login and use a student ID to log in and vote!

## What to do if you still have issues?
1. Check the error messages on the admin pages - they now show the actual Supabase error!
2. Check your browser's console for more details (F12)
