/*
  # Remove Unused Policy Chunks and Embeddings Tables

  1. Changes
    - Drop policy_embeddings table (not used in current app flow)
    - Drop policy_chunks table (not used in current app flow)
    - Remove related indexes that are no longer needed
    - These tables were created for RAG functionality that is not currently implemented

  2. Impact
    - No data loss impact as these tables are empty and unused
    - Foreign key constraints from policies table will be automatically cleaned up
    - Current app functionality remains unchanged (only uses policies table directly)

  3. Affected Tables
    - policy_embeddings (DROPPED)
    - policy_chunks (DROPPED)

  4. Important Notes
    - This does NOT affect the main policies table which is actively used
    - The policies table continues to function normally with text_doc column
    - All current app features (policy library, chat, etc.) continue to work
*/

-- Drop policy_embeddings first (has foreign key to policy_chunks)
DROP TABLE IF EXISTS policy_embeddings CASCADE;

-- Drop policy_chunks next (has foreign key to policies)
DROP TABLE IF EXISTS policy_chunks CASCADE;

-- Remove indexes that are no longer needed (they may already be dropped with CASCADE)
DROP INDEX IF EXISTS idx_policy_chunks_policy_id;
DROP INDEX IF EXISTS idx_policy_embeddings_chunk_id;
