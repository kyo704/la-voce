-- ============================================================================
-- ★行事を 出す 門を、★できこと に 揃えます（★台帳 08-1・裁定 その86 の 続き）
--
--   ★★★いま ── ★画面は `gyoji`、★台帳は `is_org_owner_or_admin`（★役割の 名）。
--     ★★学校が `gyoji` を「教授」の 役職に 付けると ──
--       ★★画面には 帯も 札も 出ます。★押すと `null` が 返ります。
--       ★★★押せる ように 見えて、★押せません（★§8⑤ が 嫌う 形）。
--
--   ★★★台帳側を できこと に 揃えます（★その86 と 同じ 向き）。
--   ★★★数えました（★2026-09-20）──
--     ★`gyoji` を 持つ 役職の 方は 12人。★全員 いま `owner` か `admin` です。
--     ★通らなく なる 方は いません。
--
--   ★★中身は 台帳から 引き写しました。★門の 1行 だけ を 替えて います。
--   ★何度 流しても 同じに なります。
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_org_event(p_org_id uuid, p_event_date date, p_kind text, p_title text, p_start_time time without time zone DEFAULT NULL::time without time zone, p_end_time time without time zone DEFAULT NULL::time without time zone, p_place text DEFAULT NULL::text, p_target_grades text[] DEFAULT '{}'::text[], p_target_courses text[] DEFAULT '{}'::text[])
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  -- ★★★門は できこと です（★2026-09-20・台帳 08-1）。
  --   ★★もと … `public.is_org_owner_or_admin(auth.uid(), p_org_id)`
  --   ★★画面の 門は `gyoji` でした。★台帳は 役割の 名 でした。
  --   ★★★学校が `gyoji` を 役職に 付けても、★台帳が 止めて いました。
  if not public.has_can(p_org_id, 'gyoji') then
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
$function$
;
