-- ============================================================================
-- 先生とのつながりの記録（G4-26 / 作業指示-教室プラン D-3）
--
--   ★何を残すのか
--     「いつ、どの先生とつながり、いつ、誰が外したか」だけです。
--
--   ★何を残さないのか（Opus の裁定・2026-09-01）
--     ・org_id を持たせません。持たせると、あとから
--       「教室ごとの共有」へ道が開きます。★その扉を作らないための不在です。
--     ・共有範囲（scope）を持たせません。2026-09-01 に廃止した考え方です。
--       先生は生徒の記録の中身を見られません。記録した日も、件数も、
--       記録があるかどうかも見られません。
--       ★つまり、このつながりは「何を見せるか」の同意ではありません。
--         レッスンの予定を一緒に見るための同意です。
--
--   ★上書きしません。積みます（D-3）。
--     つながり直したら、新しい行が増えます。前の行は残ります。
--     ★行を消すのは、本人がアカウントごと消すときだけです。
--
--   ★何度実行しても同じ結果になります。
-- ============================================================================

create table if not exists public.link_consents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users on delete cascade,
  teacher_id uuid references auth.users on delete set null,
  -- つながった時刻
  linked_at timestamptz not null default now(),
  -- 外れた時刻。★null は「いまも続いている」という意味です。
  unlinked_at timestamptz,
  -- 誰が外したか（'student' / 'teacher'）。★片方が消えた場合は null。
  unlinked_by text,
  -- 同意した文面の版。★文言を変えたら上げること。
  agreement_version text not null,
  created_at timestamptz not null default now()
);

-- ★teacher_id は set null です。先生が退会しても、生徒側の記録は残ります。
--   「いつ誰かとつながっていたか」は、生徒さん自身の事実だからです。
--   ★画面では「退会した先生」と出します（lib/teacherDisplay.js）。

create index if not exists link_consents_student_idx
  on public.link_consents (student_id, linked_at desc);

alter table public.link_consents enable row level security;

-- ★本人だけ。先生にも管理者にも、読む道を作りません。
--   ★これは「誰と、いつつながったか」の履歴です。先生が見るものではありません。
do $$
begin
  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'link_consents'
                   and policyname = 'link_consents_select_own') then
    create policy "link_consents_select_own"
      on public.link_consents for select using (auth.uid() = student_id);
  end if;
  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'link_consents'
                   and policyname = 'link_consents_insert_own') then
    create policy "link_consents_insert_own"
      on public.link_consents for insert with check (auth.uid() = student_id);
  end if;
  -- ★外れた時刻を入れるための update だけを許します。
  --   delete のポリシーは作りません。★積んだ行を消せないようにするためです。
  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'link_consents'
                   and policyname = 'link_consents_update_own') then
    create policy "link_consents_update_own"
      on public.link_consents for update using (auth.uid() = student_id);
  end if;
end $$;

comment on table public.link_consents is
  '先生とつながった／外れた記録。★上書きせず積む。'
  '★org_id を足さないこと（教室ごとの共有への扉になる）。'
  '★共有範囲（scope）を足さないこと（2026-09-01 に廃止した考え方）。';
comment on column public.link_consents.unlinked_at is
  '★null は「いまも続いている」。行は消さない。';
comment on column public.link_consents.agreement_version is
  '同意した文面の版。★文言を変えたら上げること。正は lib/linkConsent.js。';

-- 確認
select column_name as "列", data_type as "型", is_nullable as "null可"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'link_consents'
 order by ordinal_position;

select policyname as "ポリシー", cmd as "操作"
  from pg_policies
 where schemaname = 'public' and tablename = 'link_consents'
 order by cmd, policyname;

-- ★delete のポリシーが無いこと（0行であること）
select policyname as "★delete のポリシー（0行であること）"
  from pg_policies
 where schemaname = 'public' and tablename = 'link_consents' and cmd = 'DELETE';
