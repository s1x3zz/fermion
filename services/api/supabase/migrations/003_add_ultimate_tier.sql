ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_tier_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_tier_check
CHECK (tier IN ('guest', 'free', 'pro', 'ultimate', 'team'));
