-- ============================================================================
-- 「あとから書いた」印 ── entries.source（2026-09-09）
--
--   ★出どころ docs/opus/woolsong-裁定-分析機能へのFableの査読（9月9日・夜）.md §7
--     「★source = 'backfill' を 持たせる
--      ★表示には 出す（★小さく「あとから書いた」）
--      ★★Eの判定からは、★既定で 外す」
--   ★坂本さんのお決め（2026-09-09）
--     「source（live/later/import）の欄。★境目は『翌日23:59まで』」
--
--   ★★Supabase の SQL Editor に、この全文を貼って実行してください。
--   ★★何度実行しても安全です。★BEGIN も ROLLBACK も 使いません
--     （★SQL Editor は 巻き戻しません）。
--
-- ----------------------------------------------------------------------------
-- ★★決めたこと と、その わけ
--
--   ① ★これまでの行は、★NULL のままに します。★埋めません。
--      ★★いつ書かれたかを、★私たちは 知りません。
--        ★created_at はありますが、★それが「書いた時刻」だとは 言い切れません。
--      ★★埋めると、★「分かっている」と 嘘をつくことに なります。
--      ★NULL は「分からない」です。★読むときに、そう扱います。
--
--   ② ★印を つけるのは、★行が できる ときだけ です（★before insert）。
--      ★★あとから 直しても、★印は 変わりません。
--        ★★これが 肝です。★今日 書いた記録を、★来月 直したとき、
--        ★「あとから書いた」に 変わってしまっては いけません。
--        ★変わる作りだと、★直すたびに 判定から 外れていきます。
--      ★だから、★画面からは source を 送りません。★データベースが 決めます。
--
--   ③ ★境目は「翌日の 23:59:59」まで（★日本時間）。
--      ★その日のうちに 書けなくても、★翌日に 書けば「そのとき」の記録です。
--      ★★2日 空いたら、★思い出して 書いたものです。
--
--   ④ ★取り込み（import）だけは、★呼ぶ側が 先に 入れます。
--      ★引き金は、★入っているものを 上書きしません。
--
--   ⑤ ★★新しい列には、★これまでの列の 権限が 付きません。
--      ★profiles で 一度 403 になった原因が、これでした。
--      ★下の ⑤ で、★列ごとの 権限が 要るかを 調べます。
-- ============================================================================


-- ---------------------------------------------------------------------------
-- ①【いまの姿を 見る】★先に 走らせても かまいません。★読むだけです。
-- ---------------------------------------------------------------------------
select
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'entries' and column_name = 'source')
                                                    as "source の列 (0=まだ無い)",
  (select count(*) from public.entries)             as "entries の行数",
  (select count(*) from pg_trigger
    where tgname = 'entries_set_source')            as "引き金 (0=まだ無い)";


-- ---------------------------------------------------------------------------
-- ②【列を 足す】★これまでの行は NULL のままです。★埋めません。
-- ---------------------------------------------------------------------------
alter table public.entries
  add column if not exists source text;

-- ★決まった言葉しか 入りません。★画面だけで 守りません。
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'entries_source_check') then
    alter table public.entries
      add constraint entries_source_check
      check (source is null or source in ('live', 'later', 'import'));
  end if;
end $$;

comment on column public.entries.source is
  'その記録が いつ書かれたか。live=その日〜翌日23:59 ／ later=それより後 ／ import=まとめて取り込んだもの。'
  '★NULL は「分からない」（この列より前の記録）。★埋めないこと。'
  '★行ができるときだけ入る。あとから直しても変わらない。';


-- ---------------------------------------------------------------------------
-- ③【印を つける 引き金】★行が できる ときだけ
--
--   ★★あとから 直しても、★印は 変わりません（★before insert だけ）。
--   ★★呼ぶ側が 先に 入れていたら（import）、★そのまま 残します。
-- ---------------------------------------------------------------------------
create or replace function public.entries_set_source()
returns trigger
language plpgsql
as $$
begin
  -- ★入っているものを 上書きしない（★取り込みは 呼ぶ側が 決めます）。
  if new.source is not null then
    return new;
  end if;
  -- ★境目は「翌日の 23:59:59」まで（★日本時間）。
  --   ★date + 2 の 0時00分より 前なら、★翌日の 23:59:59 までに 入っています。
  if (now() at time zone 'Asia/Tokyo') < ((new.date + 2)::timestamp) then
    new.source := 'live';
  else
    new.source := 'later';
  end if;
  return new;
end $$;

drop trigger if exists entries_set_source on public.entries;
create trigger entries_set_source
  before insert on public.entries
  for each row execute function public.entries_set_source();


-- ---------------------------------------------------------------------------
-- ④【権限】★新しい列には、★これまでの列の 権限が 付きません
--
--   ★★まず、★列ごとの 権限が 使われているかを 見ます（★下の ⑤-2）。
--   ★★表ぜんぶへの 権限で 動いているなら、★ここは 何も しなくて 済みます。
--   ★★列ごとだったなら、★下の1行の コメントを 外して 走らせてください。
-- ---------------------------------------------------------------------------
-- grant update (source) on public.entries to authenticated;
-- ★★ただし、★画面からは source を 送りません（★②の わけ）。
--   ★だから、★update の権限は、★本当は 要りません。
--   ★要らない権限を 足さない、が 既定です。★困ったときだけ 外してください。


-- ---------------------------------------------------------------------------
-- ⑤【確かめ】★ここから下は 読むだけです。★何も 書きません。
-- ---------------------------------------------------------------------------

-- ⑤-1 列と 引き金が できたか。★これまでの行が NULL のままか。
select
  (select count(*) from information_schema.columns
    where table_schema = 'public' and table_name = 'entries' and column_name = 'source')
                                                          as "source の列 (1が正しい)",
  (select count(*) from pg_trigger where tgname = 'entries_set_source')
                                                          as "引き金 (1が正しい)",
  (select count(*) from public.entries where source is null)
                                                          as "★NULL のままの行（★これまでの記録）",
  (select count(*) from public.entries where source is not null)
                                                          as "★印が ついた行（★0が正しい・まだ書いていないので）";

-- ⑤-2 ★列ごとの 権限が 使われているか。
--      ★★1行も 返らなければ、★表ぜんぶの権限で 動いています（★④は 不要）。
--      ★★何か 返ったら、★④の grant が 要ります。
select grantee as "相手", privilege_type as "権限", column_name as "列"
  from information_schema.column_privileges
 where table_schema = 'public' and table_name = 'entries'
   and grantee in ('anon', 'authenticated')
 order by grantee, column_name
 limit 20;

-- ⑤-3 ★anon に、★1つも 残っていないこと（★0行が 正しい姿）。
select grantee as "★anon にまだ残っている権限", privilege_type as "権限"
  from information_schema.role_table_grants
 where table_schema = 'public' and table_name = 'entries' and grantee = 'anon';

-- ⑤-4 ★決まった言葉しか 入らないこと。
--      ★★これは わざと 失敗させる 照会です。★エラーが 出るのが 正しい姿です。
--      ★確かめたいときだけ、★コメントを 外して 走らせてください。
--      ★（★user_id は ご自分のものに 置き換えてください）
-- insert into public.entries (user_id, date, source)
--   values (auth.uid(), '2020-01-01', 'でたらめ');
--   → ★「entries_source_check」で はじかれるのが 正しい動きです。
