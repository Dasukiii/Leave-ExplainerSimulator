/*
  # Create Policies and Policy Embeddings Tables

  1. New Tables
    - `policies`
      - `id` (uuid, primary key) - Unique identifier
      - `title` (text) - Policy title
      - `category` (text) - Policy category (Annual, Sick, Parental, etc.)
      - `content` (text) - Full policy text content
      - `section_number` (text) - Section number for reference
      - `last_updated` (timestamptz) - When policy was last updated
      - `file_url` (text) - URL to source PDF file (optional)
      - `is_active` (boolean) - Whether policy is currently active
      - `created_at` (timestamptz) - Creation timestamp

    - `policy_embeddings`
      - `id` (uuid, primary key) - Unique identifier
      - `policy_id` (uuid) - Foreign key to policies table
      - `chunk_text` (text) - Text chunk for embedding
      - `chunk_index` (integer) - Order of chunk in policy
      - `embedding` (vector) - OpenAI embedding vector (1536 dimensions)
      - `metadata` (jsonb) - Additional metadata
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on both tables
    - Public read-only access to policies
    - Policies are managed separately (admin only in production)

  3. Important Notes
    - Vector extension required for similarity search
    - Policies are public and searchable
    - Embeddings support RAG (Retrieval Augmented Generation)
*/

-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create policies table
CREATE TABLE IF NOT EXISTS policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text,
  content text NOT NULL,
  section_number text,
  last_updated timestamptz DEFAULT now(),
  file_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create policy_embeddings table
CREATE TABLE IF NOT EXISTS policy_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid REFERENCES policies(id) ON DELETE CASCADE,
  chunk_text text NOT NULL,
  chunk_index integer,
  embedding vector(1536),
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create index for fast vector similarity search
CREATE INDEX IF NOT EXISTS policy_embeddings_embedding_idx 
  ON policy_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Create index for policy lookups
CREATE INDEX IF NOT EXISTS policies_category_idx ON policies(category);
CREATE INDEX IF NOT EXISTS policies_is_active_idx ON policies(is_active);

-- Enable RLS
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_embeddings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active policies
CREATE POLICY "Anyone can read active policies"
  ON policies
  FOR SELECT
  USING (is_active = true);

-- Allow anyone to read embeddings
CREATE POLICY "Anyone can read embeddings"
  ON policy_embeddings
  FOR SELECT
  USING (true);

-- Create vector search function
CREATE OR REPLACE FUNCTION match_policy_embeddings(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  policy_id uuid,
  policy_title text,
  category text,
  section text,
  chunk_text text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    pe.policy_id,
    p.title as policy_title,
    p.category,
    p.section_number as section,
    pe.chunk_text,
    1 - (pe.embedding <=> query_embedding) as similarity
  FROM policy_embeddings pe
  JOIN policies p ON p.id = pe.policy_id
  WHERE p.is_active = true
    AND 1 - (pe.embedding <=> query_embedding) > match_threshold
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
$$;
