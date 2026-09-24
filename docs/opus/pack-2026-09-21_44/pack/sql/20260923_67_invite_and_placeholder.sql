-- 20260923_67 出演者の 招き方（★名簿から／★名前だけで先に置く）
-- 坂本さんの問い（2026-09-23）:「名簿は どういう仕組みで そこに出す？公演しか使わない人は？」
-- 調べて 分かったこと:
--   ① 合言葉（koen_join_codes）＝ ★公演だけの人の道。★これは できている（sql/46 で守りも足した）
--   ② 「名簿から 招く」の ★名簿を返す関数が 無い（見本は 3人の決め打ち）
--   ③ ★「招いたが まだ入っていない人」を 置けない
--      市民オペラは「先に 名簿を作り、あとから 各自に 登録してもらう」が ふつう
--      いまの形だと ★全員が登録するまで 香盤表が 作れない
-- ★12・18・46 のあと
-- ★2026-09-23 差し戻し: coalesce だけでは ★空の文字を 名前として拾います
--   → nullif(btrim(...)) の形に直しました（get_connected_names と 同じ）

-- ① 名前だけで 先に置けるようにする（★user_id が 空のまま）
--    すでに koen_members.user_id は null を許している（本番で確認）。
--    ★足りないのは「あとで つなぐ」道と「招いた印」
alter table public.koen_members add column if not exists invite_code text;   -- ★その人だけの合言葉
create unique index if not exists koen_members_invite_code_idx
  on public.koen_members(invite_code) where invite_code is not null;

-- ② 学校の名簿から 招ける人を返す（★学校の公演のときだけ）
create or replace function public.koen_invitable(p_koen uuid, p_q text default null)
returns table(user_id uuid, name text, already boolean)
language sql stable security definer set search_path to 'public' as $$
  -- ★空の文字（''）は 名前ではない。nullif(btrim(...)) で 落としてから 次を見る
  --   （2026-09-23: coalesce だけだと ★空の行が3つ並びました。get_connected_names と同じ形に）
  select e.student_id,
         coalesce(nullif(btrim(coalesce(p.display_name,'')),''),
                  nullif(btrim(coalesce(p.name,'')),''),
                  '（名前なし）'),
         exists (select 1 from public.koen_members m
                  where m.koen_id = p_koen and m.user_id = e.student_id and m.left_at is null)
    from public.koen k
    join public.enrollments e on e.org_id = k.org_id and e.status = 'active'
    left join public.profiles p on p.id = e.student_id
   where k.id = p_koen and k.org_id is not null
     and public.koen_can_manage(p_koen)
     and (p_q is null or btrim(p_q) = ''
          or coalesce(p.display_name,'') ilike '%'||p_q||'%'
          or coalesce(p.name,'') ilike '%'||p_q||'%'
          or coalesce(p.kana,'') ilike '%'||p_q||'%')
   order by 3, 2
   limit 200;
$$;
revoke all on function public.koen_invitable(uuid, text) from public, anon;
grant execute on function public.koen_invitable(uuid, text) to authenticated;
-- ★学校の公演でないとき（org_id が空＝市民オペラ）は 0行。★合言葉を使います

-- ③ 名前だけで 先に置く（★登録していない人の枠）
create or replace function public.add_member_placeholder(p_koen uuid, p_name text, p_part text default 'cast')
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare v_id uuid; v_code text;
begin
  if not public.koen_can_manage(p_koen) then raise exception 'NOT_STAFF'; end if;
  if btrim(coalesce(p_name,'')) = '' then raise exception 'NO_NAME'; end if;
  -- ★その人だけの 合言葉（8文字）。★公演の合言葉とは 別
  v_code := upper(substr(encode(extensions.gen_random_bytes(8),'hex'), 1, 8));
  insert into public.koen_members(koen_id, user_id, name_at, part, invited_at, invite_code)
  values (p_koen, null, left(btrim(p_name), 40), p_part, now(), v_code)
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.add_member_placeholder(uuid, text, text) from public, anon;
grant execute on function public.add_member_placeholder(uuid, text, text) to authenticated;
-- ★人数の段の確かめ（check_koen_tier）は そのまま効きます（置いた人も 1人と数えます）

-- ④ その人が あとから 自分の合言葉で つながる
create or replace function public.claim_member(p_code text)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare v_id uuid; v_koen uuid;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select m.id, m.koen_id into v_id, v_koen from public.koen_members m
   where m.invite_code = upper(btrim(p_code)) and m.user_id is null and m.left_at is null;
  if v_id is null then raise exception 'NO_MATCH'; end if;      -- ★理由を分けない
  if exists (select 1 from public.koen_members m2
              where m2.koen_id = v_koen and m2.user_id = auth.uid() and m2.left_at is null) then
    raise exception 'NO_MATCH';                                  -- ★二重に入らない
  end if;
  update public.koen_members
     set user_id = auth.uid(), joined_at = now(), invite_code = null
   where id = v_id;
  return v_id;
end $$;
revoke all on function public.claim_member(text) from public, anon;
grant execute on function public.claim_member(text) to authenticated;

-- ⑤ 運営が「まだ つながっていない人」を 見る
create or replace function public.koen_unclaimed(p_koen uuid)
returns table(member_id uuid, name_at text, part text, invite_code text, invited_at timestamptz)
language sql stable security definer set search_path to 'public' as $$
  select m.id, m.name_at, m.part, m.invite_code, m.invited_at
    from public.koen_members m
   where m.koen_id = p_koen and m.user_id is null and m.left_at is null
     and public.koen_can_manage(p_koen)
   order by m.invited_at;
$$;
revoke all on function public.koen_unclaimed(uuid) from public, anon;
grant execute on function public.koen_unclaimed(uuid) to authenticated;

-- 確かめ（試しの環境で）
-- ★名前だけで置く → 香盤表に 並ぶ／★人数に 数える／★体調の記録は 無い（本人がいないため）
-- 置いた人の 合言葉で つながる → user_id が入り、★合言葉は 消える（使い捨て）
-- 同じ合言葉を 2回 → NO_MATCH（★理由は 分けない）
-- すでに その公演にいる人が 使う → NO_MATCH（★二重に入らない）
-- 学校の公演で koen_invitable → 在籍の学生が 並ぶ（★すでに入っている人には 印）
-- ★市民オペラ（org_id が空）で koen_invitable → ★0行（合言葉を使う）
