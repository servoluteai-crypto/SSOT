CREATE TABLE section_prompts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id text NOT NULL UNIQUE,
  system_prompt text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Migrate existing HR prompt from documents into section_prompts
INSERT INTO section_prompts (section_id, system_prompt, updated_at)
SELECT 'hr', system_prompt, uploaded_at
FROM documents
WHERE section_id = 'hr'
  AND is_active = true
  AND system_prompt IS NOT NULL
ORDER BY uploaded_at DESC
LIMIT 1;

-- Clean up system_prompt from documents — it no longer belongs there
UPDATE documents SET system_prompt = NULL WHERE system_prompt IS NOT NULL;
