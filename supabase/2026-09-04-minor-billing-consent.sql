-- ============================================================================
-- 未成年の方の、有料機能への同意（2026-09-04）
--
--   出どころ docs/opus/lavoce-判断-未成年に売ること（9月4日）.md §10
--            docs/opus/lavoce-判断-同意を前に出すこと（9月4日・追補）.md §9
--
--   ★★列と表の名前は declared です。★obtained ではありません。
--     ★得たかどうかを、アプリは知りません。
--     ★★申告されたことだけを知っています。
--     ★名前を間違えると、半年後に誰かがこう言います。
--       「この利用者は保護者の同意を得ています」──★得ていないかもしれません。
--   ★★このフラグを、判断の根拠にしないこと。
--     ★記録として持ちますが、★これを見て「だから大丈夫」とはしません。
--
--   ★同意画面は、取消権を封じません。
--     ★いちばん効くのは★返金の約束です。
--
--   ★何度実行しても、同じ結果になります。★行の中身には触れません。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① profiles に、申告のしるし
--
--   ★null は「まだ申告されていない」です。★埋め戻しません。
--   ★これは★いまの状態です。★歴史は、下の表が持ちます。
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists guardian_consent_declared_at timestamptz;

comment on column public.profiles.guardian_consent_declared_at is
  '保護者の同意を得た、と★申告された時刻。★null は未申告。'
  '★★得たかどうかは分からない。申告されたことだけが分かる。'
  '★これを判断の根拠にしないこと。';

-- ---------------------------------------------------------------------------
-- ② 記録の表（§10 の4項目）
--
--   ★足すだけの表です。★書き換えません。
--   ★★「表示していた価格」を落とさないこと。
--     ★あとで値上げしたとき、★そのとき何円で契約したかが争点になります。
--   ★生年月日は持ちません。★帯だけです。
-- ---------------------------------------------------------------------------
create table if not exists public.minor_billing_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  -- ★契約したときの年齢帯。★生年月日ではありません。
  age_band text not null,
  -- ★同意画面の版。★文面を変えたら、版を上げること。
  policy_version text not null,
  -- ★★表示していた価格（税込・円）。★落とさないこと。
  displayed_price_yen integer not null,
  -- ★どのプランで申し込もうとしたか。
  plan text not null,
  declared_at timestamptz not null default now()
);

comment on table public.minor_billing_consents is
  '未成年の方が、有料機能に進む前に押した申告の記録。★足すだけ。'
  '★★保護者の同意を「得た」記録ではない。「得たと申告された」記録。';

create index if not exists minor_billing_consents_user_idx
  on public.minor_billing_consents (user_id, declared_at desc);

alter table public.minor_billing_consents enable row level security;

-- ---------------------------------------------------------------------------
-- ③ ポリシー
--
--   ★本人だけが、自分の行を読めます。
--   ★本人だけが、自分の行を足せます。
--   ★★UPDATE と DELETE は、ポリシーを1本も作りません。
--     ★足すだけの表だからです。
--     ★★「ポリシーの不在は1枚の板」なので、権限も剥がします（④）。
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'minor_billing_consents'
                 and policyname = 'minor_billing_consents_own_select') then
    create policy "minor_billing_consents_own_select"
      on public.minor_billing_consents for select
      using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public'
                 and tablename = 'minor_billing_consents'
                 and policyname = 'minor_billing_consents_own_insert') then
    create policy "minor_billing_consents_own_insert"
      on public.minor_billing_consents for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- ④ 権限（★板を2枚にします）
--
--   ★ポリシーが無いだけでは、1枚です。★権限も剥がして2枚にします。
--   ★★「与えない」は「剥がした」ではありません（2026-09-03 の穴）。
-- ---------------------------------------------------------------------------
revoke all on public.minor_billing_consents from anon;
revoke update, delete, truncate, trigger, references
  on public.minor_billing_consents from authenticated;
grant select, insert on public.minor_billing_consents to authenticated;

-- ---------------------------------------------------------------------------
-- ⑤ 確かめ
-- ---------------------------------------------------------------------------

-- ⑤-1 列と表ができていること
select column_name as "列", data_type as "型"
  from information_schema.columns
 where table_schema = 'public'
   and ((table_name = 'profiles' and column_name = 'guardian_consent_declared_at')
     or table_name = 'minor_billing_consents')
 order by table_name, ordinal_position;

-- ⑤-2 ★ポリシーは SELECT と INSERT の2本だけ（★UPDATE と DELETE は0本）
select policyname as "ポリシー", cmd as "操作", qual as "USING", with_check as "WITH CHECK"
  from pg_policies
 where schemaname = 'public' and tablename = 'minor_billing_consents'
 order by cmd;

-- ⑤-3 ★権限は SELECT と INSERT だけ／anon は0行
select grantee as "相手", privilege_type as "権限"
  from information_schema.table_privileges
 where table_schema = 'public' and table_name = 'minor_billing_consents'
   and grantee in ('anon', 'authenticated')
 order by 1, 2;

-- ⑤-4 ★台帳への登録（★忘れないこと）
--   01 削除処理    ★user_id を持つので USER_OWNED_TABLES へ
--   02 バックアップ ★critical は false（★契約の記録は Stripe 側にもあります）
--   03 auth 参照   ★user_id → cascade。★実物の制約を見てから書くこと
--   04 書き出し    ★★本人の書き出しに入れること。★本人の同意の記録です
--   05 外に出る経路 ★関係ありません
--   07 約束        ★「返金します」を、ここから引くこと

-- ============================================================================
-- ★このあと
--   ★台帳（01 / 02 / 03 / 04 / 07）に登録すること。★④と⑦を落とさないこと。
--   ★画面は、SQL を当ててから動きます。
--     ★当てるまでは「保存できませんでした」と出ます。★黙って失敗はしません。
-- ============================================================================
