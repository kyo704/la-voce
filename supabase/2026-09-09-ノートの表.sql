-- ============================================================================
-- Woolsong: ノートの表（★見本⑥「ノート／Apple メモ方式」・2026年9月9日）
--
--   ★Supabase の SQL Editor に、この全文を貼って実行してください。
--   ★何度実行しても安全です（if not exists / do $$ で包んであります）。
--
-- ----------------------------------------------------------------------------
-- ★★なぜ 新しい表が 要るのか
--
--   いまのアプリに、★自由に文章を書いて残す仕組みが 1つも ありません。
--     article_notes  … 学ぶの 記事ごとの メモ（★記事に ひもづきます）
--     entries        … 1日1行。★日付に ひもづきます
--     practice_goal  … profiles の 1列。★1つだけ
--   ★見本⑥のノートは、★日付にも 記事にも ひもづきません。
--     ★書いた日は 控えますが、★その日の記録では ありません。
--
-- ----------------------------------------------------------------------------
-- ★★決めたこと と、その わけ
--
--   ① 見出しの 列を 作りません（title が ありません）。
--      ★見本に「タイトル欄は ありません」と 書いてあります。
--      ★一覧に出す 見出しは、★本文の 1行目を 画面で 切って 作ります。
--      ★列にすると、★同じことが 2か所に 住みます。
--
--   ② 消しても、★行を 消しません（deleted_at を 入れるだけ）。
--      ★「受け取ったもの・書いたものを 黙って 消さない」という 決めです。
--      ★退会のときは、★台帳（lib/accountDeletion.js）が まとめて 消します。
--
--   ③ 先生に 見せる ポリシーを 1つも 作りません。
--      ★cycle_periods と 同じ構えです。
--      ★SECURITY DEFINER の 関数も 作りません。
--      ★★「設定で 切る」では なく、★他人が 読める 道を 作らない、です。
--      ★「門下」の ノートも、★いまは ご本人だけです。
--        ★分け合う 形は、★決まってから 足します。★先に 穴を 開けません。
--
--   ④ 種類（kind）は 4つ。★見本⑥の 帯の とおりです。
--      ★知らない値を 弾く 制約を 付けます。★画面だけで 守りません。
--
--   ⑤ 「保存ボタンが ない」＝ ★画面が 黙って 上書きします。
--      ★だから updated_at を 持ちます。★並び順に 使います。
-- ============================================================================


-- ---------------------------------------------------------------------------
-- ①【いまの姿を 見る】★実行の 前に、これだけ 先に 走らせても かまいません。
--    ★もう 表が あるか、★どんな 権限が 付いているか。
-- ---------------------------------------------------------------------------
select
  (select count(*) from information_schema.tables
    where table_schema = 'public' and table_name = 'notes')            as "notes の表 (0=まだ無い)",
  (select count(*) from pg_policies where tablename = 'notes')         as "notes のポリシーの数";


-- ---------------------------------------------------------------------------
-- ②【表を 作る】
-- ---------------------------------------------------------------------------
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,

  -- ★見本⑥の 帯の 4つ。★知らない値は 入りません。
  kind text not null default 'practice',

  -- ★本文だけです。★見出しの 列は ありません（★上の ①）。
  body text not null default '',

  -- ★「9月8日（月）○○先生」の、★うしろ半分。★書かなくても かまいません。
  source_label text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- ★消しても 行を 消しません。★時刻が 入っているものは、★画面に 出しません。
  deleted_at timestamptz,

  constraint notes_kind_check
    check (kind in ('practice', 'repertoire', 'studio', 'clinic'))
);

comment on table  public.notes              is 'ノート（見本⑥）。日付にも記事にもひもづかない、自由な書きもの。';
comment on column public.notes.kind         is '稽古 practice ／ レパートリー repertoire ／ 門下 studio ／ 受診用 clinic';
comment on column public.notes.body         is '本文。★見出しの列は作らない。一覧の見出しは1行目から画面で作る。';
comment on column public.notes.source_label is '「○○先生」など。任意。';
comment on column public.notes.deleted_at   is '消した時刻。★行は消さない。退会のときだけ、台帳がまとめて消す。';

-- ★一覧は「その方の・その種類の・消していないものを・新しい順」で 引きます。
create index if not exists notes_user_kind_updated_idx
  on public.notes (user_id, kind, updated_at desc)
  where deleted_at is null;

-- ★「この中から さがす」（見本⑥）。★ことばで 引くための 索引です。
--   ★日本語は 語で 切れないので、★trigram で 引きます。
create extension if not exists pg_trgm;

create index if not exists notes_body_trgm_idx
  on public.notes using gin (body gin_trgm_ops)
  where deleted_at is null;


-- ---------------------------------------------------------------------------
-- ③【権限を 先に 締める】
--
--    ★★剥奪を 先に 書きます。★あとに 置くと、
--      ★ポリシーを 作る前に、★広い権限だけが 立っている 隙が できます。
--      ★SQL Editor は 途中で 止まっても 巻き戻しません。★隙は 本物です。
--    ★★ポリシーの 不在は 1枚の 板です。★権限の 剥奪と 合わせて 2枚に します。
-- ---------------------------------------------------------------------------
revoke all on public.notes from anon;
revoke truncate, trigger, references on public.notes from authenticated;

grant select, insert, update, delete on public.notes to authenticated;


-- ---------------------------------------------------------------------------
-- ④【行の 門（RLS）】
--
--    ★ご本人だけです。★先生の ポリシーは 1つも ありません。
--    ★★UPDATE には with check を 必ず 付けます。
--      ★無いと、★using が 代わりに 使われ、★他人の user_id へ
--        書き換える 道が 開きます。★欠陥です。
-- ---------------------------------------------------------------------------
alter table public.notes enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies
                  where tablename = 'notes' and policyname = 'notes_select_own') then
    create policy "notes_select_own" on public.notes
      for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies
                  where tablename = 'notes' and policyname = 'notes_insert_own') then
    create policy "notes_insert_own" on public.notes
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies
                  where tablename = 'notes' and policyname = 'notes_update_own') then
    create policy "notes_update_own" on public.notes
      for update using (auth.uid() = user_id)
              with check (auth.uid() = user_id);
  end if;

  -- ★退会のときに、★台帳が まとめて 消せるように しておきます。
  --   ★画面からは 消しません（deleted_at を 入れるだけ）。
  if not exists (select 1 from pg_policies
                  where tablename = 'notes' and policyname = 'notes_delete_own') then
    create policy "notes_delete_own" on public.notes
      for delete using (auth.uid() = user_id);
  end if;
end $$;


-- ---------------------------------------------------------------------------
-- ⑤【確かめ】★ここから下は 読むだけです。★何も 書きません。
-- ---------------------------------------------------------------------------

-- ⑤-1 ポリシーは 4つ、★どれも ご本人だけか。
--      ★★「更新」の行の with_check が 空なら、★それは 欠陥です。
select policyname as "ポリシー", cmd as "はたらき",
       qual as "読める条件 (using)", with_check as "書ける条件 (with check)"
  from pg_policies
 where schemaname = 'public' and tablename = 'notes'
 order by cmd, policyname;

-- ⑤-2 anon に、★1つも 残っていないか。
--      ★★1行も 返らないのが 正しい姿です。
select grantee as "★anon にまだ残っている権限", privilege_type as "権限"
  from information_schema.role_table_grants
 where table_schema = 'public' and table_name = 'notes' and grantee = 'anon';

-- ⑤-3 authenticated に 付いているもの。
--      ★SELECT / INSERT / UPDATE / DELETE の 4つだけが 正しい姿です。
--      ★TRUNCATE・TRIGGER・REFERENCES が 出たら、★③を もう一度 走らせてください。
select privilege_type as "authenticated の権限"
  from information_schema.role_table_grants
 where table_schema = 'public' and table_name = 'notes' and grantee = 'authenticated'
 order by privilege_type;

-- ⑤-4 先生の 道が、★1つも 無いこと。
--      ★★0 が 正しい姿です。
select count(*) as "★先生・組織に触れるポリシーの数 (0が正しい)"
  from pg_policies
 where schemaname = 'public' and tablename = 'notes'
   and (coalesce(qual, '') || coalesce(with_check, '')) ~ 'teacher|org_id|membership|link';
