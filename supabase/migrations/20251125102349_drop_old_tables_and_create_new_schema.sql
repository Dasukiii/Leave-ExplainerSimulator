/*
  # Drop Old Tables and Create New Schema

  1. Drop Existing Tables
    - Drop policy_embeddings (has foreign key to policies)
    - Drop policies
    - Drop user_profiles (old schema)
    - Drop secrets (not needed in new schema)

  2. Create New Tables (Exact Schema)
    - user_profiles (ephemeral sessions, no auth)
    - policies (raw policy documents)
    - policy_chunks (chunked text for RAG)
    - policy_embeddings (vector embeddings)
    - chat_sessions (optional chat history)

  3. Security
    - No RLS needed per requirements
    - Public read/write access for demo app

  4. Important Notes
    - This migration drops all existing data
    - New schema matches exact specification
    - Supports ephemeral sessions without authentication
*/

-- Drop old tables in correct order (respect foreign keys)
DROP TABLE IF EXISTS policy_embeddings CASCADE;
DROP TABLE IF EXISTS policies CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS secrets CASCADE;

-- Drop old functions if they exist
DROP FUNCTION IF EXISTS match_policy_embeddings CASCADE;
DROP FUNCTION IF EXISTS update_secrets_updated_at CASCADE;
DROP FUNCTION IF EXISTS update_user_profiles_updated_at CASCADE;

-- Create user_profiles table (ephemeral sessions, no login)
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  hire_date date,
  employment_type text,
  leave_balances jsonb DEFAULT '{}'::jsonb,
  leaves_taken jsonb DEFAULT '[]'::jsonb,
  uploaded_policy_url text,
  created_at timestamptz DEFAULT now()
);

-- Create policies table (raw policies)
CREATE TABLE policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  category text,
  text_doc text,
  source_url text,
  updated_at timestamptz DEFAULT now()
);

-- Create policy_chunks table (for RAG)
CREATE TABLE policy_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid REFERENCES policies(id) ON DELETE CASCADE,
  chunk_index int,
  chunk_text text,
  chunk_tokens int,
  created_at timestamptz DEFAULT now()
);

-- Create policy_embeddings table (vector metadata for retrieval)
CREATE TABLE policy_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id uuid REFERENCES policy_chunks(id) ON DELETE CASCADE,
  embedding vector,
  similarity_score float,
  created_at timestamptz DEFAULT now()
);

-- Create chat_sessions table (optional)
CREATE TABLE chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid REFERENCES user_profiles(id),
  session_label text,
  messages jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_policy_chunks_policy_id ON policy_chunks(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_embeddings_chunk_id ON policy_embeddings(chunk_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_profile_id ON chat_sessions(user_profile_id);

-- Insert sample policies with new schema
INSERT INTO policies (title, category, text_doc, source_url) VALUES
(
  'Annual Leave Entitlement',
  'Annual Leave',
  'Full-time employees are entitled to 18 days of paid annual leave per calendar year. Leave accrues at a rate of 1.5 days per month worked. Part-time employees receive leave on a pro-rata basis. Employees must provide at least 14 days advance notice for annual leave requests. Annual leave can be carried over up to a maximum of 5 days into the next calendar year. Unused leave beyond the carry-over limit will be forfeited.',
  NULL
),
(
  'Sick Leave Policy',
  'Sick Leave',
  'All employees receive 10 days of paid sick leave annually. Sick leave does not accumulate or carry over to the next year. A medical certificate is required for absences exceeding 2 consecutive working days. Employees must notify their manager as soon as possible, preferably before their scheduled start time. Sick leave can be used for personal illness or to care for an immediate family member.',
  NULL
),
(
  'Parental Leave Eligibility',
  'Parental Leave',
  'Employees with a minimum of 12 months continuous service are eligible for parental leave. Primary caregivers are entitled to 16 weeks of paid parental leave. Secondary caregivers receive 2 weeks of paid leave. Additional unpaid parental leave of up to 6 weeks is available. Employees must provide at least 4 weeks notice before the expected birth or adoption date. Medical documentation or adoption papers are required.',
  NULL
),
(
  'Leave Application Process',
  'General',
  'All leave requests must be submitted to your direct manager for approval. Applications should be made at least 2 weeks in advance for planned leave. Use the company email system to request leave, copying HR. Emergency leave can be approved retroactively with valid supporting documentation. Managers will respond to leave requests within 3 business days. Approved leave will be recorded in the HR system.',
  NULL
),
(
  'Compassionate Leave',
  'Special Leave',
  'Employees are entitled to 3 days of paid compassionate leave in the event of death or serious illness of an immediate family member (spouse, child, parent, sibling). Additional leave may be granted at managements discretion. Employees should notify their manager as soon as possible. Documentation may be required. This leave is separate from annual leave entitlements.',
  NULL
),
(
  'Public Holidays',
  'Public Holiday',
  'The company observes all official public holidays as declared by the government. If a public holiday falls on a weekend, a replacement day off will be provided on the following Monday. Employees required to work on public holidays receive double pay or a replacement day off. Part-time employees receive public holiday pay on a pro-rata basis.',
  NULL
),
(
  'Study Leave',
  'Special Leave',
  'Employees pursuing work-related education may apply for study leave. Up to 5 days per year may be granted for exam preparation or attendance. Applications must be submitted at least 1 month in advance. Proof of enrollment and course relevance is required. Study leave is separate from annual leave. Approval is subject to operational requirements and managements discretion.',
  NULL
),
(
  'Unpaid Leave',
  'Unpaid Leave',
  'Unpaid leave may be granted in exceptional circumstances when all paid leave has been exhausted. Requests must be submitted to HR with justification. Approval is at managements discretion. Unpaid leave affects salary and may impact benefits accrual. Maximum unpaid leave period is 4 weeks per year unless special circumstances apply. Employee must maintain contact with HR during unpaid leave.',
  NULL
);
