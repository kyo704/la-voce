-- ============================================================================
-- 気温・湿度の出どころ（weather_source）
--
--   出典 Opus の判断（2026-09-01）／lib/weatherCarry.js
--
--   'entered'  本人がその日に入れた値
--   'carried'  前の日から引き継いだ値
--   ★null      どちらでもない（記録していない日・移行前のすべての行）
--
--   ★既存の行には、いっさい触れません。
--     いま気温・湿度が空いている日を、この仕組みで埋めないでください。
--     「記録しなかった」と「引き継いだ」は別の事実です。
--     ★UPDATE は1行も書きません。既定値も入れません。
--
--   ★既定値を入れてはいけない理由
--     default 'entered' にすると、過去のすべての行が
--     「本人が入れた」ことになります。実際には分かりません。
--     null のままにして、「移行前なので不明」を保ちます。
--
--   ★何度実行しても同じ結果になります。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 実行前に数える（★実行の記録として残してください）
-- ---------------------------------------------------------------------------
select count(*) as "記録の総数",
       count(*) filter (where temperature is not null and humidity is not null)
         as "気温と湿度が両方ある日",
       count(*) filter (where temperature is null or humidity is null)
         as "どちらか欠けている日（★この数は変わりません）"
  from public.entries;

-- ---------------------------------------------------------------------------
-- ② 列を足す（★既定値なし・UPDATE なし）
-- ---------------------------------------------------------------------------
alter table public.entries
  add column if not exists weather_source text;

-- 知らない値が入らないようにする
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'entries_weather_source_check') then
    alter table public.entries
      add constraint entries_weather_source_check
      check (weather_source is null or weather_source in ('entered', 'carried'));
  end if;
end $$;

comment on column public.entries.weather_source is
  '気温・湿度の出どころ。entered=本人が入れた / carried=前の日から引き継いだ / ★null=不明（移行前・未記録）。正は lib/weatherCarry.js。★引き継ぎは3日まで。★carried の日は快適帯の判定を出さない。★carried が半分を超える期間では、絶対湿度を説明変数に使わない。';

-- ---------------------------------------------------------------------------
-- ③ 確認（★既定値が空で、既存の行は全部 null であること）
-- ---------------------------------------------------------------------------
select column_name as "列", data_type as "型", is_nullable as "null可",
       column_default as "既定値（★空であること）"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'entries'
   and column_name = 'weather_source';

select coalesce(weather_source, '(null＝移行前・未記録)') as "出どころ",
       count(*) as "日数"
  from public.entries
 group by 1
 order by 2 desc;

-- ★①の「どちらか欠けている日」と、この結果が変わっていないことを確かめてください。
select count(*) as "気温か湿度が欠けている日（★①と同じであること）"
  from public.entries
 where temperature is null or humidity is null;
