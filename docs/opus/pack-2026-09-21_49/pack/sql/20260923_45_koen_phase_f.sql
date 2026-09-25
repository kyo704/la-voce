-- 20260923_45 公演の後半（進行表・出演料・参加費）に要る集計
-- ★本番を見たところ、表はすでに全部ある（koen_fees・koen_dues・koen_runsheet・koen_rooms）
--   足りないのは ★まとめて出す関数だけ。これを足せば 画面から1回呼ぶだけで済む
-- ★29・33・41・44 のあと。★体調の列を1つも返さない
-- ★本番で確かめた列名（2026-09-23）: koen_kids は ★nickname（name_at ではない）／koen_room_members は room_id・member_id・kid_id・row_id

-- ① 当日の進行（1枚）── 進行表＋呼び出し＋楽屋を 時刻の順に並べる
create or replace function public.koen_runsheet_sheet(p_koen uuid)
returns table(at_time time, what text, who text, kind text)
language sql stable security definer set search_path to 'public' as $$
  select r.at_time, r.what, r.who, '進行'::text
    from public.koen_runsheet r where r.koen_id = p_koen and public.koen_can_see(p_koen)
  union all
  select (c.call_at at time zone 'Asia/Tokyo')::time,
         coalesce(m.name_at, k.nickname)||' 入り', coalesce(c.note,''), '呼び出し'
    from public.koen_calls c
    left join public.koen_members m on m.id = c.member_id
    left join public.koen_kids    k on k.id = c.kid_id
   where c.koen_id = p_koen and public.koen_can_see(p_koen)
  union all
  select null::time, ro.name||'（楽屋）',
         (select string_agg(coalesce(mm.name_at,'—'), '、')
            from public.koen_room_members rm
            left join public.koen_members mm on mm.id = rm.member_id
           where rm.room_id = ro.id), '楽屋'
    from public.koen_rooms ro where ro.koen_id = p_koen and public.koen_can_see(p_koen)
  order by 1 nulls last, 4, 2;
$$;
revoke all on function public.koen_runsheet_sheet(uuid) from public, anon;
grant execute on function public.koen_runsheet_sheet(uuid) to authenticated;

-- ② 出演料の台帳（誰に いくら・払ったか）★運営だけ
create or replace function public.koen_fees_sheet(p_koen uuid)
returns table(member_name text, part text, amount_yen integer, paid_on date, memo text)
language sql stable security definer set search_path to 'public' as $$
  select coalesce(f.member_name_at, m.name_at), m.part, f.amount_yen, f.paid_on, f.memo
    from public.koen_fees f
    left join public.koen_members m on m.id = f.member_id
   where f.koen_id = p_koen and public.koen_can_manage(p_koen)
   order by 4 nulls first, 1;
$$;
revoke all on function public.koen_fees_sheet(uuid) from public, anon;
grant execute on function public.koen_fees_sheet(uuid) to authenticated;

-- ③ 参加費の台帳（集める側。免除も出す）★運営だけ
create or replace function public.koen_dues_sheet(p_koen uuid)
returns table(member_name text, kind text, amount_yen integer, waived boolean, paid_on date, memo text)
language sql stable security definer set search_path to 'public' as $$
  select coalesce(d.member_name_at, m.name_at), d.kind, d.amount_yen, d.waived, d.paid_on, d.memo
    from public.koen_dues d
    left join public.koen_members m on m.id = d.member_id
   where d.koen_id = p_koen and public.koen_can_manage(p_koen)
   order by 5 nulls first, 1;
$$;
revoke all on function public.koen_dues_sheet(uuid) from public, anon;
grant execute on function public.koen_dues_sheet(uuid) to authenticated;

-- ④ 公演の お金のまとめ（★出演料・参加費・公演の料金）
create or replace function public.koen_money_summary(p_koen uuid)
returns table(fees_total integer, fees_unpaid integer, dues_total integer, dues_unpaid integer,
              dues_waived integer, paid_tier integer, people integer)
language sql stable security definer set search_path to 'public' as $$
  select
    coalesce((select sum(f.amount_yen) from public.koen_fees f where f.koen_id = p_koen),0)::int,
    coalesce((select sum(f.amount_yen) from public.koen_fees f where f.koen_id = p_koen and f.paid_on is null),0)::int,
    coalesce((select sum(d.amount_yen) from public.koen_dues d where d.koen_id = p_koen and not d.waived),0)::int,
    coalesce((select sum(d.amount_yen) from public.koen_dues d where d.koen_id = p_koen and not d.waived and d.paid_on is null),0)::int,
    coalesce((select count(*) from public.koen_dues d where d.koen_id = p_koen and d.waived),0)::int,
    coalesce((select k.tier_people from public.koen k where k.id = p_koen),0),
    coalesce((select count(*) from public.koen_members m where m.koen_id = p_koen and m.left_at is null),0)::int
  where public.koen_can_manage(p_koen);
$$;
revoke all on function public.koen_money_summary(uuid) from public, anon;
grant execute on function public.koen_money_summary(uuid) to authenticated;

-- ⑤ 出演者ごとの1枚（★本人に渡す紙。自分のものだけ）
create or replace function public.my_koen_paper(p_koen uuid)
returns table(koen_title text, my_name text, my_part text, call_at timestamptz, dismiss_at timestamptz,
              session_kind text, session_at timestamptz, place text)
language sql stable security definer set search_path to 'public' as $$
  select k.title, m.name_at, m.part, c.call_at, c.dismiss_at, s.kind, s.starts_at, s.place
    from public.koen_members m
    join public.koen k on k.id = m.koen_id
    left join public.koen_calls c on c.member_id = m.id
    left join public.koen_sessions s on s.koen_id = k.id and s.canceled_at is null
        and c.call_at between s.starts_at - interval '6 hours' and coalesce(s.ends_at, s.starts_at + interval '12 hours')
   where m.koen_id = p_koen and m.user_id = auth.uid() and m.left_at is null
   order by c.call_at nulls last;
$$;
revoke all on function public.my_koen_paper(uuid) from public, anon;
grant execute on function public.my_koen_paper(uuid) to authenticated;

-- 確かめ（試しの環境で）
-- ① 進行表: 進行・呼び出し・楽屋が 時刻の順に1つの表で出る。★体調の列が無い
-- ② 出演料: 運営は見える／出演者は 0行（koen_can_manage）
-- ③ 参加費: 免除の印が出る／★率は出さない
-- ④ お金のまとめ: 出演料の合計・未払い・参加費の合計・未収・免除の数・段・いまの人数
-- ⑤ 自分の1枚: ★自分の呼び出しだけ。ほかの出演者の名前が出ない
