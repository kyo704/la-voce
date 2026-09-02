-- ============================================================================
-- profiles の行が無い利用者を探す（2026-09-02・調べるだけ）
--
--   ★書き込みは1つもありません。行は作りません。
--     ★勝手に作らないこと。作ってしまうと「いつからか」が分からなくなり、
--       原因を追う手がかりが消えます。
--
--   ★なぜ重大なのか
--     profiles の行が無い人は、アプリを使えます。ログインもできます。
--     ですが★保存が、ひとつも効きません。
--       アプリの書き込みは全部 .update(...).eq("id", userId) です
--       （CLAUDE.md：INSERT のポリシーが無いので upsert は 403 になる）。
--     ★行が無ければ、UPDATE は0行に当たります。
--       PostgREST は0行の更新を★エラーにしません。error は null です。
--       つまり画面には★成功したように見えます。
--     効かなくなるもの：表示名・同意の記録・オンボーディング完了・職業・
--     羊のポイントと装備・LINE 連携・記録モード・1日の境目の時刻…
--     ★そして本人は、保存できていないことに気づけません。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 何人いるか（★まずこれを報告してください）
-- ---------------------------------------------------------------------------
select
  (select count(*) from auth.users) as "auth.users の人数",
  (select count(*) from public.profiles) as "profiles の行数",
  (select count(*) from auth.users u
    where not exists (select 1 from public.profiles p where p.id = u.id))
    as "★profiles が無い人";

-- ---------------------------------------------------------------------------
-- ② 誰か。そして、どう入ってきたか
--
--   ★created_at が、トリガーを作った日より前なら「トリガーが無かった」。
--   ★provider が email 以外なら、別の入口（OAuth など）。
--   ★raw_user_meta_data が空なら、通常の登録画面を通っていない可能性。
-- ---------------------------------------------------------------------------
select u.id as "利用者", u.email as "メール",
       u.created_at as "作られた日時",
       u.last_sign_in_at as "最後のログイン",
       u.raw_app_meta_data->>'provider' as "入口",
       (u.raw_user_meta_data = '{}'::jsonb or u.raw_user_meta_data is null)
         as "★登録時の情報が空か",
       u.deleted_at as "auth 側の削除日時"
  from auth.users u
 where not exists (select 1 from public.profiles p where p.id = u.id)
 order by u.created_at;

-- ---------------------------------------------------------------------------
-- ③ トリガーは、いま在るか
--
--   ★トリガーは AFTER INSERT で、例外を捕まえていません。
--     ですから★トリガーが失敗すれば、登録そのものが巻き戻ります。
--     「auth.users には居るのに profiles が無い」という状態は、
--     ★トリガーが失敗したのではなく「動いていない」ときに起きます。
--       ・その人を作ったとき、トリガーがまだ無かった
--       ・トリガーが外されていた
--       ・あとから profiles の行だけ消された（下の④）
--       ・本番のトリガーが、書き換えられて黙って抜けるようになっている
--   ★schema.sql は正ではありません。本番の定義を見ます。
-- ---------------------------------------------------------------------------
select t.tgname as "トリガー名",
       case t.tgenabled when 'O' then '有効' when 'D' then '★無効' else t.tgenabled::text end as "状態"
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'auth' and c.relname = 'users' and not t.tgisinternal;

select pg_get_functiondef(p.oid) as "★本番の handle_new_user の中身"
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'handle_new_user';

-- ---------------------------------------------------------------------------
-- ④ 退会の途中で止まった跡が無いか
--
--   ★lib/accountDeletion.js は、profiles を消してから auth.users を消します。
--     この2つは★別々の通信で、巻き戻せません。
--     auth.users の削除だけ失敗すると、★まさにこの状態が残ります。
--     「ログインはできるが、何も保存されない人」です。
-- ---------------------------------------------------------------------------
select count(*) as "退会の記録（account_deletions）の数" from public.account_deletions;

-- 猶予中（soft delete）の人
select count(*) as "deleted_at が入っている profiles の行"
  from public.profiles where deleted_at is not null;

-- ---------------------------------------------------------------------------
-- ⑤ 逆向きも見ます（profiles はあるが auth.users に居ない）
--     ★ここに行が出たら、外部キーが効いていないということです。
-- ---------------------------------------------------------------------------
select count(*) as "★auth.users に居ないのに profiles がある行（0であること）"
  from public.profiles p
 where not exists (select 1 from auth.users u where u.id = p.id);
