-- 八字网页账号记录表
-- 当前方案：在 HAPPY FARM Supabase 项目的 SQL Editor 里运行一次。
-- 该脚本只创建/更新 public.bazi_query_records，不会修改农场原有数据表。

create extension if not exists pgcrypto;

create table if not exists public.bazi_query_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tool text not null default 'bazi',
  signature text not null,
  title text not null default '',
  birth_text text not null default '',
  record_state jsonb not null default '{}'::jsonb,
  record_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists bazi_query_records_user_tool_signature_idx
  on public.bazi_query_records (user_id, tool, signature);

create index if not exists bazi_query_records_user_updated_idx
  on public.bazi_query_records (user_id, updated_at desc);

create or replace function public.set_bazi_query_records_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_bazi_query_records_updated_at on public.bazi_query_records;
create trigger set_bazi_query_records_updated_at
before update on public.bazi_query_records
for each row
execute function public.set_bazi_query_records_updated_at();

alter table public.bazi_query_records enable row level security;

drop policy if exists bazi_query_records_select_own on public.bazi_query_records;
create policy bazi_query_records_select_own
on public.bazi_query_records
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists bazi_query_records_insert_own on public.bazi_query_records;
create policy bazi_query_records_insert_own
on public.bazi_query_records
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists bazi_query_records_update_own on public.bazi_query_records;
create policy bazi_query_records_update_own
on public.bazi_query_records
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists bazi_query_records_delete_own on public.bazi_query_records;
create policy bazi_query_records_delete_own
on public.bazi_query_records
for delete
to authenticated
using (auth.uid() = user_id);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.bazi_query_records to authenticated;
