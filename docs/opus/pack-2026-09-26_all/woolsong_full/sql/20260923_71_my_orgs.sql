-- 20260923_71 複数の学校に いる人（★裁定140 と 同じ形に そろえる）
-- Code の報告（2026-09-23）:「授業の時間を出す」が ★最初の1校しか 見ていない
-- ★本番に 複数校の人は すでに 3人 います
-- 裁定140 の形:「★学校の札を 並べ、★選んだ学校だけ 見せ、★混ぜない」
-- ★台帳を 確かめた結果:
--   ・busy_at は ★すでに 学校を 呼ぶ側から 受け取る形（sql/56＋63 で 直した）
--   ・timetable_share は ★(user_id, org_id) の 組で 持つ（sql/63 で 直した）
--   → ★足りないのは「★その人が どの学校に いるか」を 返すもの だけ
--   ・本番の関数で limit 1 で 学校を選んでいるものは ★無い（今日 洗った）
--   ・★学生は memberships に いない（role は owner/admin/teacher/staff）。★enrollments です
-- ★12・56・63 のあと

-- ① 自分が いる学校（★札を 並べるために 使う）
create or replace function public.my_orgs()
returns table(org_id uuid, name text, is_student boolean, sort_key text)
language sql stable security definer set search_path to 'public' as $$
  -- ★学生は memberships に いません（role は owner/admin/teacher/staff だけ）。
  --   ★学生は enrollments です（2026-09-23 に 試しの環境で 入れてみて 分かった）
  --   → ★両方から 集めます。片方だけだと ★学生に 1件も 出ません
  with mine as (
    select m.org_id, false as as_student from public.memberships m where m.user_id = auth.uid()
    union
    select e.org_id, true from public.enrollments e where e.student_id = auth.uid() and e.status = 'active'
  )
  select o.id,
         coalesce(nullif(btrim(coalesce(o.name,'')),''), '（名前なし）'),
         bool_or(mine.as_student),
         coalesce(nullif(btrim(coalesce(o.name,'')),''), 'zzz')
    from mine
    join public.organizations o on o.id = mine.org_id
   group by o.id, o.name
   order by 4;     -- ★名前の順（★「最初の1つ」を こちらで 選ばない）
$$;
revoke all on function public.my_orgs() from public, anon;
grant execute on function public.my_orgs() to authenticated;

-- ② 授業の時間を 出す・出さない を ★学校ごとに 読む
create or replace function public.my_timetable_share()
returns table(org_id uuid, name text, shares boolean)
language sql stable security definer set search_path to 'public' as $$
  select mo.org_id, mo.name, coalesce(s.shares, false)
    from public.my_orgs() mo
    left join public.timetable_share s on s.user_id = auth.uid() and s.org_id = mo.org_id
   where mo.is_student           -- ★学生として いる学校だけ（先生には 関係ない）
   order by mo.sort_key;
$$;
revoke all on function public.my_timetable_share() from public, anon;
grant execute on function public.my_timetable_share() to authenticated;

-- ③ 学校ごとに 出す・出さない を 決める（★本人だけ）
create or replace function public.set_timetable_share(p_org uuid, p_shares boolean)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if not exists (select 1 from public.enrollments e
                  where e.org_id = p_org and e.student_id = auth.uid() and e.status = 'active') then
    raise exception 'NOT_ENROLLED';     -- ★いない学校には 出せない
  end if;
  insert into public.timetable_share(user_id, org_id, shares, updated_at)
  values (auth.uid(), p_org, coalesce(p_shares,false), now())
  on conflict (user_id, org_id) do update
     set shares = excluded.shares, updated_at = now();
end $$;
revoke all on function public.set_timetable_share(uuid, boolean) from public, anon;
grant execute on function public.set_timetable_share(uuid, boolean) to authenticated;

-- 確かめ（試しの環境で）
-- 1校の人 → my_orgs が 1行（★画面は 札を 出さない＝裁定73）
-- 2校の人 → 2行。★名前の順（こちらで「最初の1つ」を 選ばない）
-- A校だけ 出すと決める → my_timetable_share は A=true・B=false（★混ざらない）
-- いない学校に 出そうとする → NOT_ENROLLED
-- 先生として いる学校 → ★my_timetable_share には 出ない（学生の話なので）
