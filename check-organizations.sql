-- Find which users belong to the organization that has the R2 files
SELECT id, email, organization_id, role
FROM profiles
WHERE organization_id = '6695b959-45ef-44b4-a68c-9cd0fe0e25a3';

-- Also check what organization avelitch@metexam.co.uk belongs to
SELECT id, email, organization_id, role
FROM profiles
WHERE email = 'avelitch@metexam.co.uk';

-- Show all organizations and their users
SELECT organization_id, COUNT(*) as user_count, STRING_AGG(email, ', ') as users
FROM profiles
GROUP BY organization_id;
