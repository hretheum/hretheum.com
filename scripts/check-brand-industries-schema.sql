-- Check actual columns in brand_industries table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'brand_industries' 
AND table_schema = 'public'
ORDER BY ordinal_position;
