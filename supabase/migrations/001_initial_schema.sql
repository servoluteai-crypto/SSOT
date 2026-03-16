-- Enable pgvector extension
create extension if not exists vector;

-- Admins table
create table admins (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  section_scope text default null,
  created_at timestamptz default now()
);

-- Documents table
create table documents (
  id uuid primary key default gen_random_uuid(),
  section_id text not null,
  filename text not null,
  storage_path text not null,
  uploaded_at timestamptz default now(),
  uploaded_by text,
  is_active boolean default true,
  system_prompt text
);

-- Document chunks table (RAG)
create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  section_id text not null,
  chunk_text text not null,
  chunk_index integer not null,
  embedding vector(1536),
  created_at timestamptz default now()
);

-- Vector similarity search index
create index on document_chunks
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Escalation log (future use)
create table escalation_logs (
  id uuid primary key default gen_random_uuid(),
  section_id text not null,
  query text not null,
  escalation_reason text,
  created_at timestamptz default now()
);

-- RPC function for vector similarity search
create or replace function match_chunks(
  query_embedding vector(1536),
  section_id text,
  match_count int
)
returns table (
  id uuid,
  chunk_text text,
  document_id uuid,
  similarity float
)
language sql stable
as $$
  select
    document_chunks.id,
    document_chunks.chunk_text,
    document_chunks.document_id,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from document_chunks
  where document_chunks.section_id = match_chunks.section_id
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
$$;
