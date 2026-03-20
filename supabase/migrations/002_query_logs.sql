create table query_logs (
  id uuid primary key default gen_random_uuid(),
  section_id text not null,
  query text not null,
  was_escalated boolean default false,
  had_results boolean default true,
  created_at timestamptz default now()
);

create index idx_query_logs_section_created on query_logs (section_id, created_at desc);
create index idx_query_logs_created on query_logs (created_at desc);
