-- DANGER: This script will delete data. Use with caution.
-- Execute this in the Supabase SQL Editor.

-- 1. Clean up "purchases" table (Child table first)
TRUNCATE TABLE public.purchases CASCADE;

-- 2. Clean up "User" table
-- Preserves the user with specific email if needed, or you can truncate all.
-- REPLACE 'your-admin-email@example.com' with your actual admin email to prevent locking yourself out.

-- DELETE FROM public."User" WHERE email != 'your-admin-email@example.com';

-- IF you want to wipe EVERYTHING (including your admin account from public table):
TRUNCATE TABLE public."User" CASCADE;

-- Note: This does NOT delete users from 'auth.users'. 
-- To fully wipe, you usually need to delete from auth.users, but that requires higher privileges or UI.
-- Deleting from public.User is sufficient for "Application Data".
