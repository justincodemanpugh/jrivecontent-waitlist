-- Add usage_rights column to gigs table
-- Stores an array of usage right keys that brands grant to themselves
-- e.g. ["organic_posts", "paid_ads", "whitelisting", "website_use", "email_marketing"]

ALTER TABLE gigs
ADD COLUMN IF NOT EXISTS usage_rights JSONB DEFAULT '["organic_posts"]'::jsonb;

COMMENT ON COLUMN gigs.usage_rights IS 'Array of usage rights keys the brand receives for creator content';
