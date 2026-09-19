-- ============================================================================
-- ★代表の 印（★見本 `P_daihyo`・2026-09-19）
--
--   ★★★見本の 字 ──
--     「この 代表だけは、★役職の 仕組みの 外です。
--      ★その 門下の 先生だけが 決めます。」
--
--   ★★★いま、★画面からは 付けられません（★2026-09-19 に 台帳で 数えました）──
--     ★`authenticated` が `assignments` に 持つ 更新の 権限は `ended_at` **1列 だけ**。
--     ★`is_representative` は 更新できません。★押しても 通りません。
--
--   ★★★列の 権限を 足す 道を 選びません。★読み道（`security definer`）に します。
--     ★★わけは 2つ ──
--       ①「2人まで」を 画面だけで 守ると、★通信を 直に 叩く 人に 守れません。
--       ②`assignments` の 更新を 広げると、★`teacher_id` や `student_id` まで
--         ★書ける 道が できます。★担当そのものを 付け替えられます。
--     ★★★1本の 道で、★1つの 列だけ を 変えます。
--
--   ★★★門 ── ★その 門下の 先生 ご本人 だけ です。
--     ★★役職（`has_can`）では 通しません。★見本の 字の とおり です。
--     ★★学校の 持ち主でも、★よその 先生の 門下には 付けられません。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ★① 何人まで か ── ★1か所に 書きます
-- ---------------------------------------------------------------------------
--   ★★見本の 字 ──「1〜2名まで」。
--   ★★画面にも 同じ 数が あります（`lib/opsDaihyo.js` の `MAX`）。
--     ★★★こちらが 正 です。★画面は 早く 断る ため の もの です。
create or replace function public.monka_representative_max()
returns integer language sql immutable as $$ select 2 $$;

-- ---------------------------------------------------------------------------
-- ★② 付ける・外す
-- ---------------------------------------------------------------------------
--   ★★返すのは、★その門下の いまの 代表の 並び です。
--     ★★画面は それで 描き直します。★もう一度 引きません。
create or replace function public.set_monka_representative(
  p_assignment_id uuid,
  p_on boolean
) returns table (assignment_id uuid, student_id uuid, is_representative boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher uuid;
  v_org uuid;
  v_now integer;
begin
  -- ★★その 行が、★ご自分の 門下か。★ちがえば 何も しません。
  select a.teacher_id, a.org_id into v_teacher, v_org
  from public.assignments a
  where a.id = p_assignment_id and a.ended_at is null;

  if v_teacher is null then
    raise exception 'その 担当が ありません';
  end if;
  if v_teacher <> auth.uid() then
    raise exception 'その 門下の 先生だけが 決められます';
  end if;

  -- ★★2人までを、★ここで 守ります。★画面だけに 任せません。
  if p_on then
    select count(*) into v_now
    from public.assignments a
    where a.teacher_id = v_teacher and a.org_id = v_org
      and a.ended_at is null and a.is_representative
      and a.id <> p_assignment_id;
    if v_now >= public.monka_representative_max() then
      raise exception '代表は %人までです', public.monka_representative_max();
    end if;
  end if;

  update public.assignments a
  set is_representative = p_on
  where a.id = p_assignment_id;

  return query
  select a.id, a.student_id, a.is_representative
  from public.assignments a
  where a.teacher_id = v_teacher and a.org_id = v_org and a.ended_at is null
  order by a.student_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- ★③ 誰が 呼べるか
-- ---------------------------------------------------------------------------
--   ★★★取り上げてから 渡します（★広い 許しが 残らない ように）。
revoke all on function public.set_monka_representative(uuid, boolean) from public;
revoke all on function public.set_monka_representative(uuid, boolean) from anon;
revoke all on function public.monka_representative_max() from public;
revoke all on function public.monka_representative_max() from anon;
grant execute on function public.set_monka_representative(uuid, boolean) to authenticated;
grant execute on function public.monka_representative_max() to authenticated;

-- ---------------------------------------------------------------------------
-- ★④ 確かめ（★流した あとに、★別に 流して ください）
-- ---------------------------------------------------------------------------
--   ★★書く 問いを 混ぜて いません（★`begin` / `rollback` も 使いません）。
--
--   select p.proname, p.prosecdef,
--          pg_get_function_identity_arguments(p.oid)
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public'
--     and p.proname in ('set_monka_representative','monka_representative_max');
--
--   ★★★`prosecdef` が true（読み道）で、★1本ずつ で ある こと。
--     ★★2本 出たら 重なり です。★引数の ちがう 古い ものが 残って います。
