-- ============================================================================
-- 先生が生徒の記録を読む道を、消す（2026-09-01）
--
--   ★何をやめたのか
--     先生が、つながっている生徒の記録の中身を★常時見られる仕組みです。
--     声・症状・睡眠・活動の中身が、先生の画面に出ていました。
--
--   ★なぜやめるのか（坂本さん・Opus の裁定）
--     共有したいときは、生徒さんが自分で書き出して、アプリの外で渡します。
--     お医者さんに紙を1枚渡すのと同じで、★1回きりです。
--     「いつでも見られる」は、渡すこととは別のことでした。
--
--   ★無効化ではなく削除します
--     cycle_periods と同じ考え方です。「いまは何も返さない関数」を残すと、
--     ★あとから条件を1行足すだけで復活します。
--     道そのものを無くせば、設定を間違えようがありません。
--
--   ★何度実行しても同じ結果になります。
--   ★記録（entries）には一切触れません。1行も消しません。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 実行前の状態（★記録として残してください）
-- ---------------------------------------------------------------------------
select p.proname as "関数名",
       pg_get_function_identity_arguments(p.oid) as "引数"
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'get_student_entries';

select count(*) as "有効な紐付け（0のはずです）"
  from public.teacher_student_links where status = 'active';

-- ---------------------------------------------------------------------------
-- ② 関数を消す
--
--   ★引数の組み合わせが違うものが複数あっても、まとめて消します。
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'get_student_entries'
  loop
    execute format('drop function if exists %s', r.sig);
    raise notice '削除しました: %', r.sig;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- ③ 共有範囲の値を消す
--
--   ★列は残します。消すのは値だけです。
--     列を落とすと、過去に何があったかの手がかりまで消えます。
--   ★本番の紐付けは0件でした。実際に消える行はありません。
--     それでも流します。「やった」という記録が要るためです。
-- ---------------------------------------------------------------------------
update public.teacher_student_links
   set share_scope = null
 where share_scope is not null;

comment on column public.teacher_student_links.share_scope is
  '★2026-09-01 に廃止。共有範囲という考え方そのものを無くしたので、'
  'これから先ここに値は入らない。★参照して何かを見せないこと。'
  '列を残しているのは、過去に何があったかの手がかりのため。';

-- ---------------------------------------------------------------------------
-- ④ 確かめる
-- ---------------------------------------------------------------------------
-- ★0行であること（関数が消えている）
select p.proname as "★残っている関数（0行であること）"
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'get_student_entries';

-- ★0であること（共有範囲の値が消えている）
select count(*) as "★共有範囲が入ったままの紐付け（0であること）"
  from public.teacher_student_links
 where share_scope is not null;

-- 紐付けそのものは残っていること（レッスンの予定のために要ります）
select count(*) as "紐付けの総数（消していません）"
  from public.teacher_student_links;
