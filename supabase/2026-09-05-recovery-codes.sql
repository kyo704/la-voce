-- ============================================================================
-- 復旧コードの保存（2026-09-05）
--
--   出どころ docs/opus/lavoce-判断-メールを失うこと（9月4日・夜）.md §3
--            docs/reports/2026-09-05-復旧コードの使い方-設計.md
--
--   ★★決めごと（判断書 §3）
--     □ サーバには★ハッシュだけ保存する（★元のコードを持たない）
--     □ ★1回使ったら無効。使ったら、その場で新しいコードを出す
--     □ ★再発行できる（ログインできているうちなら、いつでも）
--     □ 台帳03（auth 参照）に★登録する
--     □ ★書き出し（台帳04）には★含めない
--        → コードは本人が持っているものです。★こちらの控えではありません
--
--   ★★利用者からは、★1行も見えません。★1行も書けません。
--     ★ポリシーを作らず（1枚め）、★権限も剥がします（2枚め）。
--     ★触るのは、★サーバの route（service_role）だけです。
--
--   ★何度実行しても、同じ結果になります。
-- ============================================================================


-- ---------------------------------------------------------------------------
-- ① 表
--
--   ★★1人につき、★1行だけです（primary key が user_id）。
--     ★出し直したら、★上書きします。★古いほうは、その場で使えなくなります。
--     ★★何本も持たせないこと。★1本なら、無効にし忘れることがありません。
-- ---------------------------------------------------------------------------
create table if not exists public.recovery_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,

  -- ★★元のコードは、★どこにも入れません。
  --   ★scrypt の結果と、★その塩だけです。
  --   ★漏れても、★コードそのものは出てきません。
  code_hash text not null,
  code_salt text not null,

  -- ★いつ出したか。★「もう出したか」を見るのに使います。
  issued_at timestamptz not null default now(),

  -- ★★使ったら、ここが入ります。★入っている行は、もう使えません。
  used_at timestamptz,

  -- ★とめかた（設計 §5）。★アカウントごとに、とめます。
  failed_attempts integer not null default 0,
  locked_until timestamptz
);

comment on table public.recovery_codes is
  'メールを失った方が、もう一度入るための控え。'
  '★ハッシュだけを持つ。★元のコードは保存しない。'
  '★1人1行。出し直すと上書きされ、古いほうはその場で使えなくなる。'
  '★利用者からは見えない（ポリシー0本＋権限を剥奪）。触るのは route だけ。'
  '★★書き出し（台帳04）には含めない。本人が持っているものであり、こちらの控えではない。';

alter table public.recovery_codes enable row level security;


-- ---------------------------------------------------------------------------
-- ② ★ポリシーを1本も作らず、★権限も剥がします
--
--   ★★「ポリシーの不在は1枚の板。権限の剥奪と合わせて2枚にすること。」
--
--   ★もし将来、誰かが RLS を切ってしまっても、★権限が無ければ届きません。
--   ★もし将来、誰かが権限を戻してしまっても、★ポリシーが無ければ通りません。
-- ---------------------------------------------------------------------------
revoke all on public.recovery_codes from anon;
revoke all on public.recovery_codes from authenticated;


-- ---------------------------------------------------------------------------
-- ③ ★メールを付け替えた履歴（判断書 §7）
--
--   ★乗っ取られたとき、★「いつ変えられたか」だけが手がかりになります。
--   ★★消しません。★上書きしません。★足すだけです。
--
--   ★アカウントを消したら、★この行も消えます（on delete cascade）。
--     ★★台帳01（削除処理）に登録すること。
-- ---------------------------------------------------------------------------
create table if not exists public.email_change_log (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  changed_at timestamptz not null default now(),
  old_email text,
  new_email text,
  -- ★どうやって変えたか。'settings'（ふつうに変えた）／'recovery'（復旧コードで）
  --   ★★'recovery' の行は、★数が増えたら見ること。
  via text not null,
  -- ★★IP は持ちません（同意の記録と同じ決まり）。
  --   ★列がありません。★持てないようにします。
  constraint email_change_log_via_check check (via in ('settings', 'recovery'))
);

comment on table public.email_change_log is
  'メールアドレスを変えた履歴。★乗っ取りに気づくための、唯一の手がかり。'
  '★足すだけ。消さない・上書きしない。★IP は持たない（列が無い）。'
  '★台帳01（削除処理）に登録すること。アカウント削除で cascade で消える。';

alter table public.email_change_log enable row level security;

-- ★★本人は、自分の履歴を「読むこと」だけできます。
--   ★書くのは route（service_role）だけです。★insert のポリシーは作りません。
--   ★★「いつ変えられたか」を本人が見られないと、★気づけません。
do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'email_change_log'
       and policyname = 'email_change_log_own_select'
  ) then
    create policy email_change_log_own_select
      on public.email_change_log
      for select
      using (auth.uid() = user_id);
  end if;
end $$;

-- ★読むことだけ。★書く権限は、渡しません。
--   ★★先に剥がしてから渡します。★grant は足し算です。剥がしにはなりません。
revoke all on public.email_change_log from anon;
revoke all on public.email_change_log from authenticated;
grant select on public.email_change_log to authenticated;


-- ---------------------------------------------------------------------------
-- ④ 確かめ
-- ---------------------------------------------------------------------------

-- ④-1 ★recovery_codes に、ポリシーが0本であること
select policyname as "★あってはいけないポリシー"
  from pg_policies
 where schemaname = 'public' and tablename = 'recovery_codes';

-- ④-2 ★recovery_codes に、権限が0行であること
select grantee as "★あってはいけない権限", privilege_type
  from information_schema.table_privileges
 where table_schema = 'public' and table_name = 'recovery_codes'
   and grantee in ('anon', 'authenticated');

-- ④-3 ★email_change_log は、authenticated が SELECT だけ持つこと
--      ★★INSERT・UPDATE・DELETE が出てきたら、★行き過ぎです
select grantee as "相手", privilege_type as "権限"
  from information_schema.table_privileges
 where table_schema = 'public' and table_name = 'email_change_log'
   and grantee in ('anon', 'authenticated')
 order by grantee, privilege_type;

-- ④-4 ★email_change_log のポリシーは、SELECT の1本だけであること
--      ★★UPDATE のポリシーがあれば、★WITH CHECK が無い時点で欠陥です
select policyname as "名前", cmd as "種類",
       qual as "USING", with_check as "WITH CHECK"
  from pg_policies
 where schemaname = 'public' and tablename = 'email_change_log';

-- ④-5 ★元のコードを保存する列が、無いこと
--      ★★code_hash と code_salt だけ。★code や plain が出たら、間違いです
select column_name as "列", data_type as "型"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'recovery_codes'
 order by ordinal_position;


-- ============================================================================
-- ★台帳への登録（★この SQL を当てたら、忘れずに）
--   01 削除処理     ★入れる。recovery_codes・email_change_log の両方
--                    ★どちらも on delete cascade だが、★台帳には書くこと
--   02 バックアップ ★入れる。email_change_log は critical = true
--                    ★★recovery_codes は critical = false
--                      （★戻せなくても、出し直せます）
--   03 auth 参照    ★★入れる。両方とも auth.users(id) を見ています
--   04 書き出し     ★★recovery_codes は★入れない（判断書 §3）
--                    ★email_change_log は★入れる（本人の履歴です）
--   05 外に出る経路 ★行は増えません（メールは、もう使っています）
--   06 起きたこと   ★email_change_log を、ここから引けるようにすること
-- ============================================================================
