-- ============================================================================
-- events の古い列（event_type / payload）の NOT NULL を外す
--
-- 【なぜ必要か】
--   migration_events.sql で、仕様どおりの列（name / props / at）を足しました。
--   そのとき、写し違いがあったときに戻せるよう、古い列をわざと残しました。
--   ★残しただけで、NOT NULL を外していませんでした。私の抜けです。
--   アプリ（lib/events.js）は name / props しか送らないので、
--   event_type が NOT NULL のままだと、挿入のたびに 23502 で 400 になります。
--
-- 【この操作で何が起きるか】
--   ・列は消しません。中身も消しません。今ある行はそのまま残ります。
--   ・これから入る行では、古い列が空（null）になります。
--     新しい行の内容は name / props にすべて入るので、失われるものはありません。
--   ・列そのものを消すのは、name への写しが正しいと確かめたあとで構いません。
--
-- ★何度実行しても同じ結果になります（既に外れていれば何もしません）。
-- ★確認だけ先にしたいときは check_save_400.sql の ④ を実行してください。
-- ============================================================================

do $$
declare
  col text;
begin
  foreach col in array array['event_type', 'payload', 'created_at'] loop
    if exists (
      select 1 from information_schema.columns
       where table_schema = 'public'
         and table_name   = 'events'
         and column_name  = col
         and is_nullable  = 'NO'
    ) then
      execute format('alter table public.events alter column %I drop not null', col);
      raise notice '% の NOT NULL を外しました', col;
    else
      raise notice '% は対象外でした（列が無いか、既に NULL 可）', col;
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 確認: すべての列が NULL 可になっているか
--   ★ここで id / user_id / props / at が NO のままなのは正常です。
--     これらはアプリが必ず送る列、または既定値のある列です。
-- ---------------------------------------------------------------------------
select column_name as "列",
       is_nullable as "NULL可",
       column_default as "既定値"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'events'
 order by ordinal_position;
