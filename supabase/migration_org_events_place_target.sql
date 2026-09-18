-- ===========================================================================
-- ★行事の 場所と 対象（★裁定 その89・2026-09-18）
--
--   ★★★Q2 場所 ── ★1列 だけ。★自由に 打ちます。★表は 作りません。
--     ★★裁定 その89 ──「場所の 表は、★部屋の 予約を 始める ときに 要る。いまは 不要」
--     ★★★`koma` / `lessons` / `org_events` の 3つが、★同じ「場所」を 指します。
--       ★★別々に 作ると、★表が 2つ できます。★そのときは **同時に** 繋ぎます。
--       ★★台帳 docs/ledgers/08-保留している決め.md 08-7
--
--   ★★★Q3 対象 ── ★2列に 分けます。
--     ★★見本が 2つ 選ぶ のは、★絞りが 2軸 だから です ──
--       ★「声楽の 3年」「全学科の 1年2年」。
--     ★★1列に まとめると、★探すのも 出すのも 字の 読み解きに なります。
--
--   ★★★空の 並び ＝ **みなさん**。★`null` に しません（★裁定 その89 RULE）。
--     ★★`null` は「まだ 決めて いない」と「みなさん」を 分けられません。
--     ★★★いまの 51行は `target_group` が **ぜんぶ 空** でした（★数えました）。
--       ★★どれも 学校 ぜんぶの 行事 です。★`{}`（みなさん）で 正しい です。
--       ★★★ふだんの 決まりは「埋め戻さない」です（★2026-09-13）。
--         ★★ここは 例外 です ── ★もとの 値が 無く、★意味も 1つ しか ありません。
--
--   ★★何度 走らせても 同じに なります。★`BEGIN`／`ROLLBACK` を 使って いません。
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 【一】★場所（★自由に 打つ 1列）
-- ---------------------------------------------------------------------------
alter table public.org_events
  add column if not exists place text;

comment on column public.org_events.place is
  '場所。自由記述。表は作らない（部屋の予約を始めるときに org_places を作り、koma/lessons と同時に繋ぐ）。裁定その89・2026-09-18。';

-- ---------------------------------------------------------------------------
-- 【二】★対象（★2軸）
-- ---------------------------------------------------------------------------
alter table public.org_events
  add column if not exists target_grades text[] not null default '{}',
  add column if not exists target_courses text[] not null default '{}';

comment on column public.org_events.target_grades is
  '対象の学年。空の並び＝みなさん。null にしない。裁定その89・2026-09-18。';
comment on column public.org_events.target_courses is
  '対象の学科・コース。空の並び＝みなさん。null にしない。裁定その89・2026-09-18。';

-- ---------------------------------------------------------------------------
-- 【三】★古い 1列を 外します
--
--   ★★51行 とも 空 でした（★2026-09-18・数えました）。★移す ものが ありません。
--   ★★★消す 前に もう一度 数えます。★空で なければ 止まります。
-- ---------------------------------------------------------------------------
do $$
declare
  v_nokori int;
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'org_events'
      and column_name = 'target_group'
  ) then
    execute 'select count(*) from public.org_events where target_group is not null'
      into v_nokori;
    if v_nokori > 0 then
      raise exception '★止まりました ── target_group に % 行 入って います。移し方を 決めて ください', v_nokori;
    end if;
    execute 'alter table public.org_events drop column target_group';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 【四】★出す 道を 広げます
--
--   ★★★古い 呼び方（4つ）を 外します。
--     ★★同じ 名で 引数の 数が ちがう ものが 2つ ある と、
--       ★★どちらが 呼ばれるか 分かりにくく なります。
--     ★★2026-09-18、★実際に 2つ 並びました。★片方を 外します。
-- ---------------------------------------------------------------------------
drop function if exists public.create_org_event(uuid, date, text, text);

create or replace function public.create_org_event(
  p_org_id uuid,
  p_event_date date,
  p_kind text,
  p_title text,
  p_start_time time default null,
  p_end_time time default null,
  p_place text default null,
  -- ★★空の 並びが 既定 です。★「みなさん」です。
  p_target_grades text[] default '{}',
  p_target_courses text[] default '{}'
) returns uuid
language plpgsql security definer set search_path to 'public'
as $function$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  if not public.is_org_owner_or_admin(auth.uid(), p_org_id) then
    return null;
  end if;

  -- ★★前後が 逆なら、★その場で 止めます（★画面でも 止めます。★二重に します）。
  if p_start_time is not null and p_end_time is not null and p_end_time <= p_start_time then
    raise exception 'EVENT_TIME_REVERSED';
  end if;
  if p_start_time is null and p_end_time is not null then
    raise exception 'EVENT_END_WITHOUT_START';
  end if;

  insert into public.org_events (
    org_id, event_date, kind, title, start_time, end_time, place,
    target_grades, target_courses, created_by
  ) values (
    p_org_id, p_event_date, p_kind, coalesce(p_title, ''),
    p_start_time, p_end_time, nullif(btrim(coalesce(p_place, '')), ''),
    -- ★★`null` を 受け取っても、★空の 並びに します（★裁定 その89 RULE）。
    coalesce(p_target_grades, '{}'), coalesce(p_target_courses, '{}'),
    auth.uid()
  ) returning id into v_id;
  return v_id;
end;
$function$;

revoke all on function public.create_org_event(uuid, date, text, text, time, time, text, text[], text[])
  from public, anon;
grant execute on function public.create_org_event(uuid, date, text, text, time, time, text, text[], text[])
  to authenticated;

-- ---------------------------------------------------------------------------
-- 【五】★確かめ
-- ---------------------------------------------------------------------------
select p.proname, pg_get_function_identity_arguments(p.oid) as hikisuu
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'create_org_event';

select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'org_events'
order by ordinal_position;
-- ★★★6つ の ほうも 外します（★2026-09-18）。
--   ★★きょう、★同じ 名で 引数の ちがう ものを **2度** 作って しまいました。
--     ★① 4つ → 6つ を 足した とき（4つが 残った）
--     ★② 6つ → 9つ を 足した とき（6つが 残った）
--   ★★★`create or replace` は、★引数が ちがえば **別の 関数** に なります。
--     ★★「置き換えた」つもりが、★増えて いました。
--   ★★呼ぶ 側は 名前つきで 渡します。★どれに 当たるかが 読みにくく なります。
--   ★★★1つ だけ 残します。
drop function if exists public.create_org_event(uuid, date, text, text, time, time);

select p.proname, pg_get_function_identity_arguments(p.oid) as hikisuu
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'create_org_event';
