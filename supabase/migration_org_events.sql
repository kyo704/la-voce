-- ============================================================================
-- 教室・組織の予定（org_events / org_event_participants）
--
--   ★写しを作りません（Opus の裁定・2026-09-02）
--     予定を「自分の予定表にコピーする」形はやめました。
--     利用者が押すのは★「出ます」という印だけです。中身は持ちません。
--
--     こうすると、次のものが全部要らなくなります。
--       ・予定が変わったときの同期
--       ・取り下げられたときの同期
--       ・写しと元のずれの表示
--       ・写しが entries や lessons の集計を汚す危険
--
--   ★記録は、本人が書いたものだけ、という決まりを崩しません。
--     当日の記録画面で「活動の種類」を先に選んでおくだけで、
--     ★本人が保存するまで、entries には1行も書きません。
--
--   ★取り下げは、行を消しません（withdrawn_at を入れます）
--     消すと、出ると印をつけた人の画面から★黙って消えます。
--     「取り下げられました」と伝えるために、行が要ります。
--
--   ★何度実行しても同じ結果になります。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 予定
-- ---------------------------------------------------------------------------
create table if not exists public.org_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  -- ★v1 では使いません。列だけ先に置きます（区分は組織を分けて表します）。
  target_group text,
  event_date date not null,
  start_time time,
  end_time time,
  -- 本番／試験／合わせ／練習／休講／その他
  kind text not null default 'その他',
  title text not null default '',
  -- ★日付が変わったとき、前の日付をここに残します。
  --   「12月3日から12月4日に変わりました」と言うために要ります。
  previous_date date,
  -- ★取り下げ。行は消しません。
  withdrawn_at timestamptz,
  -- ★誰が作ったか。退会したら null になります（行は残す）。
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists org_events_org_date_idx
  on public.org_events (org_id, event_date);

-- ---------------------------------------------------------------------------
-- ② 「出ます」の印
--
--   ★中身を持ちません。誰が、どの予定に、いつ印をつけたか、だけです。
--   ★dismissed_at は「取り下げの知らせを、画面から消した時刻」です。
--     印そのものを消すのとは別です。
-- ---------------------------------------------------------------------------
create table if not exists public.org_event_participants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  org_event_id uuid not null references public.org_events(id) on delete cascade,
  joined_at timestamptz not null default now(),
  dismissed_at timestamptz,
  unique (user_id, org_event_id)
);

create index if not exists org_event_participants_user_idx
  on public.org_event_participants (user_id);

-- ---------------------------------------------------------------------------
-- ③ RLS
-- ---------------------------------------------------------------------------
alter table public.org_events enable row level security;
alter table public.org_event_participants enable row level security;

do $$
begin
  -- 予定は、その組織に居る人だけが読めます。
  if not exists (select 1 from pg_policies where schemaname='public'
                 and tablename='org_events' and policyname='org_events_select_member') then
    create policy "org_events_select_member" on public.org_events for select
      using (
        exists (select 1 from public.memberships m
                 where m.org_id = org_events.org_id and m.user_id = auth.uid())
        or exists (select 1 from public.enrollments e
                    where e.org_id = org_events.org_id and e.student_id = auth.uid()
                      and e.status = 'active')
      );
  end if;
  -- 作れるのは、その組織のオーナー・管理者だけです。
  if not exists (select 1 from pg_policies where schemaname='public'
                 and tablename='org_events' and policyname='org_events_write_admin') then
    create policy "org_events_write_admin" on public.org_events for all
      using (
        exists (select 1 from public.memberships m
                 where m.org_id = org_events.org_id and m.user_id = auth.uid()
                   and m.role in ('owner','admin'))
      );
  end if;

  -- 印は、本人だけ。★ほかの人が誰を印したかは、誰にも見せません。
  if not exists (select 1 from pg_policies where schemaname='public'
                 and tablename='org_event_participants' and policyname='org_event_participants_own') then
    create policy "org_event_participants_own" on public.org_event_participants for all
      using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

comment on table public.org_events is
  '組織の予定。★取り下げは withdrawn_at を入れる。行を消さないこと'
  '（消すと、出ると印をつけた人の画面から黙って消える）。';
comment on column public.org_events.previous_date is
  '日付が変わる前の日付。「◯月◯日から◯月◯日に変わりました」と言うために残す。';
comment on table public.org_event_participants is
  '「出ます」の印。★中身を持たない。記録（entries）には一切触れない。'
  '★日付が変わっても、この印を自動で外さないこと'
  '（外すと、出るつもりの人が、外れたことに気づけない）。';

-- ---------------------------------------------------------------------------
-- ④ 確認
-- ---------------------------------------------------------------------------
select table_name as "表", column_name as "列", data_type as "型"
  from information_schema.columns
 where table_schema = 'public' and table_name in ('org_events','org_event_participants')
 order by table_name, ordinal_position;

select tablename as "表", policyname as "ポリシー", cmd as "操作"
  from pg_policies
 where schemaname = 'public' and tablename in ('org_events','org_event_participants')
 order by tablename, policyname;
