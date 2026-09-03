-- ============================================================================
-- 契約したプランと、そのときの価格（2026-09-04）
--
--   ★なぜ要るか
--     ★未成年に売る形 §10：★「表示していた価格」を記録すること。
--     ★あとで値上げしたとき、★そのとき何円で契約したかが争点になります。
--     ★★プランが分からないと、それも書けません。
--
--   ★どちらも、★webhook（service_role）が書きます。
--     ★利用者は書きません。★列ごとの権限を与えません。
--     ★subscriptions は、もともと本人の SELECT だけです。
--
--   ★何度実行しても、同じ結果になります。★行の中身には触れません。
--   ★★埋め戻しません。★いまある行は null のままです。
--     ★いま契約している人は、いません（本番で決済は動いていません）。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ⓪ 実行前の記録
-- ---------------------------------------------------------------------------
select column_name as "列", data_type as "型", is_nullable as "null を許すか"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'subscriptions'
 order by ordinal_position;

-- ---------------------------------------------------------------------------
-- ① 列を足します
--
--   ★plan                 monthly / annual。★lib/plans.js の名前と同じ文字列。
--   ★contracted_price_yen 契約したときに、★実際に請求された額（税込・円）。
--     ★★プランの表に書いてある数字ではありません。
--       ★表を書き換えても、★契約の記録は変わってはいけません。
--     ★Stripe の item の金額を、そのまま入れます。
-- ---------------------------------------------------------------------------
alter table public.subscriptions
  add column if not exists plan text,
  add column if not exists contracted_price_yen integer;

comment on column public.subscriptions.plan is
  '契約したプラン。monthly / annual。★lib/plans.js の名前と同じ文字列。'
  '★webhook が、契約時の metadata から入れる。★価格から逆算しない。';

comment on column public.subscriptions.contracted_price_yen is
  '契約したときに実際に請求された額（税込・円）。'
  '★未成年に売る形 §10「表示していた価格」。'
  '★★プランの表の数字ではなく、Stripe の item の金額を入れる。'
  '★表を書き換えても、契約の記録は変わってはいけない。';

-- ---------------------------------------------------------------------------
-- ② 値の形
--
--   ★知らないプラン名を、入れさせません。
--   ★null は「まだ契約していない」または「古い行」です。
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_constraint
                  where conname = 'subscriptions_plan_values'
                    and conrelid = 'public.subscriptions'::regclass) then
    alter table public.subscriptions
      add constraint subscriptions_plan_values check (
        plan is null or plan in ('monthly', 'annual')
      );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- ③ 権限
--
--   ★利用者に、この2列を書かせません。★webhook（service_role）だけが書きます。
--   ★★「与えない」は「剥がした」ではありません（2026-09-03 の穴）。
--     ★先に表ぜんぶを剥がし、★それから要る列だけを与えます。
--   ★★subscriptions は、アプリから1文字も書いていません。
--     ★書いているのは webhook と checkout の route で、★どちらも service_role です。
--     ★ですから、authenticated からは★UPDATE と INSERT を、まとめて剥がします。
--     ★SELECT は残します。★本人が自分の契約を見るためです。
-- ---------------------------------------------------------------------------
revoke insert, update, delete on public.subscriptions from authenticated;
revoke all on public.subscriptions from anon;
revoke truncate, trigger, references on public.subscriptions from authenticated;

-- ---------------------------------------------------------------------------
-- ④ 確かめ
-- ---------------------------------------------------------------------------

-- ④-1 列ができていること（2行）
select column_name as "列", data_type as "型"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'subscriptions'
   and column_name in ('plan', 'contracted_price_yen')
 order by 1;

-- ④-2 ★authenticated に残っているのは SELECT だけであること
select grantee as "相手", privilege_type as "権限"
  from information_schema.table_privileges
 where table_schema = 'public' and table_name = 'subscriptions'
   and grantee in ('anon', 'authenticated')
 order by 1, 2;

-- ④-3 ★埋め戻していないこと（★人数は書き残さないこと。見るだけです）
select plan as "プラン", count(*) as "行数"
  from public.subscriptions
 group by plan
 order by 1 nulls first;

-- ============================================================================
-- ★このあと
--   ★Preview に、価格IDの環境変数を入れてください。
--     STRIPE_PRICE_ID_MONTHLY / STRIPE_PRICE_ID_ANNUAL
--   ★★古い STRIPE_PRICE_ID は、もう読まれません。
--     ★消しても構いません。★残っていても、害はありません。
--   ★★本番には、1つも入れないこと。
--     ★入れると、本番の checkout が 503 で止まる守りが外れます。
-- ============================================================================
