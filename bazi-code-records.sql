create table if not exists public.bazi_code_records (
  id uuid primary key default gen_random_uuid(),
  access_code text not null check (access_code ~ '^[0-9]{6}$'),
  tool text not null default 'bazi',
  signature text not null,
  title text not null default '命主',
  birth_text text not null default '--',
  record_data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (access_code, tool, signature)
);

alter table public.bazi_code_records enable row level security;

drop policy if exists "bazi code records public read" on public.bazi_code_records;
create policy "bazi code records public read"
  on public.bazi_code_records for select to anon, authenticated using (true);

drop policy if exists "bazi code records public insert" on public.bazi_code_records;
create policy "bazi code records public insert"
  on public.bazi_code_records for insert to anon, authenticated with check (access_code ~ '^[0-9]{6}$');

drop policy if exists "bazi code records public update" on public.bazi_code_records;
create policy "bazi code records public update"
  on public.bazi_code_records for update to anon, authenticated using (access_code ~ '^[0-9]{6}$') with check (access_code ~ '^[0-9]{6}$');

drop policy if exists "bazi code records public delete" on public.bazi_code_records;
create policy "bazi code records public delete"
  on public.bazi_code_records for delete to anon, authenticated using (access_code ~ '^[0-9]{6}$');

grant select, insert, update, delete on public.bazi_code_records to anon, authenticated;
