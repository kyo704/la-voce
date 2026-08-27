-- ============================================================================
-- events の INSERT ポリシーが2つある件を片づける
--
--   "Users can insert their own events"（前からあったもの）
--   "Users can insert own events"      （migration_events.sql が足したもの＝私）
--
--   ★400の原因ではありません。permissive なポリシーは OR で足されるので、
--     2つあっても挿入は通ります。紛らわしいだけです。
--
--   ★中身が同じときだけ消します。違っていたら、何もせずに知らせます。
--     「同じ名前に見えるから」で消すと、条件の違うほうを消しかねません。
-- ============================================================================

-- まず、2つの中身を並べて見る（消す前に必ず目で確かめてください）
select policyname as "ポリシー名", cmd as "対象", with_check as "with check"
  from pg_policies
 where schemaname = 'public' and tablename = 'events' and cmd = 'INSERT'
 order by policyname;

-- 中身が一致しているときだけ、私が足したほうを消す
do $$
declare
  mine text;
  theirs text;
begin
  select with_check into mine
    from pg_policies
   where schemaname='public' and tablename='events' and policyname='Users can insert own events';

  select with_check into theirs
    from pg_policies
   where schemaname='public' and tablename='events' and policyname='Users can insert their own events';

  if mine is null or theirs is null then
    raise notice '2つ揃っていないので、何もしません（mine=%, theirs=%）', mine, theirs;
  elsif mine is distinct from theirs then
    raise notice '★中身が違うので消しません。目で確かめてください。 mine=% / theirs=%', mine, theirs;
  else
    execute 'drop policy "Users can insert own events" on public.events';
    raise notice '同じ内容だったので、私が足したほうを消しました（元からあるほうを残しています）';
  end if;
end $$;

-- 消したあと、1つだけ残っていることを確かめる
select policyname as "残ったポリシー", cmd as "対象", with_check as "with check"
  from pg_policies
 where schemaname = 'public' and tablename = 'events'
 order by policyname;
