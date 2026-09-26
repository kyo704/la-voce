-- 20260924_78 ポートフォリオの 公開の範囲を 3つに（★裁定129 のとおり）
-- 見つけ方（2026-09-24・C群 第1段の 台帳を 1画面ずつ 見ていて）:
--   ★裁定129 P6:「scope: 自分だけ ／ 同じ学校 ／ ★誰でも。★既定は 自分だけ」
--   ★台帳: portfolios_visibility_check ＝ ★'self' か 'public' の ★2つ だけ
--   → ★「同じ学校の方」を 選ぶと ★保存で 落ちます（★C群の「出す」を 作ると すぐ 出ます）
--   ★見本も ばらついていました:
--     「出す」＝自分だけ／同じ学校の方／どなたでも（★3つ・裁定どおり）
--     「公開の範囲」＝自分だけ／同じ学校の在籍者だけ／URLを知っている人だけ（★3つ目が 違う）
--   ★裁定が 正（裁定179・M20d）→ ★台帳を 3つに 広げ、★見本の「公開の範囲」を そろえます
-- ★11・19・21 のあと
-- ★見つけたもの 2つ: ★visibility が 2値（裁定は 3つ）／★noindex の 列が 無い

-- ⓪ ★検索に 出さない（noindex）の 列が ★ありませんでした
--    ★裁定129 P6:「noindex: ★本人が 選べる」／★見本の「出す」にも 札が あります
--    ★台帳に 列が 無い ＝ ★選んでも 保存できません（★見本だけの 機能でした）
alter table public.portfolios add column if not exists noindex boolean not null default true;
-- ★既定は true（★検索に 出さない）。★裁定73 の 考え: ★何もしなければ 出ない

-- ① 3つに 広げる（★いまの行は self／public のまま 通ります）
alter table public.portfolios drop constraint if exists portfolios_visibility_check;
alter table public.portfolios add constraint portfolios_visibility_check
  check (visibility in ('self','org','public'));
-- ★self=自分だけ（既定）／★org=同じ学校の方／★public=どなたでも

-- ② 「同じ学校の方」が 読めるように
--    ★2026-09-24 に 試して 分かったこと（★試さなければ 気づきませんでした）:
--      ★はじめ ポリシーの中で enrollments を 直に 見る形に しました → ★0件でした
--      ★理由: ★ポリシーの中の enrollments にも ★読み手の RLS が かかります
--        enrollments_select ＝ has_can(org_id,'meibo') ＝ ★学生は 名簿を 読めません
--        → ★条件が いつも 偽に なります（★エラーは 出ません・★静かに 読めない）
--    → ★security definer の 関数に 出して、★そこから 見ます
create or replace function public.same_org_as(p_other uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (
    select 1
      from public.enrollments a
      join public.enrollments b on b.org_id = a.org_id
     where a.student_id = p_other and a.status = 'active'
       and b.student_id = auth.uid() and b.status = 'active');
$$;
revoke all on function public.same_org_as(uuid) from public, anon;
grant execute on function public.same_org_as(uuid) to authenticated;

drop policy if exists portfolios_read_scope on public.portfolios;
create policy portfolios_read_scope on public.portfolios for select to authenticated
  using (
    user_id = auth.uid()                       -- ★本人
    or visibility = 'public'                   -- ★どなたでも
    or (visibility = 'org' and public.same_org_as(portfolios.user_id))   -- ★同じ学校の方
  );

-- ③ ★18歳未満は「どなたでも」を 選べない（裁定129 P6・裁定107 の 考え）
create or replace function public.set_portfolio_scope(p_scope text, p_noindex boolean default null)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_scope not in ('self','org','public') then raise exception 'BAD_SCOPE'; end if;
  if p_scope = 'public'
     and not exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_under_18 is false) then
    raise exception 'MINOR_NO_PUBLIC: 18歳未満の方は、どなたでも 見られる 形には できません。';
  end if;
  update public.portfolios
     set visibility = p_scope,
         noindex = coalesce(p_noindex, noindex)
   where user_id = auth.uid();
  if not found then raise exception 'NO_PORTFOLIO'; end if;
end $$;
revoke all on function public.set_portfolio_scope(text, boolean) from public, anon;
grant execute on function public.set_portfolio_scope(text, boolean) to authenticated;

-- 確かめ（試しの環境で・★なりきって）
-- 'org' が 入る（★前は CHECK で 落ちた）
-- ★同じ学校の 人 → 読める／★よその学校の 人 → 読めない／★未認証 → 読めない
-- 'public' → 誰でも 読める／'self' → 本人だけ
-- ★18歳未満が 'public' → MINOR_NO_PUBLIC
-- ★既定は 'self'
-- ★noindex の 既定は true（検索に 出さない）／★本人が 変えられる
