-- Add branch column to users table for multi-branch support
-- Only applicable to users who work at multiple branches (송기정, 김태현)

ALTER TABLE users
ADD COLUMN IF NOT EXISTS branch TEXT CHECK (branch IN ('본점', '인천'));

-- Set initial branch values for multi-branch users
UPDATE users
SET branch = '인천'
WHERE name IN ('송기정', '김태현');

-- Add comment for documentation
COMMENT ON COLUMN users.branch IS 'Branch location for multi-branch users (본점/인천). Only used for 송기정 and 김태현.';
