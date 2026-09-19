-- ============================================================================
-- ★未送信（★見本 `P_misou`・お決め D82・2026-09-19）
--
--   ★★★見本の 字 ──
--     「ここに あるものは、★**誰にも 届いていません**。
--      ★下書き（書きかけ）と、★送れなかったもの（つながらなかった）を 分けて 出します。
--      ★**自動で 出しません。** 出すかどうかは、いつも 人が 決めます。」
--
--   ★★★`org_messages` に 列を 足す 道を 選びません。★別の 表に します。
--     ★★わけ ── ★`org_messages` は **届いた もの** を 読む 表 です。
--       ★★宛て先の 方が 読める 決まりが 付いて います。
--       ★★★下書きを 同じ 表に 置くと、★決まりを 1つ 間違えた 日に 届きます。
--     ★★★別の 表なら、★読む 道が そもそも ありません。
--       ★★「届かない」を、★決まりでは なく **形** で 守ります。
--
--   ★★★書いた ご本人 だけ が 読めます。★事務も 学長も 読めません。
--     ★★書きかけ です。★人に 見せる もの では ありません。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

create table if not exists public.org_message_drafts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  -- ★★門下あて の とき だけ 入ります。★学校ぜんぶ なら null です。
  teacher_id uuid references auth.users(id) on delete set null,
  title text,
  body text not null default '',
  target_division_ids uuid[] not null default '{}',
  target_grade_years int[] not null default '{}',
  target_user_ids uuid[] not null default '{}',
  -- ★★`draft` … 書きかけ ／ `failed` … 送れなかった
  kind text not null default 'draft',
  -- ★★送れなかった わけ（★機械の 字です。★そのまま 出しません）。
  fail_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint org_message_drafts_kind_check check (kind in ('draft', 'failed'))
);

alter table public.org_message_drafts enable row level security;

--   ★★★決まりは 1つ。★書いた ご本人 だけ。
--     ★★よその 方の 下書きに 届く 道が、★そもそも ありません。
do $$
begin
  if not exists (
    select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
    where c.relname = 'org_message_drafts' and p.polname = 'org_message_drafts_own'
  ) then
    create policy org_message_drafts_own on public.org_message_drafts
      for all using (auth.uid() = author_id) with check (auth.uid() = author_id);
  end if;
end $$;

revoke all on table public.org_message_drafts from public;
revoke all on table public.org_message_drafts from anon;
grant select, insert, update, delete on table public.org_message_drafts to authenticated;

-- ---------------------------------------------------------------------------
-- ★出す ── ★下書きを 連絡に 移します（★1つの 取引で）
-- ---------------------------------------------------------------------------
--   ★★★人が 押した ときだけ 動きます。★自動で 出しません（★見本の 字）。
--   ★★移したら 下書きは 消えます。★2つの ところに 同じ ものを 残しません。
create or replace function public.send_message_draft(p_draft_id uuid)
returns table (message_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  d public.org_message_drafts;
  v_id uuid;
begin
  select * into d from public.org_message_drafts
  where id = p_draft_id;

  if d.id is null then
    raise exception 'その 下書きが ありません';
  end if;
  if d.author_id <> auth.uid() then
    raise exception '書いた ご本人だけが 出せます';
  end if;
  if coalesce(trim(d.body), '') = '' then
    raise exception '中身が ありません';
  end if;

  insert into public.org_messages
    (org_id, teacher_id, author_id, title, body,
     target_division_ids, target_grade_years, target_user_ids)
  values
    (d.org_id, d.teacher_id, d.author_id, d.title, d.body,
     d.target_division_ids, d.target_grade_years, d.target_user_ids)
  returning id into v_id;

  delete from public.org_message_drafts where id = p_draft_id;

  return query select v_id;
end;
$$;

revoke all on function public.send_message_draft(uuid) from public;
revoke all on function public.send_message_draft(uuid) from anon;
grant execute on function public.send_message_draft(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- ★確かめ（★流した あとに、★別に 流して ください）
-- ---------------------------------------------------------------------------
--   select relrowsecurity from pg_class where relname = 'org_message_drafts';
--   ★★`true` で ある こと。
--
--   select polname, polcmd from pg_policy p join pg_class c on c.oid = p.polrelid
--   where c.relname = 'org_message_drafts';
--   ★★1つ だけ で ある こと（`org_message_drafts_own` ／ `*`）。
