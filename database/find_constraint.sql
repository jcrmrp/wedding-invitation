-- RUN THIS FIRST - Find exact constraint name
SELECT conname as constraint_to_drop
FROM pg_constraint
WHERE conrelid = 'weddings'::regclass::oid
AND pg_get_constraintdef(oid) LIKE '%custom_url%';