/*
  # Complete Database Cleanup

  ## Changes
  This migration removes all application tables and their associated objects:
  
  1. **Dropped Tables**
     - `chat_sessions` - All chat session data
     - `policies` - All policy documents (default and user-specific)
     - `user_profiles` - All user profile data
  
  2. **Cleanup Actions**
     - Drop RLS policies on all tables
     - Drop foreign key constraints
     - Drop all tables in correct order
  
  ## Important Notes
  - This is a destructive operation
  - All data will be permanently deleted
  - App now uses localStorage instead of database
*/

-- Drop tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS policies CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
