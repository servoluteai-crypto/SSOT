-- Review response system prompts (one per manager voice)
create table review_prompts (
  id uuid primary key default gen_random_uuid(),
  module text not null default 'reviews',
  manager text not null,
  system_prompt text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(module, manager)
);
