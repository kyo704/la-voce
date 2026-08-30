-- ============================================================================
-- 嗜好品（たばこ・お酒）の記録
--
--   出典 docs/lavoce-用語辞書の拡張と嗜好品の記録.md §7
--
--   あり = true ／ なし = false
--   ★null は「答えていない」。false（しなかった）とは別の意味です。
--     既定値を入れないこと。入れると、答えなかった日が
--     「しなかった日」として集計に混ざります。
--
--   ★本数・量・銘柄は保存しません（§7-2）。二値で足ります。
--     聞いた瞬間に、責められている画面になります。
--
--   ★未成年には欄ごと出しません（lib/ageGate.js の mayShowLuxuryFields）。
--     年齢に答えていない人にも出しません（フェイルクローズ）。
--
--   ★先生には共有しません（lib/shareScope.js で null、
--     RPC の scope にも入れていません）。
--
--   ★既存の食事タグ「遅い時間にお酒」は消しません（§7-3）。
--     あちらは逆流、こちらは脱水・粘膜。★別の族として扱い、二重に数えません。
--
--   ★何度実行しても同じ結果になります。
-- ============================================================================

alter table public.entries
  add column if not exists smoked_today boolean;

alter table public.entries
  add column if not exists drank_today boolean;

comment on column public.entries.smoked_today is
  'その日たばこを吸ったか。true=あり / false=なし / ★null=答えていない。本数は聞かない（用語辞書の拡張と嗜好品の記録.md §7-2）。★未成年には出さない。★先生に共有しない。';
comment on column public.entries.drank_today is
  'その日お酒を飲んだか。true=あり / false=なし / ★null=答えていない。量は聞かない。★食事タグ「遅い時間にお酒」とは別の族（§7-3）。★未成年には出さない。★先生に共有しない。';

-- 確認（★既定値が空で、既存の行は全部 null であること）
select column_name as "列", data_type as "型", is_nullable as "null可",
       column_default as "既定値（★空であること）"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'entries'
   and column_name in ('smoked_today', 'drank_today')
 order by column_name;

select count(*) as "記録の総数",
       count(smoked_today) as "たばこに答えた日（★いまは0）",
       count(drank_today)  as "お酒に答えた日（★いまは0）"
  from public.entries;
