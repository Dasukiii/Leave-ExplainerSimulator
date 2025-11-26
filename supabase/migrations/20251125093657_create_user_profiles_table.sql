/*
  # Create User Profiles Table

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key) - Unique identifier
      - `name` (text) - User's name (optional)
      - `hire_date` (date) - When user joined the company
      - `employment_type` (text) - Full-time, Part-time, or Contract
      - `annual_leave_taken` (integer) - Days of annual leave taken
      - `sick_leave_taken` (integer) - Days of sick leave taken
      - `created_at` (timestamptz) - Profile creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `user_profiles` table
    - Public read/write access (no authentication required)
    - Anyone can create, read, update their profile

  3. Important Notes
    - Designed for single-user or demo usage
    - No authentication required
    - Simple profile management
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  hire_date date NOT NULL,
  employment_type text NOT NULL CHECK (employment_type IN ('Full-time', 'Part-time', 'Contract')),
  annual_leave_taken integer DEFAULT 0 CHECK (annual_leave_taken >= 0),
  sick_leave_taken integer DEFAULT 0 CHECK (sick_leave_taken >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read profiles (public demo app)
CREATE POLICY "Anyone can read profiles"
  ON user_profiles
  FOR SELECT
  USING (true);

-- Allow anyone to insert profiles
CREATE POLICY "Anyone can insert profiles"
  ON user_profiles
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update profiles
CREATE POLICY "Anyone can update profiles"
  ON user_profiles
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow anyone to delete profiles
CREATE POLICY "Anyone can delete profiles"
  ON user_profiles
  FOR DELETE
  USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at on changes
DROP TRIGGER IF EXISTS user_profiles_updated_at_trigger ON user_profiles;
CREATE TRIGGER user_profiles_updated_at_trigger
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();
