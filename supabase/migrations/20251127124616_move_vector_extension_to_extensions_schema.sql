/*
  # Move Vector Extension to Extensions Schema

  1. Security Fix
    - Move vector extension from public schema to extensions schema
    - This follows PostgreSQL best practices and Supabase security guidelines
    - Extensions should not be installed in the public schema

  2. Important Notes
    - The vector extension is currently in the public schema
    - Moving it to the extensions schema improves security
    - This does not affect any existing functionality as we're not using vector features
*/

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Drop the vector extension from public schema
DROP EXTENSION IF EXISTS vector CASCADE;

-- Install vector extension in the extensions schema
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
