-- ============================================================================
-- もう一度の確かめを、★サーバに覚えさせる（2026-09-05）
--
--   出どころ docs/opus/lavoce-判断-Face IDでの再確認.md
--            lib/reauth.js
--
--   ★★画面に覚えさせないこと。
--     ★画面が「確かめました」と言ってきても、★サーバは信じません。
--     ★route は、★画面を通さずにも呼べます。
--
--   ★★覚えるのは、★時刻だけです。
--     ★何を確かめたか（どのパスワードか）は、★持ちません。
--     ★★持つ必要がありません。★通ったかどうかだけが要ります。
--
--   ★5分です（lib/reauth.js の REAUTH_VALID_MINUTES）。
--     ★書き出してすぐ削除する、といったときに、★二度聞かないためです。
--     ★★長さを変えるときは、★lib/reauth.js だけを直してください。
--       ★この SQL には、★5 という数を書いていません。
--
--   ★何度実行しても、同じ結果になります。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 列
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists reauth_at timestamptz;

comment on column public.profiles.reauth_at is
  '大事な操作の前に、もう一度パスワードを確かめた時刻。'
  '★書けるのは route（service_role）だけ。★本人には書かせない。'
  '★本人が書けると、確かめずに書き出し・削除ができてしまう。'
  '★有効な長さは lib/reauth.js が持つ（ここには書かない）。';

-- ---------------------------------------------------------------------------
-- ② ★★本人に書かせないこと（★ここがいちばん大事です）
--
--   ★本人がこの列を書けると、★確かめを飛ばして書き出し・削除ができます。
--   ★★2026-09-05 の穴と、★まったく同じ形です。
--     ・profiles に表ごとの UPDATE が出ている
--     ・RLS は行しか絞らない
--     ★→ ★引き金（trigger）で止めます。
--
--   ★2026-09-05-profiles-server-only-columns.sql の関数に、★1行足します。
--   ★★関数ごと入れ替えます。★前のものより、★列が1つ増えているだけです。
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
  -- ★★2026-09-05 追加。★これを本人が書けると、確かめが意味を失います。
  elsif new.reauth_at is distinct from old.reauth_at then guarded := 'reauth_at';
  end if;

  if guarded is not null then
    raise exception 'SERVER_ONLY_COLUMN: %', guarded
      using hint = 'この列は、サーバの側からだけ変えられます。';
  end if;

  return new;
end;
$$;

-- ★引き金は、すでに付いています。★関数を入れ替えるだけで効きます。
--   ★念のため、付いていなければ付けます。
drop trigger if exists profiles_guard_server_only_columns on public.profiles;
create trigger profiles_guard_server_only_columns
  before update on public.profiles
  for each row
  execute function public.profiles_guard_server_only_columns();

-- ---------------------------------------------------------------------------
-- ③ 確かめ
-- ---------------------------------------------------------------------------

-- ③-1 ★列ができたか
select column_name as "列", data_type as "型"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'profiles'
   and column_name = 'reauth_at';

-- ③-2 ★★本人が書けないこと
--      ★「★塞がっています： SERVER_ONLY_COLUMN: reauth_at」と出れば、済んでいます。
--      ★do ブロック1文です。★書いたものは、その場で消えます。
-- do $probe$
-- declare uid uuid := '<ここに、ご自身のユーザーID>';
-- begin
--   begin
--     perform set_config('role', 'authenticated', true);
--     perform set_config('request.jwt.claims',
--       json_build_object('sub', uid, 'role', 'authenticated')::text, true);
--     update public.profiles set reauth_at = now() where id = uid;
--     raise exception 'PROBE_HOLE_OPEN';
--   exception when others then
--     if sqlerrm = 'PROBE_HOLE_OPEN' then
--       raise notice '★★穴があります。本人が reauth_at を書けます。';
--     else
--       raise notice '★塞がっています： %', sqlerrm;
--     end if;
--   end;
-- end
-- $probe$;

-- ③-3 ★ふつうの保存が、まだ通ること
-- do $probe$
-- declare uid uuid := '<ここに、ご自身のユーザーID>';
-- begin
--   begin
--     perform set_config('role', 'authenticated', true);
--     perform set_config('request.jwt.claims',
--       json_build_object('sub', uid, 'role', 'authenticated')::text, true);
--     update public.profiles set display_name = display_name where id = uid;
--     raise exception 'PROBE_SAVE_OK';
--   exception when others then
--     if sqlerrm = 'PROBE_SAVE_OK' then
--       raise notice '★ふつうの保存は、まだ通ります。';
--     else
--       raise notice '★★保存が止まっています： %', sqlerrm;
--     end if;
--   end;
-- end
-- $probe$;

-- ============================================================================
-- ★台帳への登録
--   01 削除処理    ★profiles の列なので、すでに入っています（行は増えません）
--   04 書き出し    ★★入れません。★本人の記録ではありません。
--                   ★いつ確かめたかは、こちらの都合の値です
--   07 約束        ★行は増えません
-- ============================================================================
