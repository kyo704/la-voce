-- is_internal も、トリガーで守ります（2026年9月8日）
--
--   ★★2026-09-06 に見つけました。
--     ★9月5日に当てたトリガーは6列を守っていますが、
--     ★is_internal だけ、★入っていませんでした。
--
--   ★この列は、★お知らせの宛先を変えます（lib/noticeAudience.js）。
--     ★本人が立てられると、★こちら側の口座あてのお知らせが届きます。
--
--   ★★列ごとの権限では、★すでに塞がっています（9月8日の作業）。
--     ★ここは2枚目の板です。
--     　「★ポリシーの不在は1枚の板。★権限の剥奪と合わせて2枚にすること。」
--     ★片方が外れても、★もう片方が残ります。
--
--   ★一覧の正は lib/profileServerOnlyColumns.js です。
--   ★何度実行しても、同じ結果になります。

-- ---------------------------------------------------------------------------
-- ① 関数を入れ替えます（★9月5日のものに、is_internal を1行足しただけです）
-- ---------------------------------------------------------------------------
create or replace function public.profiles_guard_server_only_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  guarded text;
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  guarded := null;

  if new.is_admin is distinct from old.is_admin then guarded := 'is_admin';
  elsif new.is_tester is distinct from old.is_tester then guarded := 'is_tester';
  elsif new.cohort is distinct from old.cohort then guarded := 'cohort';
  elsif new.teacher_beta_access is distinct from old.teacher_beta_access
    then guarded := 'teacher_beta_access';
  elsif new.deleted_at is distinct from old.deleted_at then guarded := 'deleted_at';
  elsif new.reauth_at is distinct from old.reauth_at then guarded := 'reauth_at';
  -- ★★2026-09-08 追加。★お知らせの宛先を、本人に変えさせないこと。
  elsif new.is_internal is distinct from old.is_internal then guarded := 'is_internal';
  end if;

  if guarded is not null then
    raise exception 'SERVER_ONLY_COLUMN: %', guarded
      using hint = 'この列は、サーバの側からだけ変えられます。';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_server_only_columns on public.profiles;
create trigger profiles_guard_server_only_columns
  before update on public.profiles
  for each row
  execute function public.profiles_guard_server_only_columns();

-- ---------------------------------------------------------------------------
-- ② 確かめ（★読むだけ）
-- ---------------------------------------------------------------------------
--   ★7列すべてが、関数の中に在ること。

select c.列 as 守るはずの列,
       case when position(c.列 in p.prosrc) > 0 then 'あります' else '★ありません' end as 関数の中
from (values
  ('is_admin'), ('is_tester'), ('is_internal'), ('cohort'),
  ('teacher_beta_access'), ('deleted_at'), ('reauth_at')
) as c(列)
cross join pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.proname = 'profiles_guard_server_only_columns'
  and n.nspname = 'public';

-- ★★「★ありません」が1つでも出たら、★入れ替えに失敗しています。

-- ③ 引き金が、付いているか
select tgname as 引き金の名前,
       case when tgenabled = 'O' then '効いています' else tgenabled end as 状態
from pg_trigger
where tgrelid = 'public.profiles'::regclass
  and tgname = 'profiles_guard_server_only_columns';
