-- 20260923_68 門下の 決め方（裁定186）＋ 学生が 自分で 申し込む道
-- ★本番で確かめた（2026-09-23）:
--   ・assignments に 書けるのは ★名簿の札（meibo）だけ ＝ 学生は 申し込めない
--   ・学校の設定を 置く表が ★無い（org_contracts は 契約の話）
--   ・teacher_invitations は ★先生→学生 の向き。★逆向き（学生→先生）が 無い
--   ・未成年・年齢未回答は 門下に なれない（assert_student_is_adult。★この守りは 残す）
-- ★12・138 のあと

-- ① 学校の設定（★いまは 門下の決め方だけ。あとで 増やす）
create table if not exists public.org_settings (
  org_id      uuid primary key references public.organizations(id) on delete cascade,
  monka_way   text not null default 'invite'
              check (monka_way in ('jimu','invite','student')),   -- 事務／先生が招く／学生が選ぶ
  monka_needs_ok boolean not null default true,   -- ★学生が選ぶとき 先生の承認を もらうか
  updated_at  timestamptz not null default now(),
  updated_by  uuid
);
alter table public.org_settings enable row level security;
revoke all on public.org_settings from anon, authenticated;
grant select on public.org_settings to authenticated;
-- ★学校の中の人は 読める（学生も。自分が どのやり方の学校にいるか 分かるため）
drop policy if exists org_settings_read on public.org_settings;
create policy org_settings_read on public.org_settings for select to authenticated
  using (exists (select 1 from public.memberships m where m.org_id = org_settings.org_id and m.user_id = auth.uid()));
-- ★変えられるのは master だけ（関数を通す）
create or replace function public.set_monka_way(p_org uuid, p_way text, p_needs_ok boolean default true)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.has_can(p_org,'master') then raise exception 'NOT_MASTER'; end if;
  if p_way not in ('jimu','invite','student') then raise exception 'BAD_WAY'; end if;
  insert into public.org_settings(org_id, monka_way, monka_needs_ok, updated_at, updated_by)
  values (p_org, p_way, coalesce(p_needs_ok,true), now(), public.actor_id())
  on conflict (org_id) do update
     set monka_way = excluded.monka_way, monka_needs_ok = excluded.monka_needs_ok,
         updated_at = now(), updated_by = excluded.updated_by;
  insert into public.ops_audit_log(org_id, actor_id, action, target_kind, detail)
  values (p_org, public.actor_id(), 'monka_way_changed', 'org_settings',
          jsonb_build_object('way', p_way, 'needs_ok', coalesce(p_needs_ok,true)));
end $$;
revoke all on function public.set_monka_way(uuid, text, boolean) from public, anon;
grant execute on function public.set_monka_way(uuid, text, boolean) to authenticated;

-- ② 学生からの 申し込み（★逆向き。先生が 受けるまで 門下では ない）
create table if not exists public.monka_requests (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  student_id  uuid not null references auth.users(id) on delete cascade,
  teacher_id  uuid not null references auth.users(id) on delete cascade,
  status      text not null default 'waiting' check (status in ('waiting','accepted','declined','withdrawn')),
  requested_at timestamptz not null default now(),
  decided_at  timestamptz,
  student_name_at text,          -- ★退会しても 先生の画面が 壊れないように
  teacher_name_at text
);
create unique index if not exists monka_requests_one_waiting
  on public.monka_requests(org_id, student_id) where status = 'waiting';   -- ★同時に1つだけ
create index if not exists monka_requests_teacher_idx on public.monka_requests(teacher_id, status);
alter table public.monka_requests enable row level security;
revoke all on public.monka_requests from anon, authenticated;
grant select on public.monka_requests to authenticated;
drop policy if exists monka_requests_mine on public.monka_requests;
create policy monka_requests_mine on public.monka_requests for select to authenticated
  using (student_id = auth.uid() or teacher_id = auth.uid() or public.has_can(org_id,'meibo'));
-- ★書くのは 下の関数だけ

-- ③ 学生が 申し込む
create or replace function public.request_monka(p_org uuid, p_teacher uuid)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare v_id uuid; v_way text; v_ok boolean;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if not exists (select 1 from public.enrollments e
                  where e.org_id = p_org and e.student_id = auth.uid() and e.status = 'active') then
    raise exception 'NOT_ENROLLED';
  end if;
  select coalesce(s.monka_way,'invite'), coalesce(s.monka_needs_ok,true) into v_way, v_ok
    from public.org_settings s where s.org_id = p_org;
  if coalesce(v_way,'invite') <> 'student' then raise exception 'NOT_ALLOWED'; end if;  -- ★学校が 選んでいないとき
  if exists (select 1 from public.assignments a
              where a.org_id = p_org and a.student_id = auth.uid() and a.ended_at is null) then
    raise exception 'ALREADY_HAS_TEACHER';      -- ★掛け持ちは しない（外すのは 事務か先生）
  end if;
  -- ★申し込むところでも 年齢を見る（2026-09-23 の確かめで 分かった）
  --   引き金（assert_student_is_adult）は ★門下を作るときに 止めます。
  --   それだけだと ★未成年が 申し込めてしまい、★先生が 受けようとして 初めて 止まります
  --   → ★先生に 無駄な手間、★学生に 無駄な期待。ここで 止めます
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_under_18 is false) then
    raise exception 'MINOR_TEACHER_LINK_BLOCKED: 未成年、または年齢が未回答のアカウントは、先生とつながれません。';
  end if;

  if v_ok then
    insert into public.monka_requests(org_id, student_id, teacher_id, student_name_at, teacher_name_at)
    values (p_org, auth.uid(), p_teacher,
            (select coalesce(nullif(btrim(coalesce(p.display_name,'')),''), nullif(btrim(coalesce(p.name,'')),'')) from public.profiles p where p.id = auth.uid()),
            (select coalesce(nullif(btrim(coalesce(p.display_name,'')),''), nullif(btrim(coalesce(p.name,'')),'')) from public.profiles p where p.id = p_teacher))
    returning id into v_id;
    return v_id;
  end if;

  -- ★承認なしの学校: そのまま 門下にする（★未成年の守りは 引き金が 見ています）
  insert into public.assignments(org_id, teacher_id, student_id, started_at)
  values (p_org, p_teacher, auth.uid(), now()) returning id into v_id;
  return v_id;

exception when unique_violation then
  -- ★台帳の 生のことばを 学生の画面に 出さない（2026-09-23 差し戻し）
  --   「duplicate key value violates unique constraint ...」は 読めません
  --   ★sql/69 と 同じ形で 包みます
  raise exception 'ALREADY_REQUESTED: すでに お願いを 出しています。お返事を 待ってください';
end $$;
revoke all on function public.request_monka(uuid, uuid) from public, anon;
grant execute on function public.request_monka(uuid, uuid) to authenticated;

-- ④ 先生が 受ける・断る（★1タップ。理由は 聞かない）
create or replace function public.decide_monka_request(p_id uuid, p_accept boolean)
returns void language plpgsql security definer set search_path to 'public' as $$
declare r record;
begin
  select * into r from public.monka_requests where id = p_id and status = 'waiting';
  if r.id is null then raise exception 'NO_MATCH'; end if;
  if r.teacher_id <> auth.uid() and not public.has_can(r.org_id,'meibo') then raise exception 'NOT_YOURS'; end if;
  if p_accept then
    insert into public.assignments(org_id, teacher_id, student_id, started_at)
    values (r.org_id, r.teacher_id, r.student_id, now());
  end if;
  update public.monka_requests
     set status = case when p_accept then 'accepted' else 'declined' end, decided_at = now()
   where id = p_id;
end $$;
revoke all on function public.decide_monka_request(uuid, boolean) from public, anon;
grant execute on function public.decide_monka_request(uuid, boolean) to authenticated;

-- ⑤ 学生が 選ぶときの 一覧（★名前と 担当人数だけ。★空き・人気は 出さない）
create or replace function public.monka_teachers(p_org uuid)
returns table(teacher_id uuid, name text, students integer)
language sql stable security definer set search_path to 'public' as $$
  select m.user_id,
         coalesce(nullif(btrim(coalesce(p.display_name,'')),''),
                  nullif(btrim(coalesce(p.name,'')),''), '（名前なし）'),
         (select count(*)::int from public.assignments a
           where a.org_id = p_org and a.teacher_id = m.user_id and a.ended_at is null)
    from public.memberships m
    left join public.profiles p on p.id = m.user_id
   where m.org_id = p_org and m.role <> 'student'
     and exists (select 1 from public.enrollments e
                  where e.org_id = p_org and e.student_id = auth.uid() and e.status = 'active')
   order by 2;     -- ★名前の順。★担当人数の順では 並べない（人気の先生を 作らない）
$$;
revoke all on function public.monka_teachers(uuid) from public, anon;
grant execute on function public.monka_teachers(uuid) to authenticated;

-- 確かめ（試しの環境で）
-- 学校が 'invite' のまま 学生が申し込む → ★NOT_ALLOWED
-- 'student'＋承認あり → 申し込みが1件（★門下には まだ ならない）
-- 先生が 受ける → 門下になり、申し込みは accepted
-- 先生が 断る → declined。★門下にならない／★学生は もう一度 申し込める
-- 'student'＋承認なし → ★その場で 門下になる
-- すでに 先生がいる学生 → ALREADY_HAS_TEACHER
-- 同じ学生が 2つ 申し込む → ★ALREADY_REQUESTED（★台帳の 生のことばを 出さない）
-- ★未成年・年齢未回答 → ★申し込むところで 止まる（先生に 届かない）
--   ＋ 引き金（assert_student_is_adult）でも 止まる（★二重の守り）
-- monka_teachers → ★名前の順。★担当人数は 出るが 並び順には 使わない
