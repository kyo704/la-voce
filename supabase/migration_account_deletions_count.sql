-- ============================================================================
-- 消えたアカウントの数だけを残す（管理画面のため）
--
--   ★残すのは時刻だけです。
--     user_id も、メールアドレスも、その断片も、ハッシュも入れません。
--     ★誰が消したかを、あとから知る手立てを作らないこと。
--
--   ★これは A-5 の監査ログ（誰が誰の健康データを見たか）とは別です。
--     年齢の答えの記録（age_answer_changes）とも別です。
--     ★同じ表にまとめないこと。目的が違います。
--
--   ★入るのは「本当に消したとき」だけです。
--     30日の猶予を申し出た時点では入りません。
--     猶予明けの定期処理でも、その場の完全削除でも、
--     どちらも purgeAccount を通るので、そこ1か所で記録します。
--
--   ★本人には読めません。読み書きするのは service_role だけです。
--     そのため、ポリシーを1つも作りません（RLS 有効・ポリシー無し）。
--
--   ★何度実行しても同じ結果になります。
-- ============================================================================

create table if not exists public.account_deletions (
  id uuid primary key default gen_random_uuid(),
  -- ★この列だけです。ほかの列を足さないでください。
  deleted_at timestamptz not null default now()
);

create index if not exists account_deletions_at_idx
  on public.account_deletions (deleted_at desc);

-- ★RLS を有効にし、ポリシーを1つも作りません。
--   これで、ふつうの利用者からは読むことも書くこともできません。
--   service_role（管理画面と削除の処理）だけが素通りします。
alter table public.account_deletions enable row level security;

comment on table public.account_deletions is
  '消えたアカウントの数を数えるためだけの表。★時刻以外の列を足さないこと。user_id・メール・ハッシュを入れないこと。ポリシーは作らない（service_role だけ）。';

-- ---------------------------------------------------------------------------
-- 確かめる
-- ---------------------------------------------------------------------------
-- ★列が deleted_at と id の2つだけであること
select column_name as "列", data_type as "型"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'account_deletions'
 order by ordinal_position;

-- ★ポリシーが0件であること
select count(*) as "ポリシーの数（0であること）"
  from pg_policies
 where schemaname = 'public' and tablename = 'account_deletions';

-- ★RLS が有効であること
select relrowsecurity as "RLSが有効か（trueであること）"
  from pg_class where oid = 'public.account_deletions'::regclass;
