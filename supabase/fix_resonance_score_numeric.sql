-- ============================================================================
-- resonance_score を numeric に広げる（⑥が integer だったときだけ動きます）
--
--   声の出来スライダーは 0〜10 を 0.5 刻みで動きます。
--   その 0.5 は、利用者が実際に選んだ分解能です。丸めて捨てません。
--   ★値を丸めるのではなく、列のほうを広げます。
--
--   integer → numeric は情報を失いません。今ある整数はそのまま残ります。
--   ★列の型を変えると表が書き直されます。entries の行数ぶん時間がかかります
--     （数千行なら一瞬です）。実行中は保存が一瞬待たされることがあります。
--
--   ★何度実行しても同じ結果になります。
--     既に numeric なら「対象外」と表示して、何もしません。
-- ============================================================================

do $$
declare
  t text;
begin
  select data_type into t
    from information_schema.columns
   where table_schema = 'public' and table_name = 'entries'
     and column_name = 'resonance_score';

  if t is null then
    raise notice 'resonance_score という列がありません。何もしません。';
  elsif t = 'integer' or t = 'smallint' or t = 'bigint' then
    execute 'alter table public.entries alter column resonance_score type numeric';
    raise notice 'resonance_score を % から numeric に広げました', t;
  else
    raise notice '対象外です（resonance_score は既に % です）', t;
  end if;
end $$;

-- 確認: 型と、いま入っている値の範囲
select data_type as "型" from information_schema.columns
 where table_schema='public' and table_name='entries' and column_name='resonance_score';

select count(*) as "行数",
       count(resonance_score) as "値がある行",
       min(resonance_score) as "最小", max(resonance_score) as "最大",
       count(*) filter (where resonance_score <> round(resonance_score)) as "小数が入っている行"
  from public.entries;
