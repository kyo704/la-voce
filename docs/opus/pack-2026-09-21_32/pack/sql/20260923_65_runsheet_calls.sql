-- 20260923_65 当日の進行と 人を 結ぶ（★スタッフの「自分の区切り」が 出せなかった）
-- 見つけ方: 2026-09-23、見本に「スタッフの 自分の予定」「本番の日の 流れ」を作ったあと、
--   ★台帳に 対応するものが 無いことに 気づきました
-- いまの姿: koen_runsheet(at_time, what, who) の ★who は ただの文字（「照明・音響・舞台」）
--   → ★文字の一致で 人を当てるしかない（「照明」の人が2人いたら 区別できない・
--      役割名を 直した瞬間に 外れる）
-- 裁定148 Q6「スタッフには 自分が呼ばれた 区切りだけ」を ★台帳で 支えるために 結び目を作る
-- ★18・20・45 のあと

-- ① 区切り × 人（★誰を その区切りに 呼ぶか）
create table if not exists public.koen_runsheet_calls (
  runsheet_id uuid not null references public.koen_runsheet(id) on delete cascade,
  member_id   uuid not null references public.koen_members(id) on delete cascade,
  primary key (runsheet_id, member_id)
);
create index if not exists koen_runsheet_calls_member_idx on public.koen_runsheet_calls(member_id);
alter table public.koen_runsheet_calls enable row level security;
revoke all on public.koen_runsheet_calls from anon, authenticated;
grant select, insert, delete on public.koen_runsheet_calls to authenticated;

-- 運営が 組む。★本人は 自分の行だけ 読める（ほかの人の区切りは 見えない）
drop policy if exists koen_runsheet_calls_staff on public.koen_runsheet_calls;
create policy koen_runsheet_calls_staff on public.koen_runsheet_calls for all to authenticated
  using (exists (select 1 from public.koen_runsheet r where r.id = runsheet_id and public.koen_can_manage(r.koen_id)))
  with check (exists (select 1 from public.koen_runsheet r where r.id = runsheet_id and public.koen_can_manage(r.koen_id)));
drop policy if exists koen_runsheet_calls_mine on public.koen_runsheet_calls;
create policy koen_runsheet_calls_mine on public.koen_runsheet_calls for select to authenticated
  using (exists (select 1 from public.koen_members m where m.id = member_id and m.user_id = auth.uid()));

-- ② 本人の画面（★出演者は 全部の区切りを見て 自分のところが 濃い。
--    ★スタッフは 自分の区切りだけ。どちらも 1本の関数で出す）
create or replace function public.my_runsheet(p_koen uuid)
returns table(at_time time, what text, who text, mine boolean, sort_order integer)
language sql stable security definer set search_path to 'public' as $$
  with me as (
    select m.id, m.part from public.koen_members m
     where m.koen_id = p_koen and m.user_id = auth.uid() and m.left_at is null
     limit 1
  )
  select r.at_time, r.what, r.who,
         exists (select 1 from public.koen_runsheet_calls c, me
                  where c.runsheet_id = r.id and c.member_id = me.id),
         r.sort_order
    from public.koen_runsheet r, me
   where r.koen_id = p_koen
     and (me.part <> 'staff'                       -- ★出演者: 全部 見える（自分の所が mine=true）
          or exists (select 1 from public.koen_runsheet_calls c    -- ★スタッフ: 自分の区切りだけ
                      where c.runsheet_id = r.id and c.member_id = me.id))
   order by r.sort_order, r.at_time;
$$;
revoke all on function public.my_runsheet(uuid) from public, anon;
grant execute on function public.my_runsheet(uuid) to authenticated;

-- ③ 運営が「誰を どの区切りに 呼ぶか」を まとめて見る
create or replace function public.runsheet_staff_sheet(p_koen uuid)
returns table(member_id uuid, name_at text, part text, blocks text)
language sql stable security definer set search_path to 'public' as $$
  select m.id, m.name_at, m.part,
         (select string_agg(coalesce(to_char(r.at_time,'HH24:MI'),'—')||' '||r.what, '／' order by r.sort_order)
            from public.koen_runsheet_calls c
            join public.koen_runsheet r on r.id = c.runsheet_id
           where c.member_id = m.id)
    from public.koen_members m
   where m.koen_id = p_koen and m.left_at is null and public.koen_can_manage(p_koen)
   order by (m.part = 'staff') desc, m.name_at;
$$;
revoke all on function public.runsheet_staff_sheet(uuid) from public, anon;
grant execute on function public.runsheet_staff_sheet(uuid) to authenticated;

-- 確かめ（試しの環境で）
-- 運営が 区切りに スタッフを 結ぶ → その人の my_runsheet に ★その区切りだけ 出る
-- ★別のスタッフには 出ない（自分の区切りだけ）
-- 出演者の my_runsheet → ★全部の区切りが出て、自分の所だけ mine=true
-- 公演にいない人 → 0行
-- ★who（文字）は 残す（紙に出すときの 見出しに使う）。人の判定には 使わない
