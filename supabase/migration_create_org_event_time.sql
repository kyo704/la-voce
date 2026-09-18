-- ===========================================================================
-- ★行事に 時間を 入れられる ように します（★裁定 その88 のあと・Q1・2026-09-18）
--
--   ★★★列は もとから あります ── `start_time` / `end_time`（time）。
--     ★★`create_org_event` が 受け取って いない だけ でした。
--   ★★台帳には、★時間の 入った 行が **1件** あります
--     （`12561bd9…` 9月19日 14:00〜16:00「伴奏合わせ」）。★別の 道で 入った もの です。
--
--   ★★★古い 呼び方（4つ）を 残します。
--     ★★画面は 1か所から 呼んで いますが、★同じ 名で 引数の 数が ちがう ものを
--       ★★2つ 置くと、★どちらが 呼ばれるか 分かりにくく なります。
--     ★★★だから **足しません**。★同じ 名前・同じ 引数の まま、★2つ 増やします。
--       ★★既定値を 付けます。★古い 呼び方は そのまま 通ります。
--
--   ★★★門は 変えて いません（★`is_org_owner_or_admin`）。
--     ★★これは 台帳 08-1 の 本体 です。★別の 裁定を お待ちします。
--     ★★ここで 一緒に 変えると、★「時間を 足したら 出せなく なった」に なります。
--
--   ★★何度 走らせても 同じに なります。★`BEGIN`／`ROLLBACK` を 使って いません。
-- ===========================================================================

create or replace function public.create_org_event(
  p_org_id uuid,
  p_event_date date,
  p_kind text,
  p_title text,
  -- ★★既定は 空 です。★入れない ままでも 出せます（★見本の「終わりは 未定」）。
  p_start_time time default null,
  p_end_time time default null
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

  -- ★★★前後が 逆なら、★その場で 止めます（★見本の 赤い 断りと 同じ 決め）。
  --   ★★画面でも 止めますが、★台帳でも 止めます。★二重に します。
  --   ★★「終わりは 未定」は 通します（★`p_end_time` が 空）。
  if p_start_time is not null and p_end_time is not null and p_end_time <= p_start_time then
    raise exception 'EVENT_TIME_REVERSED';
  end if;

  -- ★★終わり だけ 入って いる のは、★受け取りません。
  --   ★★はじまりの 無い 終わりは、★読む 人に 意味が ありません。
  if p_start_time is null and p_end_time is not null then
    raise exception 'EVENT_END_WITHOUT_START';
  end if;

  insert into public.org_events (org_id, event_date, kind, title, start_time, end_time, created_by)
  values (p_org_id, p_event_date, p_kind, coalesce(p_title, ''),
          p_start_time, p_end_time, auth.uid())
  returning id into v_id;
  return v_id;
end;
$function$;

revoke all on function public.create_org_event(uuid, date, text, text, time, time) from public, anon;
grant execute on function public.create_org_event(uuid, date, text, text, time, time) to authenticated;

-- ---------------------------------------------------------------------------
-- ★確かめ
-- ---------------------------------------------------------------------------

-- ★① 引数が 6つに なったか。★古い 4つの ものが 残って いないか
select p.proname, pg_get_function_identity_arguments(p.oid) as hikisuu
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'create_org_event'
order by 2;

-- ★② いまの 行事（★時間の 入り ぐあい）
select count(*) as gyoji,
       count(*) filter (where start_time is not null) as jikan_ari,
       count(*) filter (where withdrawn_at is not null) as torisage
from public.org_events;
