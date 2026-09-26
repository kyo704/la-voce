-- 20260926_108 学科は ★消さない。★「使わない」に する
-- ★坂本さんの ご判断（2026-09-26）:「★学科の 話は 推奨で よい」
--   → ★私の 勧め（★「消す」を 出さない）を 採ります
-- ★★理由:
--   ★学科には ★人が ぶら下がって います（★名簿・先生・下書き・招待）
--   ★★消せる ように すると:
--     cascade → ★★学科を 消した 瞬間に ★生徒が 消えます
--     set null → ★★216人の 学科が 黙って 空に なります
--   ★★「直す」で 足ります。★「使わない」で 足ります
--   ★★★うちの 原則「取り上げない」と 合います
-- ★107 のあと

alter table public.org_divisions add column if not exists active boolean not null default true;
alter table public.org_divisions add column if not exists retired_at timestamptz;

-- ★★使わない ことに する（★消しません）
create or replace function public.retire_division(p_id uuid, p_on boolean default false)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_org uuid; v_people int;
begin
  select org_id into v_org from public.org_divisions where id = p_id;
  if v_org is null then return jsonb_build_object('ok', false, 'why', 'NOT_FOUND'); end if;
  if not public.has_can(v_org, 'meibo') then
    return jsonb_build_object('ok', false, 'why', 'NOT_ROSTER_KEEPER'); end if;

  -- ★★いま 何人 いるか（★止める ため では なく ★見せる ため）
  select count(*) into v_people from public.enrollments e
   where e.division_id = p_id and e.status = 'active';

  update public.org_divisions
     set active = p_on,
         retired_at = case when p_on then null else now() end
   where id = p_id;

  return jsonb_build_object('ok', true, 'active', p_on, 'people', v_people);
end $$;
revoke all on function public.retire_division(uuid, boolean) from public, anon;
grant execute on function public.retire_division(uuid, boolean) to authenticated;

-- ★★人が いても ★使わない ことに できます
--   ★理由: ★★止めると「★12人 移すまで 触れない」に なります
--         ★★年度の 変わり目は ★先に しまう ほうが 楽 です
--   ★★画面には 出します:「★この 学科には ★12人 います」
--   ★★それでも 押せる。★★判断は その 方の もの（★裁定: 判断を 取り上げない）

-- ★★名簿は ★そのまま:
--   ★enrollments.division_id は ★変わりません
--   ★★しまった 学科の 方も ★名簿に 残ります
--   ★画面で「★（使っていない 学科）」と 添えて ください

-- ★★新しく 選ぶ ときは ★active だけ
create or replace function public.active_divisions(p_org uuid)
returns setof public.org_divisions
language sql stable security definer set search_path to 'public' as $$
  select * from public.org_divisions d
   where d.org_id = p_org and d.active
   order by d.sort_order nulls last, d.name;
$$;
revoke all on function public.active_divisions(uuid) from public, anon;
grant execute on function public.active_divisions(uuid) to authenticated;

-- ★★「消す」は ★作りません
--   ★★画面にも 出さないで ください
--   ★★間違えて 作った 学科は ── ★名前を 直すか、しまう

-- 確かめ（試しの環境で）
-- ★active の 既定は true
-- ★★人が いても しまえる（★止まらない）
-- ★しまっても ★名簿は 残る
-- ★active_divisions に しまった ものが 出ない
-- ★名簿の 札を 持たない 人は しまえない
