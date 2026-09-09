-- ============================================================================
-- 「先生に 伝える」── 休むことを、★連絡板に 書かせない（2026-09-10）
--
--   ★出どころ docs/opus/woolsong-見本-連絡6画面（9月9日）.html ⑥
--            docs/opus/woolsong-教室機能の正（9月9日・最終稿）.md §6-1 の 対処②
--
--   ★★§6-1 の いちばん大きな 危険への 手当てです。
--     ★学生が「喉の調子が 悪いので 休みます」と 連絡板に 書くと、
--     ★★体調が、★先生と 門下の 全員に 伝わります。
--     ★誰も 約束を 破っていません。★ですが 静かに 漏れます。
--
--   ★★だから、★休むことは 連絡板に 書かせません。★別の道に します。
--     ★見本⑥「★これは、斎藤先生 おひとりに 届きます。
--       　　　　★門下の12人には 届きません。★学校の運営の方にも 届きません。」
--
--   ★★決めたこと
--     ① ★新しい 表を 作りません。★lessons に 2つ 足すだけです。
--        ★★そのレッスンの ことだからです。★別の 表に すると、
--        ★★どのレッスンの ことかを、★もう一度 結び直すことに なります。
--     ② ★★理由の 欄を 作りません（★見本⑥「★理由の欄は ありません」）。
--        ★★欄が あれば、★書く人が 出ます。★書けば 体調が 伝わります。
--        ★★列を 作らなければ、★あとから「少しだけ」も できません。
--     ③ ★決まった 言葉しか 入りません（★休みます／遅れます／行けるようになりました）。
--     ④ ★運営の方には 見せません。★先生と、★書いた ご本人だけです。
-- ============================================================================


-- ---------------------------------------------------------------------------
-- ①【いまの姿】★読むだけです。
-- ---------------------------------------------------------------------------
select
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'lessons'
      and column_name = 'student_notice')                     as "student_notice (0=まだ無い)",
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'lessons'
      and column_name = 'student_notice_at')                  as "student_notice_at (0=まだ無い)";


-- ---------------------------------------------------------------------------
-- ②【列を 足す】★2つだけ。★理由の 欄は 作りません。
-- ---------------------------------------------------------------------------
alter table public.lessons
  add column if not exists student_notice text,
  add column if not exists student_notice_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'lessons_student_notice_check') then
    alter table public.lessons
      add constraint lessons_student_notice_check
      check (student_notice is null or student_notice in ('absent', 'late', 'coming'));
  end if;
end $$;

comment on column public.lessons.student_notice is
  '生徒からの事前の連絡。absent=休みます／late=遅れます／coming=行けるようになりました。'
  '★理由の欄は作りません（見本⑥）。欄があれば書く人が出て、体調が伝わります。'
  '★先生おひとりに届きます。門下にも、学校の運営の方にも届きません。';
comment on column public.lessons.student_notice_at is
  'いつ伝えたか。★取り消し（null に戻す）もできます。';


-- ---------------------------------------------------------------------------
-- ③【権限】★剥奪が 先です。
--
--   ★★生徒は、★この2列だけを 書き換えられます。
--     ★★表ぜんぶの update を 渡しません。★時刻も 場所も 変えられては 困ります。
--   ★★列ごとの grant は、★表ぜんぶの grant を 先に 落とさないと 効きません。
--     ★2026-09-09 の profiles の 403 と、同じ 形です。
-- ---------------------------------------------------------------------------
revoke all on public.lessons from anon;
revoke truncate, trigger, references on public.lessons from authenticated;

-- ★★いまの grant を 見てから 決めてください（★下の ⑤-2）。
--   ★表ぜんぶの update が 付いている なら、★次の1行は 要りません。
--   ★列ごとに 絞っている なら、★コメントを 外してください。
-- grant update (student_notice, student_notice_at) on public.lessons to authenticated;


-- ---------------------------------------------------------------------------
-- ④【行の 門】★その レッスンの 生徒だけが 書けます。
--
--   ★★with check を 必ず 付けます。★無いと using が 代わりに 使われます。
--   ★★運営の方（owner・admin）を 入れません。★先生と ご本人だけです。
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_policies
                  where tablename = 'lessons' and policyname = 'lessons_student_notice') then
    create policy "lessons_student_notice" on public.lessons
      for update using (auth.uid() = student_id)
              with check (auth.uid() = student_id);
  end if;
end $$;


-- ---------------------------------------------------------------------------
-- ⑤【確かめ】★読むだけです。
-- ---------------------------------------------------------------------------

-- ⑤-1 列と 決まりが できたか。★理由の 欄が 無いこと。
select
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'lessons'
      and column_name in ('student_notice', 'student_notice_at'))   as "足した列 (2が正しい)",
  (select count(*) from pg_constraint where conname = 'lessons_student_notice_check')
                                                                    as "決まった言葉 (1が正しい)",
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'lessons'
      and column_name ~ 'reason|理由|note_text|memo')               as "★理由らしき列 (0が正しい)";

-- ⑤-2 ★列ごとの 権限が 使われているか。
--      ★1行も 返らなければ、★表ぜんぶの権限です（★③の grant は 不要）。
select grantee as "相手", privilege_type as "権限", column_name as "列"
  from information_schema.column_privileges
 where table_schema = 'public' and table_name = 'lessons'
   and grantee in ('anon', 'authenticated')
 order by grantee, column_name
 limit 20;

-- ⑤-3 ★anon に 残っていないこと（★0行が 正しい姿）。
select grantee as "★anon にまだ残っている権限", privilege_type
  from information_schema.role_table_grants
 where table_schema = 'public' and table_name = 'lessons' and grantee = 'anon';

-- ⑤-4 ★更新の ポリシーに、★書ける条件が あること。
select policyname as "ポリシー", cmd as "はたらき",
       (with_check is not null) as "★書ける条件あり（true が正しい）"
  from pg_policies
 where schemaname = 'public' and tablename = 'lessons' and cmd = 'UPDATE'
 order by policyname;
