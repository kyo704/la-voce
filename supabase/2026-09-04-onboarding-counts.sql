-- ============================================================================
-- 導線の数（2026-09-04）
--
--   出どころ docs/opus/lavoce-仕様-ホーム画面までの動線・画面と文言（9月4日）.md §9
--
--   ★★外部の解析サービスを入れません。★経路が増えます。
--     ★自分のところに、★日ごとの数だけを持ちます。
--
--   ★★個人を特定しません。
--     ・user_id を持ちません
--     ・IP を持ちません
--     ・端末の識別子を持ちません
--     ★★持てないようにします。★列がありません。
--
--   ★人数ではありません。★回数です。
--     ★同じ方が2回開けば、2 です。
--     ★★「◯人が落ちた」とは言えません。「◯回」です。
--
--   ★何度実行しても、同じ結果になります。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 表
--
--   ★★列は3つだけです。★増やさないこと。
--     ★増やした瞬間に、★「個人を特定しない」が崩れます。
-- ---------------------------------------------------------------------------
create table if not exists public.onboarding_counts (
  day date not null,
  step text not null,
  n integer not null default 0,
  primary key (day, step)
);

comment on table public.onboarding_counts is
  '導線のどこで落ちているかの、日ごとの回数。'
  '★★個人を特定しない。user_id も IP も端末の識別子も持たない。'
  '★人数ではなく回数。★列を増やさないこと。';

alter table public.onboarding_counts enable row level security;

-- ---------------------------------------------------------------------------
-- ② ポリシーと権限
--
--   ★★ポリシーを1本も作りません。
--     ★利用者は、読むことも書くこともありません。
--     ★見るのは運営者だけで、★SQL エディタ（service_role）から見ます。
--   ★★「ポリシーの不在は1枚の板」なので、★権限も剥がして2枚にします。
-- ---------------------------------------------------------------------------
revoke all on public.onboarding_counts from anon;
revoke all on public.onboarding_counts from authenticated;

-- ---------------------------------------------------------------------------
-- ③ 1つ増やす関数
--
--   ★★読んでから書く形にしないこと。
--     ★同じ瞬間に2人が開くと、★片方が消えます。
--   ★insert ... on conflict do update で、1文にします。
--
--   ★知らない段の名前は、★ここでも弾きます。
--     ★★アプリ側でも弾いていますが、★2枚にします。
-- ---------------------------------------------------------------------------
create or replace function public.bump_onboarding_count(p_day date, p_step text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_step is null or p_step not in (
    'landing', 'add_to_home_shown', 'add_to_home_skipped', 'standalone_opened',
    'register_started', 'register_completed', 'first_entry_saved',
    'android_install_shown', 'android_install_accepted'
  ) then
    raise exception 'UNKNOWN_STEP';
  end if;

  insert into public.onboarding_counts (day, step, n)
  values (p_day, p_step, 1)
  on conflict (day, step) do update set n = public.onboarding_counts.n + 1;
end;
$$;

-- ★関数は、既定で PUBLIC が実行できます。★先に剥がします。
--   ★★呼ぶのは、サーバの route（service_role）だけです。
--     ★利用者の側から、直に呼ばせません。
revoke all on function public.bump_onboarding_count(date, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- ④ 確かめ
-- ---------------------------------------------------------------------------

-- ④-1 列は3つだけであること
select column_name as "列", data_type as "型"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'onboarding_counts'
 order by ordinal_position;

-- ④-2 ★ポリシーが0本であること（★RLS は有効・★誰も通れない）
select policyname as "★あってはいけないポリシー"
  from pg_policies
 where schemaname = 'public' and tablename = 'onboarding_counts';

-- ④-3 ★権限が0行であること
select grantee as "★あってはいけない権限", privilege_type
  from information_schema.table_privileges
 where table_schema = 'public' and table_name = 'onboarding_counts'
   and grantee in ('anon', 'authenticated');

-- ④-4 ★関数を、利用者から呼べないこと（どちらも false）
select has_function_privilege('authenticated', p.oid, 'EXECUTE') as "authenticated",
       has_function_privilege('anon', p.oid, 'EXECUTE') as "anon"
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'bump_onboarding_count';

-- ---------------------------------------------------------------------------
-- ⑤ 見るとき（★運営者が、SQL エディタから）
-- ---------------------------------------------------------------------------
-- select day as "日", step as "段", n as "回数"
--   from public.onboarding_counts
--  where day >= current_date - 14
--  order by day desc, step;
--
-- ★★いちばん大きい落ち込みが、★次に直す場所です。
-- ★人数ではありません。★回数です。読み違えないこと。

-- ============================================================================
-- ★台帳への登録
--   01 削除処理    ★関係ありません（★user_id を持ちません）
--   02 バックアップ ★入れます。critical は false
--   03 auth 参照   ★関係ありません
--   04 書き出し    ★★関係ありません。★本人のデータではありません
--   05 外に出る経路 ★関係ありません（★外へ出しません）
--   07 約束        ★「外部の解析サービスを入れません」を書くこと
-- ============================================================================
