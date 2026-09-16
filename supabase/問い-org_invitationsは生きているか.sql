-- ★`org_invitations` に、★生きて いる 行が あるか（★読むだけ）
--   ★出どころ　Opus（2026-09-16・Q3）
--   ★BEGIN / ROLLBACK は 使って いません（★2026-09-15 の 決め）。

select
  count(*)                                              as 全部,
  count(*) filter (where used_at is not null)           as 使われた,
  count(*) filter (where used_at is null
                     and (expires_at is null or expires_at > now())) as 生きている,
  count(*) filter (where used_at is null
                     and expires_at is not null
                     and expires_at <= now())           as 期限切れ,
  min(created_at)                                       as いちばん古い,
  max(created_at)                                       as いちばん新しい
from public.org_invitations;

-- ★どの 教室が 出したか（★中身は 出しません。数だけ）
select org_id, count(*) as 件,
       count(*) filter (where used_at is not null) as 使われた
from public.org_invitations
group by org_id
order by 件 desc;

-- ★使われた ものが、★memberships に 届いて いるか
--   ★★届いて いなければ、★途中で 落ちた 招待 です。
select
  (select count(*) from public.org_invitations where used_at is not null) as 使われた招待,
  (select count(*) from public.memberships where role = 'teacher')        as 講師の在籍;
