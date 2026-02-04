-- PowerSync Initialization Script
-- Run this on tenant database after creation

-- Create publication if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'powersync') THEN
        CREATE PUBLICATION powersync FOR ALL TABLES;
        RAISE NOTICE 'Publication powersync created';
    ELSE
        RAISE NOTICE 'Publication powersync already exists';
    END IF;
END
$$;
