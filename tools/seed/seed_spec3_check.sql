-- 仕様シート③を確かめるための仕込み（試しの台帳だけ・2026-09-21）
--   /api/org/posts は `post`（ひとの役職を変える）を求めます。
--   試しの学部長は持っていません。一時だけ足します。
update public.org_posts set perms = perms || '{"post": true}'::jsonb
 where id = '33333333-3333-4333-8333-333333333333';
