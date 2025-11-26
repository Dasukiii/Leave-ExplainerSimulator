/*
  # Add User-Specific Policy Support

  1. Changes to Tables
    - Add `user_profile_id` column to `policies` table
      - NULL = default policy (available to all users)
      - UUID = user-specific policy (only for that user)
    - Add index for better query performance
  
  2. Behavior
    - Default policies (user_profile_id = NULL) are shared across all users
    - User-specific policies override defaults for that user
    - When user uploads PDF, policies are created with their user_profile_id
    - Users without custom policies see default Malaysia Leave Policies
  
  3. Notes
    - Existing policies will remain as defaults (NULL user_profile_id)
    - No data loss
    - Backward compatible
*/

-- Add user_profile_id column to policies table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'policies' AND column_name = 'user_profile_id'
  ) THEN
    ALTER TABLE policies ADD COLUMN user_profile_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_policies_user_profile_id ON policies(user_profile_id);

-- Add a comment to document the behavior
COMMENT ON COLUMN policies.user_profile_id IS 'NULL for default policies available to all users, UUID for user-specific policies';
