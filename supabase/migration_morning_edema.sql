-- ============================================================================
-- 起きたときのむくみ（中核5項目 §2-2②）
--
--   出典 docs/lavoce-中核5項目が埋まっているかと画面の文字量.md §2-2②
--        lib/analysisFamilies.js（★中核5項目の⑤。これまで
--        「記録する場所がまだありません」と書かれていた欄です）
--
--   なし = 0 ／ 少し = 1 ／ はっきり = 2
--   ★null は「答えていない」。0（なし）とは別の意味です。
--     既定値を入れないこと。0 を既定にすると、
--     「むくみが無かった日」と「答えなかった日」の区別が消えます。
--
--   ★既存の行は触りません。全部 null のままです。
--   ★何度実行しても同じ結果になります。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 列を足す
-- ---------------------------------------------------------------------------
alter table public.entries
  add column if not exists morning_edema smallint;

-- 3択のいずれか、または未回答（null）だけを許す
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'entries_morning_edema_check') then
    alter table public.entries
      add constraint entries_morning_edema_check
      check (morning_edema is null or morning_edema in (0, 1, 2));
  end if;
end $$;

comment on column public.entries.morning_edema is
  '起きたときのむくみ。なし=0 / 少し=1 / はっきり=2。★null は「答えていない」で、0とは別。分析では「なし / あり(1以上)」の二値にする（lib/analysisFamilies.js 中核5項目の⑤）。';

-- ---------------------------------------------------------------------------
-- ② 確認（★列ができて、既存の行は全部 null であること）
-- ---------------------------------------------------------------------------
select column_name as "列", data_type as "型", is_nullable as "null可",
       column_default as "既定値（★空であること）"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'entries'
   and column_name = 'morning_edema';

select count(*) as "記録の総数",
       count(morning_edema) as "むくみに答えた日（★いまは0）"
  from public.entries;
