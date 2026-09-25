-- 20260925_90 お仕事（field）を profiles に（★裁定202）
-- Code の指摘（2026-09-25）:
--   ★見本は ★3分野（music／voice／stage）を 選ばせる
--   ★対応表には「profiles の occupation」と 書いてあった ── ★★私の 誤り
--   ★occupation は ★11種（★声の 使い方の 分類・VocalTracker）── ★別の 軸
-- ★★field は ★アプリ ぜんぶの ことばを 変えます
--   ★portfolios.field は ★ホームページの 表。★持っていない人の 分が 置けません
--   → ★profiles に 持ちます（★portfolios.field は ★型の 出し分け用に 残す）
-- ★82 のあと

alter table public.profiles add column if not exists field text default 'music'
  check (field in ('music','voice','stage'));
-- ★既定は music（裁定119）。★いまの方は 全員 music の ままに なります

-- ★portfolios.field を すでに 入れている方は 写す（★1度だけ）
update public.profiles p
   set field = f.field
  from public.portfolios f
 where f.user_id = p.id
   and f.field in ('music','voice','stage')
   and p.field is distinct from f.field;

-- ★「さがす」を 出すか（★裁定119 §さがす・裁定202 §3）
create or replace function public.can_see_sagasu()
returns boolean language sql stable security definer set search_path to 'public' as $$
  select coalesce((select p.field from public.profiles p where p.id = auth.uid()), 'music') = 'music'
     and exists (select 1 from public.enrollments e
                  where e.student_id = auth.uid() and e.status = 'active');
$$;
revoke all on function public.can_see_sagasu() from public, anon;
grant execute on function public.can_see_sagasu() to authenticated;
-- ★★いまの 名簿ベースの 出し分けに ★field を and で 足しただけ です
--   ★声優・舞台の 方に「伴奏を さがす」は 出しません
--   ★「ことばを 変える」だけでは 足りません。★要らない 機能は 引っ込めます

-- 確かめ（試しの環境で・★なりきって）
-- 既定は music／★voice に すると can_see_sagasu() が false
-- ★教室に 入っていない方は music でも false（★いまの 決まりの まま）
-- ★occupation（11種）は ★1つも 触りません
-- ★書いた 記録は ★1つも 変わりません（★ことばの 見え方だけ）
