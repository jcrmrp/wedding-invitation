-- SCRIPT 1: CHECK CONSTRAINTS
-- Run this first to see what exists
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'weddings'::regclass::oid 
AND pg_get_constraintdef(oid) LIKE '%custom_url%';