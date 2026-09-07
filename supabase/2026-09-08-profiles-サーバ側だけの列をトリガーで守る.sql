-- profiles の「サーバの側だけ」の列を、トリガーで守ります（2026年9月8日）
--
--   ★★2026-09-07、★名前を変えました。
--     ★もとは「is_internal も、トリガーで守る」でした。
--     ★守る列が8つになったので、★1列の名前を題にしておけません。
--     ★★中身は入れ替えるだけ（create or replace）なので、
--       ★どちらの名前で流しても、★同じ結果になります。
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
  -- ★★2026-09-07 追加。★使ったポイントの数です。
  --   ★持ちぶんは「記録から作った合計 − この数」で出しています。
  --   ★★だから、この数を小さく書けば、★記録せずにポイントが増えます。
  --     ★ブラウザから直に書けていました（VocalTracker の買う処理）。
  --   ★これからは app/api/character/buy が、★足すぶんだけを書きます。
  elsif new.character_points_spent is distinct from old.character_points_spent
    then guarded := 'character_points_spent';
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
--
--   ★★2026-09-08、★ここを直しました。
--     ★はじめ、こう書いていました。
--         case when tgenabled = 'O' then '効いています' else tgenabled end
--     ★これは誤りです。
--       ★tgenabled は "char"（★1バイトだけの型）です。
--       ★case の返す型が "char" に寄せられ、
--       ★日本語が★先頭の1バイトに切られました。
--       ★★「効」は UTF-8 で E5 8A B9。★先頭の E5 が、8進数で 345。
--         ★だから \345 と出ました。★トリガーは正常でした。
--     ★★型を text にそろえてから比べます。

select tgname as 引き金の名前,
       tgenabled::text as 生の値,
       case tgenabled::text
         when 'O' then '効いています（ふつうの状態）'
         when 'D' then '★止まっています'
         when 'R' then 'replica のときだけ効きます'
         when 'A' then 'いつでも効きます'
         else '★知らない値'
       end as 状態
from pg_trigger
where tgrelid = 'public.profiles'::regclass
  and tgname = 'profiles_guard_server_only_columns';

-- ---------------------------------------------------------------------------
-- ④ ★★本当に効いているか、★書いてみて確かめます
-- ---------------------------------------------------------------------------
--   ★★付いているかどうかと、★効いているかどうかは、別です。
--     ★カタログを見るだけでは、★分かりません。★実際に書いてみます。
--
--   ★★BEGIN / ROLLBACK は使いません。★戻らないことがあります（9月5日の事故）。
--     ★代わりに、★1つの do ブロックの中で、書いて、必ず例外を投げます。
--     ★例外を投げると、★そのブロックの中の書き込みは、★取り消されます。
--     ★★データベース自身が取り消すので、★環境に左右されません。
--
--   ★<ここに、ご自身のユーザーID> を差し替えてから、流してください。

do $probe$
declare
  uid uuid := '<ここに、ご自身のユーザーID>';
  before_v boolean;
begin
  select is_internal into before_v from public.profiles where id = uid;

  begin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claims',
      json_build_object('sub', uid, 'role', 'authenticated')::text, true);

    update public.profiles set is_internal = not coalesce(is_internal, false)
     where id = uid;

    -- ★ここに来たら、★書けてしまったということです。
    raise exception 'PROBE_HOLE_OPEN';
  exception when others then
    if sqlerrm = 'PROBE_HOLE_OPEN' then
      raise notice '★★穴があります。本人が is_internal を書けます。';
    else
      raise notice '★塞がっています： %', sqlerrm;
    end if;
  end;

  raise notice '★もとの値： %（変わっていないはずです）', before_v;
end
$probe$;

-- ★★「★塞がっています： SERVER_ONLY_COLUMN: is_internal」と出れば、済んでいます。

-- ---------------------------------------------------------------------------
-- ⑤ ★ふつうの保存が、まだ通ること（★塞ぎすぎていないか）
-- ---------------------------------------------------------------------------
do $probe$
declare uid uuid := '<ここに、ご自身のユーザーID>';
begin
  begin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claims',
      json_build_object('sub', uid, 'role', 'authenticated')::text, true);
    update public.profiles set display_name = display_name where id = uid;
    raise exception 'PROBE_SAVE_OK';
  exception when others then
    if sqlerrm = 'PROBE_SAVE_OK' then
      raise notice '★ふつうの保存は、まだ通ります。';
    else
      raise notice '★★保存が止まっています： %', sqlerrm;
    end if;
  end;
end
$probe$;
