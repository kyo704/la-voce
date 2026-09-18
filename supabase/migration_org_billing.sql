-- ===========================================================================
-- ★org_billing ── ★学校の ご請求を 置く ところ
--
--   ★出どころ 裁定 その74（★2026-09-18・暫定）
--     ★★DECISION_A_PLACE … ★`org_billing` を 新設。
--       ★`organizations` に 列を 足しません ──
--         ★★請求は 履歴が 要る。★`organizations` は 1行1学校。
--         ★★RLS が ちがう（★organizations＝在籍者 ／ 請求＝`bill` を 持つ 方）。
--         ★★列を 混ぜると、★在籍者に 金額が 見えます。
--     ★★DECISION_B_ATESAKI … ★宛先は 1人。★いまの 宛先が 指名し、
--       ★その 瞬間に 移ります（★1方向）。★承諾の 表は 作りません。
--       ★記録は `atesaki_changed_at` / `atesaki_changed_by` の 2列 だけ。
--
--   ★★何度 走らせても 同じに なります（★`if not exists` ／ 存在を 見てから）。
--   ★★`BEGIN` も `ROLLBACK` も 使って いません（★2026-09-15 の 一件）。
--     ★★Supabase の SQL エディタは 戻しませんでした。★戻せる つもりに させません。
--
--   ★★★決まりを、★表と **同じ 紙** に 書いて います（★裁定 その72 §13）。
--     ★★別の 紙に すると、★表 だけ 走って 決まりが 付きません。
--     ★★その 隙に、★誰でも 読める 表が 本番に 立ちます。
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 【一】★表
--
--   ★★`id` は 行ごと です。★1学校に 何行でも 置けます（★履歴の ため）。
--   ★★いまの 1行を どう 決めるかは、★画面の 仕事 です
--     （★`created_at` の いちばん 新しい 1行）。
--     ★★ここでは 決めません。★決めを 2か所に 置かない ため です。
-- ---------------------------------------------------------------------------
create table if not exists public.org_billing (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references public.organizations(id) on delete cascade,

  -- ★ご請求の 宛先（名義）── ★1人 だけ（★裁定 その74 B）
  atesaki_name       text,
  atesaki_email      text,
  atesaki_user_id    uuid references auth.users(id) on delete set null,
  atesaki_changed_at timestamptz,
  atesaki_changed_by uuid references auth.users(id) on delete set null,

  -- ★お支払い
  stripe_customer_id text,
  method             text,
  next_billing_date  date,

  -- ★領収書に 出す もの（★裁定 その74 追補・2026-09-18）
  --
  --   ★★★坂本さんは、★いま インボイスの 登録事業者では ありません。
  --     ★★だから `invoice_no` は **null の まま** です。
  --     ★★列だけ 先に 置きます。★登録した 日に、★入れる だけに します。
  --   ★★★null を 空の 字（''）に しません。
  --     ★★「まだ 決めて いない」と「番号が 無い」は ちがいます。
  --     ★★（★2026-09-13 の 決まり ── ★入れ直さず、★読む ときに 決める）
  --   ★★★登録番号が 無い とき、★領収書には
  --     ★★「適格請求書では ありません」と 書きます。
  --     ★★大学が 仕入税額控除を 受けられません。★黙って いられません。
  --     ★★（★年90万円 なら、★大学の ご負担は およそ 8万円）
  --   ★★いま 作らない もの ── ★領収書の 自動 発行／税額の 自動 計算。
  invoice_no         text,
  invoice_issuer     text,

  created_at         timestamptz not null default now()
);

-- ★★もう 立って いる 表にも 足します（★何度 走らせても 同じ）。
alter table public.org_billing add column if not exists invoice_no     text;
alter table public.org_billing add column if not exists invoice_issuer text;

-- ★★どの 学校の ぶんかを、★すぐ 引けるように します。
create index if not exists org_billing_org_id_created_at_idx
  on public.org_billing (org_id, created_at desc);

-- ★★`method` は 2つ だけ です（★裁定 その74 C）──
--   ★card    … ★Stripe
--   ★invoice … ★手で 出します。★契約が 1桁の うちは 自動に しません。
-- ★★増える 日まで、★ほかの 字を 受け取りません。
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'org_billing_method_check'
  ) then
    alter table public.org_billing
      add constraint org_billing_method_check
      check (method is null or method in ('card', 'invoice'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 【二】★権利 ── ★先に 取り上げ、★それから 渡します
--
--   ★★★順が 大事 です（★2026-09-16 の 覚え）。
--     ★★渡して から 取り上げる と、★その あいだ 誰でも 読めます。
--   ★★`anon`（合言葉の 無い 方）には、★1つも 渡しません。
-- ---------------------------------------------------------------------------
revoke all on public.org_billing from public;
revoke all on public.org_billing from anon;
revoke all on public.org_billing from authenticated;

alter table public.org_billing enable row level security;
-- ★★表を 持つ 側にも かけます。★`force` が 無いと、★持ち主は 素通りします。
alter table public.org_billing force row level security;

grant select, insert, update on public.org_billing to authenticated;
-- ★★消す 権利は 渡しません。★請求の 履歴は 消しません。
--   ★★学校が 抜ける ときは `organizations` の 側で 落ちます（on delete cascade）。

-- ---------------------------------------------------------------------------
-- 【三】★決まり（RLS）── ★`bill` を 持つ 方だけ
--
--   ★★`has_can(org_id, 'bill')` で 判じます。
--     ★★役割の 名では ありません（★A2・2026-09-18）。
--     ★★学校が「役職と、できること」で 変えられます。
--   ★★★`using (true)` を 書きません。★1つも ありません。
--     ★★書くと、★どの 学校の 行も 読めます。
--   ★★`select` / `insert` / `update` を 別々に 書きます。
--     ★★`for all` に すると、★読みと 書きが 同じ 条件に 縛られます。
--     ★★いまは 同じ ですが、★変える 日に 片方だけ 変えられません。
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
    where c.relname = 'org_billing' and p.polname = 'org_billing_select_bill'
  ) then
    create policy org_billing_select_bill on public.org_billing
      for select to authenticated
      using (public.has_can(org_id, 'bill'));
  end if;

  if not exists (
    select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
    where c.relname = 'org_billing' and p.polname = 'org_billing_insert_bill'
  ) then
    create policy org_billing_insert_bill on public.org_billing
      for insert to authenticated
      with check (public.has_can(org_id, 'bill'));
  end if;

  if not exists (
    select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
    where c.relname = 'org_billing' and p.polname = 'org_billing_update_bill'
  ) then
    create policy org_billing_update_bill on public.org_billing
      for update to authenticated
      using (public.has_can(org_id, 'bill'))
      with check (public.has_can(org_id, 'bill'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 【四】★`payment_records` ── ★作り直し（★裁定 その74）
--
--   ★★16列・★0行・★`user_id` も `org_id` も ありません。
--     ★★どの 口の ものか、★どの 学校の ものか、★結べません。
--   ★★★けれど、★この 紙では **落としません**。
--     ★★0行 だと 台帳で 見えて いても、★落とすのは 別の 決め です。
--     ★★「使えない」と「消してよい」は ちがいます。
--     ★★落とす 紙は、★落とす と 決まった 日に 別に 書きます。
--   ★★いまは、★使わない ことを ここに 書き残すだけ です。
-- ---------------------------------------------------------------------------
comment on table public.org_billing is
  '学校の ご請求（裁定 その74・2026-09-18）。payment_records は使いません（org_id が無く結べないため）。';

-- ---------------------------------------------------------------------------
-- 【五】★確かめ ── ★走らせた あとに 見る もの
--
--   ★★下の 3つが、★下の とおりに なって いれば 付きました。
-- ---------------------------------------------------------------------------

-- ★① 決まりを 使うか／持ち主にも かけるか … ★どちらも true
select c.relrowsecurity as 決まりを使う,
       c.relforcerowsecurity as 持ち主にもかける
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'org_billing';

-- ★② 決まりの 数 … ★3（select / insert / update）
--   ★★`using (true)` が 1つも 無い ことも 見ます。
select p.polname as 決まりの名, p.polcmd as 動き,
       coalesce(pg_get_expr(p.polqual, p.polrelid), '')       as 読む条件,
       coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '')  as 書く条件
from pg_policy p join pg_class c on c.oid = p.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'org_billing'
order by p.polcmd, p.polname;

-- ★③ 誰に 何を 渡したか … ★authenticated に SELECT/INSERT/UPDATE の 3つ だけ。
--   ★★`anon` が 1行も 出ない ことを 見ます。★出たら 止めて ください。
select grantee as 相手, privilege_type as 権利
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'org_billing'
order by grantee, privilege_type;
