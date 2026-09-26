-- 20260926_103 合言葉の 人数上限と 打ち間違い（★裁定83 §3・§4・裁定204）
-- Code の 指摘（2026-09-26）:
--   ★見本の 約束「★あと18人」「★20人で 自動的に 閉じる」
--     「★打ち間違いは おひとり 10回まで」を 実現する 列が ★ありません
-- ★★そのとおりです。★見本に 書いてあるのに 台帳が 支えていません
-- ★102 のあと

-- ★★門下の 合言葉（★見せる・QR）── ★人数の 上限を ★先生が 決めます
alter table public.teacher_invitations add column if not exists cap integer;
alter table public.teacher_invitations add column if not exists used_count integer not null default 0;
alter table public.teacher_invitations drop constraint if exists teacher_inv_cap_ok;
alter table public.teacher_invitations add constraint teacher_inv_cap_ok
  check (cap is null or (cap between 1 and 200));
-- ★cap が null ＝ ★個別の 合言葉（★1回 使ったら 閉じる・裁定83 §4-2）
-- ★cap が 数 ＝ ★門下の 合言葉（★その 人数で 閉じる）

-- ★★打ち間違いの 数え方（★裁定83 §4-3）
--   ✕ ★IP で 数えない ── ★★学校の WiFi は 1つの IP に 見えます
--   ○ ★★ログイン済みの 人だけが 打てる。★1人あたり 10回
create table if not exists public.invite_attempts (
  user_id  uuid not null references auth.users(id) on delete cascade,
  day      date not null,
  n        integer not null default 0,
  primary key (user_id, day)
);
alter table public.invite_attempts enable row level security;
revoke all on public.invite_attempts from anon, authenticated;
-- ★★誰にも 渡しません（★関数の 中だけ）

create or replace function public.try_invite_code(p_code text)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_me uuid := auth.uid(); v_n int; v_inv record;
begin
  if v_me is null then raise exception 'NOT_AUTHENTICATED'; end if;

  -- ★★1人あたり 10回（★その日のうち）
  insert into public.invite_attempts(user_id, day, n)
  values (v_me, (now() at time zone 'Asia/Tokyo')::date, 0)
  on conflict (user_id, day) do nothing;
  select n into v_n from public.invite_attempts
   where user_id = v_me and day = (now() at time zone 'Asia/Tokyo')::date;
  if v_n >= 10 then return jsonb_build_object('ok', false, 'why', 'TOO_MANY_TRIES'); end if;

  select * into v_inv from public.teacher_invitations
   where code = p_code and used_at is null and expires_at > now();

  -- ★★2026-09-26 に 見つけた 誤り:
  --   ★はじめ「数えてから raise exception」と 書きました
  --   ★★raise は ★★直前の 数え上げも 取り消します
  --   ★★数えた つもりで ★1回も 数えて いませんでした
  --   → ★★間違いは ★raise せず ★返して、★数えを 残します
  if v_inv.code is null then
    update public.invite_attempts set n = n + 1
     where user_id = v_me and day = (now() at time zone 'Asia/Tokyo')::date;
    return jsonb_build_object('ok', false, 'why', 'CODE_NOT_FOUND');
  end if;

  -- ★★人数の 上限（★達したら 自動で 閉じる）
  --   ★★これは ★打ち間違いでは ありません（★数えません）
  if v_inv.cap is not null and v_inv.used_count >= v_inv.cap then
    return jsonb_build_object('ok', false, 'why', 'CODE_FULL');
  end if;

  -- ★★数える。★個別の 合言葉（cap が null）は ★1回で 閉じます
  update public.teacher_invitations
     set used_count = used_count + 1,
         used_at = case when cap is null then now() else used_at end,
         used_by_student_id = case when cap is null then v_me else used_by_student_id end
   where code = p_code;

  return jsonb_build_object('ok', true, 'org_id', v_inv.org_id,
                            'monka_teacher_id', v_inv.monka_teacher_id);
end $$;
revoke all on function public.try_invite_code(text) from public, anon;
grant execute on function public.try_invite_code(text) to authenticated;
-- ★★ログイン済みの 人だけ（★裁定83 §4-3）

-- ★★画面が 出す もの（★見本の とおり）
create or replace function public.invite_status(p_code text)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select case when t.code is null then jsonb_build_object('ok', false)
    else jsonb_build_object('ok', true,
      'left', case when t.cap is null then null else greatest(t.cap - t.used_count, 0) end,
      'cap', t.cap,
      'until', (t.expires_at at time zone 'Asia/Tokyo')::date)
  end
  from public.teacher_invitations t
  where t.code = p_code
    and (t.monka_teacher_id = auth.uid() or t.teacher_id = auth.uid());
$$;
revoke all on function public.invite_status(text) from public, anon;
grant execute on function public.invite_status(text) to authenticated;
-- ★★作った 先生だけが 見られます（★「あと18人」は ★先生の 画面）

-- ★★90日で 掃除
create or replace function public.sweep_invite_attempts()
returns integer language sql security definer set search_path to 'public' as $$
  with d as (delete from public.invite_attempts
              where day < (now() at time zone 'Asia/Tokyo')::date - 90 returning 1)
  select count(*)::int from d;
$$;
revoke all on function public.sweep_invite_attempts() from public, anon, authenticated;

-- 確かめ（試しの環境で・★なりきって）
-- ★cap=2 → ★2人 入れる。★3人目は CODE_FULL
-- ★★打ち間違い 10回 → TOO_MANY_TRIES
-- ★★同じ 場所（同じ IP）でも ★人ごとに 数える
-- ★cap が null → ★1回で 閉じる
-- ★★間違いは ★raise せず {ok:false, why} を 返す（★数えが 残る ため）
--   ★★画面は why を t('err.<why>') で 引きます
-- ★invite_status は ★作った 先生だけ
