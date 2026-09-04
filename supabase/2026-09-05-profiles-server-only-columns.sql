-- ============================================================================
-- profiles ── ★本人に書かせてはいけない列を、止める（2026-09-05）
--
--   ★★これは、★いま止まっている作業とは別に、★先に当ててください。
--     ★2026-09-05、★列を1つ足す前の確認から見つかりました。
--     ★★重いところは、★is_admin です。
--
--   ★★分かっていること（★運営者の照会で確かめました）
--     ① profiles に、★表ごとの UPDATE が anon と authenticated に出ている
--     ② RLS は「Users can update own profile」USING (auth.uid() = id)
--        ★WITH CHECK が無いので、USING が使い回されます
--     ③ ★RLS は★行を絞るだけです。★列は絞りません
--
--   ★★この3つが同時に成り立つと、こうなります。
--
--        supabase.from("profiles").update({ is_admin: true }).eq("id", 自分)
--
--     ★自分の行なので、★USING を通ります。★列の制限はありません。
--     ★そして app/admin/page.js は、★profiles.is_admin だけを見て通します。
--     ★★その先で、★service_role で全員の一覧を出しています。
--
--   ★★つまり、★ログインしている方なら誰でも、管理画面に入れます。
--     ★私は本番で試していません。★§0 で、試す手を書きます。
--     ★★試して、通ってしまうことを見てから、当ててください。
--
--   ★何度実行しても、同じ結果になります。
-- ============================================================================


-- ---------------------------------------------------------------------------
-- §0 ★穴があるかどうかを、確かめます
--
--   ★★2026-09-05、★ここに私の間違いがありました。
--     ★はじめ、★begin 〜 rollback で挟む形をお渡ししました。
--     ★★Supabase の SQL エディタでは、★rollback が効きませんでした。
--       ★is_admin = true が、★そのまま残りました。
--       ★運営者が、手で false に戻してくださいました。
--
--   ★★教訓 ── ★あとの1文で消す形の確かめを、お渡ししないこと。
--     ★消えるかどうかは、★実行する場所しだいです。
--     ★★消えることを、★データベース自身に保証させます。
--
--   ★下は、★do ブロック1文です。★中で書いて、★中で必ず戻します。
--     ★raise で抜けるので、★書いたことは、★その場で消えます。
--     ★成功しても失敗しても、★1行も残りません。
--
--   ★<ここに、ご自身のユーザーID> を入れ替えて、実行してください。
--   ★答えは、★NOTICE として出ます。
-- ---------------------------------------------------------------------------
-- do $probe$
-- declare uid uuid := '<ここに、ご自身のユーザーID>';
-- begin
--   begin
--     perform set_config('role', 'authenticated', true);
--     perform set_config('request.jwt.claims',
--       json_build_object('sub', uid, 'role', 'authenticated')::text, true);
--     update public.profiles set is_admin = true where id = uid;
--     -- ★★ここに来たら、書けてしまっています。★raise で、必ず戻します。
--     raise exception 'PROBE_HOLE_OPEN';
--   exception when others then
--     if sqlerrm = 'PROBE_HOLE_OPEN' then
--       raise notice '★★穴があります。本人が is_admin を書けます。';
--     else
--       raise notice '★塞がっています： %', sqlerrm;
--     end if;
--   end;
-- end
-- $probe$;


-- ---------------------------------------------------------------------------
-- §1 ★止める列
--
--   ★★列ごとの grant では、止まりません。
--     ★表ごとの UPDATE が出ているあいだ、★列ごとの revoke は効きません。
--     ★PostgreSQL では、★広いほうが黙って勝ちます。
--     ★（2026-09-03、memberships で同じことが起きました）
--
--   ★★だから、★引き金（trigger）で止めます。
--     ★grant を触りません。★いま保存できているものを、1つも壊しません。
--     ★★「変えようとしたら、断る」だけです。
--
--   ★止めるのは、★アプリが一度も書いていない列だけです。
--     ★2026-09-05 に、VocalTracker.jsx と MinorConsentGate.jsx の
--       すべての .from("profiles").update(...) を数えて確かめました。
--     ★★確かめは components/tests/profiles-server-only.test.js が続けます。
-- ---------------------------------------------------------------------------
create or replace function public.profiles_guard_server_only_columns()
returns trigger
language plpgsql
as $$
declare
  guarded text;
begin
  -- ★★止めるのは、利用者の側から来た更新だけです。
  --   ★service_role（route・cron・SQL エディタ）は、そのまま通します。
  --   ★postgres も通します。★ここで止めると、運営者が直せなくなります。
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  guarded := null;

  -- ★★管理画面の鍵です。★これがいちばん重い列です。
  if new.is_admin is distinct from old.is_admin then guarded := 'is_admin';

  -- ★運営者が手で立てるものです。★ご本人が立てるものではありません。
  elsif new.is_tester is distinct from old.is_tester then guarded := 'is_tester';
  elsif new.cohort is distinct from old.cohort then guarded := 'cohort';
  elsif new.teacher_beta_access is distinct from old.teacher_beta_access
    then guarded := 'teacher_beta_access';

  -- ★退会の印です。★route（service_role）が書きます。
  --   ★ご本人に書かせると、★30日の猶予を飛ばせてしまいます。
  elsif new.deleted_at is distinct from old.deleted_at then guarded := 'deleted_at';
  end if;

  if guarded is not null then
    -- ★★どの列で止めたかを、返します。★黙って無視しないこと。
    --   ★黙って通すと、★アプリは「保存できた」と思い込みます。
    raise exception 'SERVER_ONLY_COLUMN: %', guarded
      using hint = 'この列は、サーバの側からだけ変えられます。';
  end if;

  return new;
end;
$$;

comment on function public.profiles_guard_server_only_columns() is
  '★本人に書かせてはいけない列を止める。'
  '★RLS は行しか絞れず、表ごとの UPDATE grant があるため、列は引き金で止める。'
  '★止めるのは anon と authenticated だけ。service_role と postgres は通す。'
  '★列を足すときは components/tests/profiles-server-only.test.js も直すこと。';

drop trigger if exists profiles_guard_server_only_columns on public.profiles;
create trigger profiles_guard_server_only_columns
  before update on public.profiles
  for each row
  execute function public.profiles_guard_server_only_columns();


-- ---------------------------------------------------------------------------
-- §2 ★anon から、profiles を丸ごと剥がします
--
--   ★★2026-09-05、リポジトリ全体を見ました。
--     ★profiles を読み書きしている所は、★すべてログインの後です。
--       app/admin・app/billing・app/dashboard … if (!user) redirect("/login") の後
--       route … すべて admin（service_role）
--       VocalTracker・MinorConsentGate … /dashboard の中
--     ★rpc も、★すべて /dashboard の中からしか呼ばれていません。
--     ★★anon が profiles に触る道は、★1本もありません。
--
--   ★★そして、★TRUNCATE には RLS が効きません。
--     ★これは、★RLS が守ってくれない、唯一の権限です。
--     ★いまは PostgREST が TRUNCATE を出さないので届きませんが、
--       ★★届かないのは運であって、守りではありません。
-- ---------------------------------------------------------------------------
revoke all on public.profiles from anon;


-- ---------------------------------------------------------------------------
-- §3 ★authenticated からも、TRUNCATE と DELETE だけ先に剥がします
--
--   ★★UPDATE と SELECT は、★触りません。
--     ★列ごとに並べ直すのは、★別の日にします（★§5）。
--     ★いま剥がすと、★何が保存できなくなるか分かりません。
--
--   ★DELETE は、★アプリのどこからも出していません。
--     ★退会は route（service_role）が、★30日の猶予を見てから消します。
--   ★TRUNCATE は、★RLS が効きません。★誰にも要りません。
-- ---------------------------------------------------------------------------
revoke truncate on public.profiles from authenticated;
revoke delete on public.profiles from authenticated;
revoke references on public.profiles from anon, authenticated;


-- ---------------------------------------------------------------------------
-- §4 確かめ
-- ---------------------------------------------------------------------------

-- §4-1 ★引き金が付いたか
select tgname as "引き金", tgenabled as "有効（O なら有効）"
  from pg_trigger
 where tgrelid = 'public.profiles'::regclass
   and not tgisinternal;

-- §4-2 ★anon が0行であること／authenticated に TRUNCATE・DELETE が無いこと
select grantee as "相手", privilege_type as "権限"
  from information_schema.table_privileges
 where table_schema = 'public' and table_name = 'profiles'
   and grantee in ('anon', 'authenticated')
 order by grantee, privilege_type;

-- §4-3 ★★もう一度、穴を試します（★§0 と同じ形を、もう一度実行してください）
--       ★「★塞がっています： SERVER_ONLY_COLUMN: is_admin」と出れば、済んでいます。

-- §4-4 ★★ふつうの保存が、まだ通ること（★いちばん大事な確かめ）
--       ★display_name は、アプリが書いている列です。★通らないと困ります。
--       ★★これも do ブロック1文です。★書いたものは、その場で消えます。
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


-- ---------------------------------------------------------------------------
-- §5 ★別の日にすること（★今日はしません）
--
--   ★authenticated の UPDATE を、★表ごとから列ごとに並べ直す。
--     ① revoke update on public.profiles from authenticated;
--     ② grant update (…アプリが書く列だけ…) on public.profiles to authenticated;
--     ★★順番を逆にしないこと。★grant は足し算で、剥がしにはなりません。
--
--   ★その列の一覧は、★lib/profileWritableColumns.js に置きます。
--   ★そして、★確かめが、アプリの書き込みと突き合わせます。
--     ★★手で並べると、★必ず1つ落ちます。★落ちた列は、保存できなくなります。
--
--   ★★引き金（§1）があれば、★重いところはもう塞がっています。
--     ★§5 は、★守りを2枚にするための仕事です。★急ぎません。
-- ---------------------------------------------------------------------------


-- ============================================================================
-- ★台帳への登録
--   06 起きたこと ★★入れる。2026-09-05、is_admin を本人が書ける状態だった
--                  ★見つけたのは、profiles に列を足す前の権限の確認です
--   07 約束       ★行は増えません
-- ============================================================================
