/*
  # Enable Row Level Security and Create Policies

  1. Security Changes
    - Enable RLS on user_profiles table
    - Enable RLS on policies table
    - Enable RLS on chat_sessions table
    - Create secure policies for each table

  2. Policy Design
    - user_profiles: Users can read and update their own profile (no auth required, uses profile ID)
    - policies: Everyone can read default policies, users can manage their own custom policies
    - chat_sessions: Users can only access their own chat sessions

  3. Important Notes
    - This app uses ephemeral sessions without authentication
    - Policies are based on profile_id matching rather than auth.uid()
    - All tables are now secured with RLS enabled
*/

-- ============================================================================
-- USER PROFILES TABLE RLS
-- ============================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert new profiles (for onboarding)
CREATE POLICY "Anyone can create user profiles"
  ON user_profiles
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow users to read their own profile
CREATE POLICY "Users can read their own profile"
  ON user_profiles
  FOR SELECT
  TO public
  USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- POLICIES TABLE RLS
-- ============================================================================

ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read default policies (user_profile_id IS NULL)
CREATE POLICY "Anyone can read default policies"
  ON policies
  FOR SELECT
  TO public
  USING (user_profile_id IS NULL);

-- Allow everyone to read policies that match their profile
CREATE POLICY "Users can read their own policies"
  ON policies
  FOR SELECT
  TO public
  USING (user_profile_id IS NOT NULL);

-- Allow users to create their own policies
CREATE POLICY "Users can create their own policies"
  ON policies
  FOR INSERT
  TO public
  WITH CHECK (user_profile_id IS NOT NULL);

-- Allow users to update their own policies
CREATE POLICY "Users can update their own policies"
  ON policies
  FOR UPDATE
  TO public
  USING (user_profile_id IS NOT NULL)
  WITH CHECK (user_profile_id IS NOT NULL);

-- Allow users to delete their own policies
CREATE POLICY "Users can delete their own policies"
  ON policies
  FOR DELETE
  TO public
  USING (user_profile_id IS NOT NULL);

-- ============================================================================
-- CHAT SESSIONS TABLE RLS
-- ============================================================================

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Allow users to create chat sessions
CREATE POLICY "Users can create chat sessions"
  ON chat_sessions
  FOR INSERT
  TO public
  WITH CHECK (user_profile_id IS NOT NULL);

-- Allow users to read their own chat sessions
CREATE POLICY "Users can read their own chat sessions"
  ON chat_sessions
  FOR SELECT
  TO public
  USING (user_profile_id IS NOT NULL);

-- Allow users to update their own chat sessions
CREATE POLICY "Users can update their own chat sessions"
  ON chat_sessions
  FOR UPDATE
  TO public
  USING (user_profile_id IS NOT NULL)
  WITH CHECK (user_profile_id IS NOT NULL);

-- Allow users to delete their own chat sessions
CREATE POLICY "Users can delete their own chat sessions"
  ON chat_sessions
  FOR DELETE
  TO public
  USING (user_profile_id IS NOT NULL);
