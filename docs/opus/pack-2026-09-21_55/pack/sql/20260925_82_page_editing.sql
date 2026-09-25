-- 20260925_82 見ながら編集の 台帳（★裁定198 の 第2段）
-- ★出発前に 台帳だけ 済ませます（★型の 工事と 別に 進められるため）
-- ★Fable の 設計（2026-09-25）の DATA_MODEL を 台帳に します
-- ★78・80 のあと

-- ① 節（section）── ★型の「骨格」の 中に 置く もの
create table if not exists public.page_sections (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  key        text not null,                 -- profile／events／rep／press／video／contact／custom
  title      text,                          -- ★見出しの 名前を 替えられる（40字）
  visible    boolean not null default true,
  sort_order integer not null default 0,
  sort_by    text default 'auto' check (sort_by in ('auto','manual','date','composer','year')),
  created_at timestamptz not null default now(),
  constraint page_sections_title_len check (title is null or char_length(title) <= 40)
);
create index if not exists page_sections_user_idx on public.page_sections(user_id, sort_order);
alter table public.page_sections enable row level security;
revoke all on public.page_sections from anon, authenticated;
grant select, insert, update, delete on public.page_sections to authenticated;
drop policy if exists page_sections_own on public.page_sections;
create policy page_sections_own on public.page_sections for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
-- ★他人が 読むのは ★公開ページの 書き出し（静的）から。★この表を 直に 読ませません

-- ② 部品（block）── ★節の 中に 積む
create table if not exists public.page_blocks (
  id         uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.page_sections(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  type       text not null check (type in ('text','quote','photo','gallery','video','rule','space')),
  content    text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint page_blocks_text_len check (content is null or char_length(content) <= 600)
);
create index if not exists page_blocks_section_idx on public.page_blocks(section_id, sort_order);
alter table public.page_blocks enable row level security;
revoke all on public.page_blocks from anon, authenticated;
grant select, insert, update, delete on public.page_blocks to authenticated;
drop policy if exists page_blocks_own on public.page_blocks;
create policy page_blocks_own on public.page_blocks for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ③ ★上限を 台帳で 守る（★画面だけの 守りは 静かに 破れます）
create or replace function public.assert_page_limits()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare n integer;
begin
  if TG_TABLE_NAME = 'page_sections' then
    -- ★自由な節は 4つまで（★既定の6節は key が custom 以外）
    if new.key = 'custom' then
      select count(*) into n from public.page_sections
       where user_id = new.user_id and key = 'custom' and id <> coalesce(new.id, gen_random_uuid());
      if n >= 4 then raise exception 'TOO_MANY_SECTIONS: 足せる節は 4つまでです'; end if;
    end if;
  else
    -- ★1節に 6部品まで
    select count(*) into n from public.page_blocks
     where section_id = new.section_id and id <> coalesce(new.id, gen_random_uuid());
    if n >= 6 then raise exception 'TOO_MANY_BLOCKS: 1つの節に 置けるのは 6つまでです'; end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_page_sections_limit on public.page_sections;
create trigger trg_page_sections_limit before insert on public.page_sections
  for each row execute function public.assert_page_limits();
drop trigger if exists trg_page_blocks_limit on public.page_blocks;
create trigger trg_page_blocks_limit before insert on public.page_blocks
  for each row execute function public.assert_page_limits();

-- ④ 見た目（★portfolios に 足す）
alter table public.portfolios add column if not exists theme jsonb not null default '{}'::jsonb;
-- ★accent／accent2／font／latinHead／density／textSize／photoTone／paper／colorMode
-- ★jsonb に する理由: ★型ごとに 持てる ものが 違う（★列に すると 型を 足すたび 増えます）

-- ⑤ お問い合わせ（★Fable の 案のとおり）
alter table public.portfolios add column if not exists contact_mode text not null default 'off'
  check (contact_mode in ('account','custom','management','off'));
alter table public.portfolios add column if not exists contact_email text;
alter table public.portfolios add column if not exists contact_email_verified_at timestamptz;
alter table public.page_inquiries add column if not exists read_at timestamptz;
alter table public.page_inquiries add column if not exists done_at timestamptz;
alter table public.page_inquiries add column if not exists spam boolean not null default false;
-- ★受け付けない が 既定（裁定73：何も しなければ 受け取らない）

create table if not exists public.blocked_senders (
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  email_hash    text not null,              -- ★メールそのものは 持たない
  blocked_at    timestamptz not null default now(),
  primary key (owner_user_id, email_hash)
);
alter table public.blocked_senders enable row level security;
revoke all on public.blocked_senders from anon, authenticated;
grant select, insert, delete on public.blocked_senders to authenticated;
drop policy if exists blocked_senders_own on public.blocked_senders;
create policy blocked_senders_own on public.blocked_senders for all to authenticated
  using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

-- ⑥ ★90日で 消す（★掃除に 相乗り）
create or replace function public.purge_page_inquiries()
returns integer language plpgsql security definer set search_path to 'public' as $$
declare n integer;
begin
  delete from public.page_inquiries where created_at < now() - interval '90 days';
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.purge_page_inquiries() from public, anon, authenticated;

-- 確かめ（試しの環境で・★なりきって）
-- 自分の 節・部品だけ 見える／★他人のは 0行
-- ★自由な節 5つ目 → TOO_MANY_SECTIONS
-- ★1節に 7つ目の 部品 → TOO_MANY_BLOCKS
-- ★見出し 41字・文章 601字 → CHECK で 止まる
-- ★contact_mode の 既定は 'off'
-- ★blocked_senders は メールそのものを 持たない（★hash だけ）
