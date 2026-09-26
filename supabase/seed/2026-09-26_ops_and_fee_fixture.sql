-- ============================================================================
-- ★試しの 台帳 だけ ── ★「教室の運営」と「わたしの出演料」の 種（★2026-09-26）
--
--   ★★★① 役職を 付けます（★運営の 入口が 出る 条件）──
--     ★`mayEnterOpsHere(mm)` は `mm.post_id` の 役職の できことを 見ます。
--     ★★役職が 無い と `null` を 渡す ので、★入口の 行が 出ません。
--     ★★試しの 口座は `admin` ですが 役職が 空でした。★「学長」を 付けます。
--
--   ★★★② 公演と 出演料を 1件（★見本 `SC['わたしの出演料']` と 同じ 中身）──
--     ★`koen_fees.member_id` は **`koen_members`** を 指します（★`memberships` では
--       ありません）。★2026-09-26 に 取り違えて 23503 で 落ちました ──
--       ★列の 名（`member_id`）から 決めず、★外つ鍵を 数えて から 書くこと。
--     ★★だから 鎖は 公演 → 公演の 人（`koen_members`）→ 出演料 です。
--     ★見本 …… ★フィガロの結婚／○○市民オペラ／50,000円／
--       ★本番1回 ＋ 稽古3回 まとめて／お渡し まだ（`paid_on` は 空）。
--
--   ★★本番に 入れません。★`la-voce-test2`（`orutyqtfygvzcuhjgsch`）だけ です。
--   ★★何度 走らせても 同じ です。
-- ============================================================================

-- ① ★役職を 付ける
update public.memberships
   set post_id = 'bbbb0001-0000-4000-8000-000000000001'
 where id = '6d544870-4e19-4275-b735-7be3cdb5e607'
   and post_id is null;

-- ② ★公演
insert into public.koen (id, org_id, owner_user_id, title, kind, venue, status, tier_people)
values ('c3000000-0000-4000-8000-000000000001',
        'aaaa0001-0000-4000-8000-000000000001',
        'e45e50eb-ed09-402f-9dc7-73bda4852380',
        'フィガロの結婚', 'opera', '○○市民ホール', 'open', 15)
on conflict (id) do nothing;

-- ② ★公演の 人（★ご自分・★出演）
insert into public.koen_members
  (id, koen_id, user_id, name_at, part, can_manage, joined_at)
values ('c5000000-0000-4000-8000-000000000001',
        'c3000000-0000-4000-8000-000000000001',
        'e45e50eb-ed09-402f-9dc7-73bda4852380',
        '★たしかめ 用', 'cast', false, now())
on conflict (id) do nothing;

-- ② ★出演料（★1件・★ご自分の ぶん だけ）
insert into public.koen_fees
  (id, koen_id, koen_title_at, member_id, member_name_at, amount_yen, memo, paid_on)
values ('c4000000-0000-4000-8000-000000000001',
        'c3000000-0000-4000-8000-000000000001',
        'フィガロの結婚',
        'c5000000-0000-4000-8000-000000000001',
        null,
        50000, '本番1回 ＋ 稽古3回 まとめて', null)
on conflict (id) do nothing;

-- ★消す とき
--   delete from public.koen_fees    where id = 'c4000000-0000-4000-8000-000000000001';
--   delete from public.koen_members where id = 'c5000000-0000-4000-8000-000000000001';
--   delete from public.koen      where id = 'c3000000-0000-4000-8000-000000000001';
--   update public.memberships set post_id = null where id = '6d544870-4e19-4275-b735-7be3cdb5e607';
