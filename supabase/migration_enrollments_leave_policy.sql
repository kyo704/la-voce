-- ===========================================================================
-- ★生徒が、★自分の 在籍を「やめる」に できる ように します
--
--   ★★上の 問い（`問い-enrollmentsを書き換えられるか.sql`）で
--     ★**UPDATE の 決まりが 無い** と 分かった ときだけ 走らせて ください。
--   ★★在った なら、★走らせないで ください。★条件が 上書きされます。
--
--   ★★できる ことを、★せまく します ──
--     ★自分の 行だけ（`auth.uid() = student_id`）
--     ★`active` の 行だけ（★`left` を `active` に 戻せません）
--     ★★書いた あとも 自分の 行の まま（★`with check`）
--   ★★「やめる」だけ を 許します。★戻すのは 招く 側の 仕事 です。
--
--   ★何度 走らせても 同じに なります。
-- ===========================================================================

do $$
begin
  if exists (
    select 1 from pg_policy p
    join pg_class c on c.oid = p.polrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'enrollments'
      and p.polcmd in ('w', '*')
  ) then
    raise notice '★書き換えの 決まりが すでに あります。★触って いません。';
  else
    execute $p$
      create policy enrollments_leave_own on public.enrollments
        for update
        using (auth.uid() = student_id and status = 'active')
        with check (auth.uid() = student_id)
    $p$;
    raise notice '★「やめる」の 決まりを 作りました。';
  end if;
end $$;

-- ★確かめ（★読むだけ）
select p.polname,
       case p.polcmd when 'w' then 'UPDATE' else p.polcmd::text end as どの操作,
       pg_get_expr(p.polqual, p.polrelid)      as 読む条件,
       pg_get_expr(p.polwithcheck, p.polrelid) as 書く条件
from pg_policy p
join pg_class c on c.oid = p.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'enrollments'
order by p.polname;
