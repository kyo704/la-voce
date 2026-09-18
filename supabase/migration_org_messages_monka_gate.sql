-- ===========================================================================
-- ★門下の やりとりは `monka_read` だけ（★裁定 その88 Q2・2026-09-18）
--
--   ★★★何が 起きて いたか
--     ★★`org_messages_select` の 3つ目の 枝が
--       ★★`has_can(org_id, 'renraku_all')` でした。
--     ★★`renraku_all` は「学校全部へ **お知らせを 出す**」できこと です。
--     ★★★それで、★**門下の やりとり**まで 読めて いました。
--       ★★いま その できことを 持つ 役職は **7件**。
--       ★★`monka_read` を 持つ 役職は **0件**。
--     ★★★裁定 その76 は、★「開いた 記録が 必ず 残る」ことを 条件に
--       ★★監査を 許して います。★`renraku_all` で 読んだ ぶんには、
--       ★★その 記録が 残りません。★条件が 成り立って いませんでした。
--
--   ★★★直し ── ★枝を 2つに 分けます。
--     ★★`teacher_id is null`（★学校ぜんぶの お知らせ）→ `renraku_all`
--     ★★`teacher_id is not null`（★門下の やりとり）→ `monka_read`
--     ★★担当の 先生 ご本人と、★受け持ちの 生徒は これまで どおり です。
--
--   ★★★読めなく なる 方（★2026-09-18 に 数えました）
--     ★★台帳の お便り …… 1件。★門下の もの です。
--     ★★その 学校で `renraku_all` だけ を 持つ 役職 …… **1件**（事務長）。
--     ★★その 先生 ご本人は、★これまで どおり 読めます。
--     ★★★つまり、★読めなく なるのは ★事務長 1役職 の、★1件 です。
--       ★★これは 裁定 その76 が もともと 意図した 姿 です。
--
--   ★★何度 走らせても 同じに なります。
--   ★★`BEGIN` も `ROLLBACK` も 使って いません（★2026-09-15 の 一件）。
-- ===========================================================================

drop policy if exists org_messages_select on public.org_messages;

create policy org_messages_select on public.org_messages
  for select using (
    -- ★① 門下の 先生 ご本人。★自分の 門下 です。
    auth.uid() = teacher_id

    -- ★② 受け持ちの 生徒。★自分の 先生の 門下 だけ。
    or exists (
      select 1 from public.assignments a
      where a.org_id = org_messages.org_id
        and a.student_id = auth.uid()
        and a.ended_at is null
        and (org_messages.teacher_id is null or a.teacher_id = org_messages.teacher_id)
    )

    -- ★③ 学校ぜんぶの お知らせ（★`teacher_id` が 空）── ★`renraku_all`。
    --   ★★「出す」できこと です。★自分が 出した ものを 読めない のは 変 です。
    or (org_messages.teacher_id is null and has_can(org_id, 'renraku_all'))

    -- ★④ 門下の やりとり ── ★`monka_read` だけ。
    --   ★★★普段は 切って あります（★裁定 その77）。
    --   ★★開いた ことは `monka_read_log` に 残ります（★裁定 その76）。
    or (org_messages.teacher_id is not null and has_can(org_id, 'monka_read'))
  );

-- ---------------------------------------------------------------------------
-- 【二】★確かめ
-- ---------------------------------------------------------------------------

-- ★① 枝が 4つ 入ったか
select p.polname, pg_get_expr(p.polqual, p.polrelid) as shiki
from pg_policy p join pg_class c on c.oid = p.polrelid
where c.relname = 'org_messages' and p.polname = 'org_messages_select';

-- ★② `renraku_all` が 門下を 開けなく なったか
select o.name as gakko, p.name as post,
       (p.perms ? 'renraku_all') as ra, (p.perms ? 'monka_read') as mr
from public.memberships m
join public.org_posts p on p.id = m.post_id
join public.organizations o on o.id = m.org_id
where (p.perms ? 'renraku_all') or (p.perms ? 'monka_read')
order by o.name, p.name;

-- ---------------------------------------------------------------------------
-- 【三】★2つ目の 決まりを 外します（★2026-09-18・裁定 その88 の あと）
--
--   ★★`org_messages_select_monka_read` ＝ `has_can(org_id, 'monka_read')`。
--     ★★裁定 その76 の ときに 足した もの です。
--   ★★★いま、★上の ④ が 同じ ことを して います。
--     ★★決まりは `or` で つながります。★2つ ある と、
--       ★★`monka_read` を 持つ 方に、★学校ぜんぶの お知らせ **も** 開きます。
--     ★★★裁定 その88 の 分け方は こう です ──
--       ★★`teacher_id is null` → `renraku_all`
--       ★★`teacher_id is not null` → `monka_read`
--     ★★2つ目を 残すと、★その 分け方が 効きません。
--   ★★★同じ 決めが 2か所に ある 形 です。★1つに します。
drop policy if exists org_messages_select_monka_read on public.org_messages;

-- ★確かめ ── ★読む 決まりは 1本 に なった か
select p.polname from pg_policy p join pg_class c on c.oid = p.polrelid
where c.relname = 'org_messages' and p.polcmd = 'r' order by p.polname;
