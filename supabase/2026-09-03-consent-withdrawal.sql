-- ============================================================================
-- 同意の撤回（2026-09-03・期日 9/10）
--
--   ★2026-08-26 から、画面にこう書いてありました。
--     「同意はいつでも『もっと ＞ 設定』から撤回できます」
--   ★その道が、この日まで1つもありませんでした。
--
--   ★このSQLですること
--     ① profiles に、撤回の時刻の列を足す（★正はこちらです）
--     ② consent_records を★足すだけの表にする
--        （UPDATE のポリシーと権限を剥がします）
--
--   ★何度実行しても、同じ結果になります。
--   ★記録（entries）にも、既存の同意の行にも、一切触れません。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ⓪ 実行前の記録
-- ---------------------------------------------------------------------------
select policyname as "ポリシー", cmd as "操作"
  from pg_policies
 where schemaname = 'public' and tablename = 'consent_records'
 order by cmd, policyname;

select grantee as "相手", privilege_type as "権限"
  from information_schema.table_privileges
 where table_schema = 'public' and table_name = 'consent_records'
   and grantee in ('anon','authenticated')
 order by 1, 2;

-- ---------------------------------------------------------------------------
-- ① 撤回の時刻
--
--   ★null が「撤回していない」です。
--   ★埋め戻しません。★「撤回していない」と「まだ決めていない」を
--     ★分けられなくなるためです。
--   ★同意した日時（consent_health_data_at）は、そのまま残します。
--     ★消すと「いつ同意したか」が分からなくなります。
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists consent_health_data_withdrawn_at timestamptz;

comment on column public.profiles.consent_health_data_withdrawn_at is
  '健康の記録の同意を撤回した時刻。★null は「撤回していない」。'
  '★いまの状態は、この列が正（2026-09-03 の決定）。'
  '★consent_records は歴史を持つ。いまの状態は持たない。';

-- ---------------------------------------------------------------------------
-- ② consent_records を、足すだけの表にする
--
--   ★同意 → 撤回 → もう一度同意 が、★行として並びます。
--   ★行を書き換えません。★書き換えると、履歴が履歴でなくなります。
--   ★「使わない」と決めたら、★使えなくすること。
--     ★残すと、いつか使われます。★コメントアウトは、防護ではありません。
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select policyname
      from pg_policies
     where schemaname = 'public' and tablename = 'consent_records'
       and cmd = 'UPDATE'
  loop
    execute format('drop policy if exists %I on public.consent_records', r.policyname);
    raise notice '★消しました: %', r.policyname;
  end loop;
end $$;

revoke update on public.consent_records from authenticated;
revoke update on public.consent_records from anon;
-- ★anon には、そもそも用がありません。まとめて剥がします。
revoke all    on public.consent_records from anon;
-- ★TRUNCATE は RLS が効きません。1文で表が空になります。
revoke truncate, trigger, references on public.consent_records from authenticated;
-- ★DELETE も剥がします。★退会のときは service_role が消します
--   （lib/accountDeletion.js の USER_OWNED_TABLES に入っています）。
revoke delete on public.consent_records from authenticated;

-- ---------------------------------------------------------------------------
-- ③ 確かめ
-- ---------------------------------------------------------------------------

-- ③-1 列ができていること（1行）
select column_name as "列", data_type as "型", is_nullable as "nullを許すか"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'profiles'
   and column_name = 'consent_health_data_withdrawn_at';

-- ③-2 ★UPDATE のポリシーが残っていないこと（0行）
select policyname as "★まだ残っている UPDATE のポリシー"
  from pg_policies
 where schemaname = 'public' and tablename = 'consent_records' and cmd = 'UPDATE';

-- ③-3 残ってよいのは SELECT と INSERT だけ
select policyname as "残っているポリシー", cmd as "操作"
  from pg_policies
 where schemaname = 'public' and tablename = 'consent_records'
 order by cmd;

-- ③-4 ★権限は SELECT と INSERT だけ（authenticated）／anon は0行
select grantee as "相手", privilege_type as "権限"
  from information_schema.table_privileges
 where table_schema = 'public' and table_name = 'consent_records'
   and grantee in ('anon','authenticated')
 order by 1, 2;

-- ============================================================================
-- ★このあと
--   ★画面側は、もう入っています（VocalTracker.jsx）。
--     ★このSQLを当てるまで、撤回のボタンは
--       ★「撤回できませんでした」と出ます（列が無いためです）。
--     ★黙って失敗はしません。0行を見ています。
--
--   ★まだ無いもの（★台帳07に、日付つきで書いてあります）
--     ★サーバ側の門。いまは画面側だけです。
--     ★health.record 以外の目的（周期・食事と就寝・研究）の撤回。
-- ============================================================================
