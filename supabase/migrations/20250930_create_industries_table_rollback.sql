-- Rollback for Task 1.7: Industries table creation
-- This script safely removes the industries table and all related objects

-- Drop policies first
DROP POLICY IF EXISTS industries_admin_write_policy ON public.industries;
DROP POLICY IF EXISTS industries_read_policy ON public.industries;

-- Drop trigger
DROP TRIGGER IF EXISTS industries_updated_at_trigger ON public.industries;

-- Drop function
DROP FUNCTION IF EXISTS public.update_industries_updated_at();

-- Drop indexes (will be auto-dropped with table, but explicit for clarity)
DROP INDEX IF EXISTS public.industries_created_at_idx;
DROP INDEX IF EXISTS public.industries_active_idx;
DROP INDEX IF EXISTS public.industries_name_idx;
DROP INDEX IF EXISTS public.industries_slug_idx;

-- Drop table
DROP TABLE IF EXISTS public.industries;

-- Verification query (run after rollback to confirm)
-- SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'industries';
-- Expected result: 0
