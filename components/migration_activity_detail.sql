-- La Voce: 追加マイグレーション（練習・公演の種類別詳細記録）
-- Supabaseの SQL Editor でこの内容を実行してください（既存のデータは消えません／何度実行しても安全です）。

alter table public.entries add column if not exists activity_detail jsonb default '{}'::jsonb;
