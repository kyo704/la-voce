-- ============================================================================
-- 連絡（門下の連絡板）と、★運営の方が 読んだ記録（2026-09-10）
--
--   ★出どころ docs/opus/woolsong-見本-連絡6画面（9月9日）.html
--            docs/opus/woolsong-教室機能の正（9月9日・最終稿）.md §6-1
--            坂本さんのご指示（2026-09-10）②
--
--   ★★Supabase の SQL Editor に、この全文を 貼って 実行してください。
--   ★★何度 実行しても 安全です。★BEGIN も ROLLBACK も 使いません。
--
-- ----------------------------------------------------------------------------
-- ★★門下の 表を、★作りません（★§6-1）
--   「★Assignment（teacherId, studentId, endedAt）で すでに 表現できている
--     ★新しいテーブルを 作らないでください」
--   ★門下 ＝ assignments の うち、★その先生の、★ended_at が null の 学生。
--   ★★だから ここで 作るのは、★書いたもの と、★読んだ記録 の 2つだけです。
--
-- ----------------------------------------------------------------------------
-- ★★決めたこと
--
--   ① ★90日で 消えます（★見本①③）。★消えたものは 戻せません。
--      ★消すのは、★別の 定期処理です。★この SQL は 列と 門を 作るだけです。
--
--   ② ★添付は できません。★ファイルの 列を 作りません（★見本②）。
--      ★列が 無ければ、★あとから「少しだけ」も できません。
--
--   ③ ★取り消しても、★行を 消しません（★見本②）。
--      ★withdrawn_at を 入れるだけ。★静かに 1行 残ります。
--
--   ④ ★中身を、★サーバーが 検査しません（★§6-1 の 対処③）。
--      ★体調の語を 見つけて 警告する、を 作りません。
--      ★★作ると、★サーバーが 全員の 書いたものを 読むことに なります。
--      ★だから、★引き金も、★検査の 関数も、★1つも 作りません。
--
--   ⑤ ★運営の方は「読むだけ」です（★見本③）。★書き込めません。
--      ★INSERT の ポリシーに、★owner・admin を 入れません。
--
--   ⑥ ★★読んだ記録（★坂本さんのご指示②）。
--      ★運営の方が 門下を 開いたら、★誰が・いつ・どの門下を、を 1行 残します。
--      ★★これで「読むだけです」という 約束が、★確かめられる 形に なります。
--      ★★読んだ記録そのものは、★書いた人にも 見せます（★あとで 画面を 作ります）。
--        ★片方だけが 見られる 記録は、★見張りに なりません。
-- ============================================================================


-- ---------------------------------------------------------------------------
-- ①【いまの姿を 見る】★読むだけです。
-- ---------------------------------------------------------------------------
select
  (select count(*) from information_schema.tables
    where table_schema = 'public' and table_name = 'org_messages')      as "org_messages (0=まだ無い)",
  (select count(*) from information_schema.tables
    where table_schema = 'public' and table_name = 'org_message_reads') as "org_message_reads (0=まだ無い)",
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'assignments'
      and column_name = 'is_representative')                            as "門下代表の列 (0=まだ無い)";


-- ---------------------------------------------------------------------------
-- ②【門下代表】★新しい role を 作りません（★§6-1）。★真偽値 1つです。
-- ---------------------------------------------------------------------------
alter table public.assignments
  add column if not exists is_representative boolean not null default false;

comment on column public.assignments.is_representative is
  '門下代表かどうか。★新しい role を作らない（§6-1）。真偽値1つで足ります。';


-- ---------------------------------------------------------------------------
-- ③【書いたもの】org_messages
--
--   ★teacher_id が null … ★学校からの おしらせ（★org ぜんぶ）
--   ★teacher_id が ある … ★その先生の 門下
-- ---------------------------------------------------------------------------
create table if not exists public.org_messages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations on delete cascade,
  -- ★null なら 学校からの おしらせ。★あれば その門下。
  teacher_id uuid references auth.users on delete cascade,
  author_id uuid not null references auth.users on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  -- ★取り消しても 行を 消しません。★静かに 1行 残ります（★見本②）。
  withdrawn_at timestamptz
  -- ★★添付の 列は 作りません（★見本②）。
  --   ★書類は「くばりもの」から（★2027年1月）。
  --   ★列が 無ければ、★あとから「少しだけ」も できません。
);

comment on table public.org_messages is
  '連絡（門下の連絡板）。★「掲示板」とは呼びません（§6-1）。★90日で消えます。'
  '★添付はできません。★中身をサーバーが検査しません。';
comment on column public.org_messages.teacher_id is
  'null なら 学校からのおしらせ。あれば その先生の門下。';
comment on column public.org_messages.withdrawn_at is
  '取り消した時刻。★行は消しません。静かに1行残ります。';

create index if not exists org_messages_org_teacher_idx
  on public.org_messages (org_id, teacher_id, created_at desc)
  where withdrawn_at is null;

-- ★90日で 消すための 索引。
create index if not exists org_messages_created_idx
  on public.org_messages (created_at);


-- ---------------------------------------------------------------------------
-- ④【読んだ記録】org_message_reads（★坂本さんのご指示②）
--
--   ★★誰が・いつ・どの門下を 読んだか。★1行 残します。
--   ★★中身は 残しません。★何を 読んだかでは なく、★開いたことだけです。
--     ★中身まで 残すと、★記録そのものが 2つ目の 置き場に なります。
-- ---------------------------------------------------------------------------
create table if not exists public.org_message_reads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations on delete cascade,
  -- ★どの門下を 開いたか。★null なら 学校からの おしらせ。
  teacher_id uuid references auth.users on delete cascade,
  -- ★誰が 読んだか。
  reader_id uuid not null references auth.users on delete cascade,
  -- ★そのときの 役割。★あとで 役割が 変わっても、★そのときの 事実を 残します。
  reader_role text not null,
  read_at timestamptz not null default now()
);

comment on table public.org_message_reads is
  '運営の方が門下を開いた記録。★誰が・いつ・どの門下を。★中身は残しません。'
  '★「読むだけです」という約束を、確かめられる形にするためのものです。';

create index if not exists org_message_reads_org_idx
  on public.org_message_reads (org_id, teacher_id, read_at desc);


-- ---------------------------------------------------------------------------
-- ⑤【権限を 先に 締める】★剥奪が 先です
-- ---------------------------------------------------------------------------
revoke all on public.org_messages from anon;
revoke all on public.org_message_reads from anon;
revoke truncate, trigger, references on public.org_messages from authenticated;
revoke truncate, trigger, references on public.org_message_reads from authenticated;

-- ★★org_messages は、★消せません。★取り消しは update です。
revoke delete on public.org_messages from authenticated;
-- ★★読んだ記録は、★消せません・直せません。★足すだけです。
revoke update, delete on public.org_message_reads from authenticated;

grant select, insert, update on public.org_messages to authenticated;
grant select, insert on public.org_message_reads to authenticated;


-- ---------------------------------------------------------------------------
-- ⑥【行の 門（RLS）】
-- ---------------------------------------------------------------------------
alter table public.org_messages enable row level security;
alter table public.org_message_reads enable row level security;

do $$
begin
  -- ★★読める人（★§6-1 の 表）
  --   ★その先生／その先生の assignment で ended_at が null の 学生／
  --   ★org の owner・admin
  if not exists (select 1 from pg_policies
                  where tablename = 'org_messages' and policyname = 'org_messages_select') then
    create policy "org_messages_select" on public.org_messages
      for select using (
        -- ★その門下の 先生
        auth.uid() = teacher_id
        -- ★その門下の 学生（★担当が 終わっていない人だけ）
        or exists (
          select 1 from public.assignments a
           where a.org_id = org_messages.org_id
             and a.student_id = auth.uid()
             and a.ended_at is null
             and (org_messages.teacher_id is null or a.teacher_id = org_messages.teacher_id)
        )
        -- ★教室の 責任者・管理者
        or exists (
          select 1 from public.memberships m
           where m.org_id = org_messages.org_id
             and m.user_id = auth.uid()
             and m.role in ('owner', 'admin')
        )
      );
  end if;

  -- ★★書ける人。★★運営の方は 入れません（★見本③「読むだけです」）。
  --   ★先生と、★担当が 終わっていない 学生だけです。
  --   ★おしらせ（teacher_id が null）は、★運営の方が 書きます。
  --     ★★そこだけ 別に 許します。★門下には 書けません。
  if not exists (select 1 from pg_policies
                  where tablename = 'org_messages' and policyname = 'org_messages_insert') then
    create policy "org_messages_insert" on public.org_messages
      for insert with check (
        auth.uid() = author_id
        and (
          -- ★門下へ … ★その先生 か、★その門下の 学生
          (teacher_id is not null and (
            auth.uid() = teacher_id
            or exists (
              select 1 from public.assignments a
               where a.org_id = org_messages.org_id
                 and a.student_id = auth.uid()
                 and a.teacher_id = org_messages.teacher_id
                 and a.ended_at is null
            )
          ))
          -- ★学校からの おしらせ … ★責任者・管理者だけ
          or (teacher_id is null and exists (
            select 1 from public.memberships m
             where m.org_id = org_messages.org_id
               and m.user_id = auth.uid()
               and m.role in ('owner', 'admin')
          ))
        )
      );
  end if;

  -- ★★取り消し。★自分が 書いたものだけ。★withdrawn_at を 入れるだけです。
--   ★★2026-09-11、★この 説明は 誤りでした。★訂正します。
--     ★★PostgreSQL は、★with check を 書かなかった とき、
--       ★using の 式を 書くときの 確かめにも 使います。
--       ★★しかも、★確かめるのは 書き換えた **あとの** 行です。
--     ★★だから、★using が auth.uid() = user_id なら、
--       ★他人の user_id へ 変える 道は、★はじめから ありません。
--     ★★それでも はっきり 書きます。★理由は 2つ ──
--       ★① あとで using を 広げた とき、★書く 側も 黙って 広がります。
--       ★② 空欄は「決めて いない」のか「使い回して いる」のか 分かりません。
  if not exists (select 1 from pg_policies
                  where tablename = 'org_messages' and policyname = 'org_messages_withdraw') then
    create policy "org_messages_withdraw" on public.org_messages
      for update using (auth.uid() = author_id)
              with check (auth.uid() = author_id);
  end if;

  -- ★★読んだ記録。★自分の ぶんだけ 足せます。★直せません・消せません。
  if not exists (select 1 from pg_policies
                  where tablename = 'org_message_reads' and policyname = 'org_message_reads_insert') then
    create policy "org_message_reads_insert" on public.org_message_reads
      for insert with check (auth.uid() = reader_id);
  end if;

  -- ★★読んだ記録を 見られる人。
  --   ★★読んだ 本人と、★その門下の 先生と 学生（★見られる側）。
  --   ★★片方だけが 見られる 記録は、★見張りに なりません。
  if not exists (select 1 from pg_policies
                  where tablename = 'org_message_reads' and policyname = 'org_message_reads_select') then
    create policy "org_message_reads_select" on public.org_message_reads
      for select using (
        auth.uid() = reader_id
        or auth.uid() = teacher_id
        or exists (
          select 1 from public.assignments a
           where a.org_id = org_message_reads.org_id
             and a.student_id = auth.uid()
             and a.ended_at is null
             and (org_message_reads.teacher_id is null or a.teacher_id = org_message_reads.teacher_id)
        )
      );
  end if;
end $$;


-- ---------------------------------------------------------------------------
-- ⑦【確かめ】★読むだけです。
-- ---------------------------------------------------------------------------

-- ⑦-1 ポリシー。★更新の with_check が 空なら、★それは 欠陥です。
select tablename as "表", policyname as "ポリシー", cmd as "はたらき",
       (qual is not null) as "読める条件あり", (with_check is not null) as "書ける条件あり"
  from pg_policies
 where schemaname = 'public' and tablename in ('org_messages', 'org_message_reads')
 order by tablename, cmd;

-- ⑦-2 anon に 1つも 残っていないこと（★0行が 正しい姿）。
select table_name as "表", grantee, privilege_type
  from information_schema.role_table_grants
 where table_schema = 'public'
   and table_name in ('org_messages', 'org_message_reads')
   and grantee = 'anon';

-- ⑦-3 ★消せないこと・直せないこと。
--      ★org_messages に DELETE が 無いこと。
--      ★org_message_reads に UPDATE・DELETE が 無いこと。
select table_name as "表", privilege_type as "authenticated の権限"
  from information_schema.role_table_grants
 where table_schema = 'public'
   and table_name in ('org_messages', 'org_message_reads')
   and grantee = 'authenticated'
 order by table_name, privilege_type;

-- ⑦-4 ★添付の 列が 無いこと（★0が 正しい姿）。
select count(*) as "★添付らしき列の数 (0が正しい)"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'org_messages'
   and column_name ~ 'file|attach|url|path|image|blob';

-- ⑦-5 ★中身を 調べる 引き金が 無いこと（★0が 正しい姿）。
select count(*) as "★org_messages の引き金の数 (0が正しい)"
  from pg_trigger t join pg_class c on c.oid = t.tgrelid
 where c.relname = 'org_messages' and not t.tgisinternal;
