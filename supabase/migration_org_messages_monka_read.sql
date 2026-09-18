-- ===========================================================================
-- ★org_messages ── ★調べる ための 道を、★平常の 道と 分けて 書く
--
--   ★出どころ 裁定 その76 訂正版 追補（★2026-09-18）
--     ★★平常 … ★担当の 先生／その 門下の 生徒。★`assignments.ended_at is null` で 絞る。
--     ★★調査 … ★`monka_read` を 持つ 方。★`org_id` **だけ** で 絞る。
--       ★★やめた 方の ぶんも 読めます。
--       ★★★「ハラスメントは やめた あとに 表面化する」── ★裁定の 言葉 です。
--     ★★「同じ 表を 2つの 条件で 読む。★RLS を 分けて 書く こと」
--
--   ★★★なぜ 分けるか ── ★1つの 条件に 足すと、★読み分けが できなく なります。
--     ★★いまの 条件に `or has_can(org_id,'monka_read')` を 足しても 動きます。
--     ★★けれど、★あとで 平常の 側を 直す とき、★調査の 側を 一緒に 壊します。
--     ★★2本に すると、★片方を 消しても もう 片方が 残ります。
--
--   ★★何度 走らせても 同じに なります。
--   ★★`BEGIN` も `ROLLBACK` も 使って いません（★2026-09-15 の 一件）。
--
--   ★★★この 紙で 開くのは「読める」だけ です。
--     ★★**記録（`monka_read_log`）を 書く ことは、★決まりでは 縛れません。**
--     ★★決まりは「読んで よいか」しか 見ません。★読んだ ことは 数えません。
--     ★★★だから、★画面の 側で 必ず 書きます。
--       ★★理由を 入れずに 読める 道を、★画面に 作らない こと。
--       ★★`components/tests/monka-read-log-locked.test.js` は 表を 見ます。
--         ★★画面が 書いて いるかは、★画面を 作る 日に 見張ります。
-- ===========================================================================

do $$
begin
  if not exists (
    select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
    where c.relname = 'org_messages' and p.polname = 'org_messages_select_monka_read'
  ) then
    create policy org_messages_select_monka_read on public.org_messages
      for select to authenticated
      using (public.has_can(org_id, 'monka_read'));
  end if;
end $$;

comment on table public.org_messages is
  '門下の連絡。読む道は2本 ── 平常（assignments.ended_at is null）と調査（monka_read・org_id のみ）。裁定その76追補。';

-- ---------------------------------------------------------------------------
-- ★確かめ
-- ---------------------------------------------------------------------------

-- ★① 読む 決まりは 2本 に なった か。
--   ★★`org_messages_select`（平常・`ended_at` で 絞る）
--   ★★`org_messages_select_monka_read`（調査・`org_id` だけ）
select p.polname as 決まりの名, p.polcmd as 動き,
       (coalesce(pg_get_expr(p.polqual, p.polrelid), '') like '%ended_at%') as やめた人を外すか,
       (coalesce(pg_get_expr(p.polqual, p.polrelid), '') like '%monka_read%') as 調査の道か
from pg_policy p join pg_class c on c.oid = p.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'org_messages' and p.polcmd = 'r'
order by p.polname;

-- ★② 書く 決まりは 増えて いない か。
--   ★★`monka_read` は **読む** できこと です。★書けては いけません。
select p.polname as 決まりの名, p.polcmd as 動き
from pg_policy p join pg_class c on c.oid = p.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'org_messages' and p.polcmd <> 'r'
order by p.polcmd, p.polname;
