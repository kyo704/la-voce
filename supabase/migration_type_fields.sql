-- ============================================================================
-- 型ごとの追加項目の置き場所（職業を声の型で切り直す.md §5-2・§9）
--
--   ★1列だけ足します。項目ごとに列を作りません。
--     entries は既に58列あり、分析に入らない項目で5列増やすのは重すぎます。
--     activity_detail / load_detail と同じ、jsonb の置き場所にします。
--
--   ★中身の鍵は lib/typeFields.js が決めます（唯一の正）。
--       passaggioDifficulty / highNoteEase        sing
--       scriptVolume / longestTalkMinutes         speak
--       projectedVoiceMinutes                     project
--
--   ★この項目は分析に入れません（§9）。検定に入れると族が増え、
--     検出力が落ちます。当面は記録だけです。
--
--   ★どれも任意です。空欄のまま保存できます（§5-2・§10-7）。
--
--   ★何度実行しても同じ結果になります。
-- ============================================================================

alter table public.entries
  add column if not exists type_fields jsonb;

comment on column public.entries.type_fields is
  '型ごとの追加項目（歌う/話す/張る）。鍵の正は lib/typeFields.js。★v1では分析に入れないこと。';

-- 確認
select column_name as "列", data_type as "型"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'entries'
   and column_name = 'type_fields';
