-- ============================================================================
-- 修正 No.004 ★学年の 札は、★学校が 決める
--
--   ★お決め（★Opus・2026-09-11）
--     ★★学年の 札（grade_label）は、★学校が 決める ものです。
--       ★ご本人が 名乗る ものでは ありません。
--     ★★書けるのは `has_can(org_id, 'meibo')` を 持つ 方だけ。
--     ★★ご本人は 自分の 札を **読めます**。★書けません。
--     ★★アプリの 中に「直して ください」と 頼む 道は 作りません。
--       ★名簿を 預かる 方に、★アプリの 外で お願いします。
--
--   ★なぜ
--     ★★学年は 組織の 層の ものです。★からだの 層では ありません。
--       ★名簿・出席の 見守り・学年ごとの 割り振りが、★この 値に 寄りかかります。
--       ★★自分で 動かせると、★ほかの 方の 画面が ずれます。
--     ★★`role` には すでに 階の 歯止め（role_rank）が あります。
--       ★★同じ 形の 穴を、★`grade_label` でも 塞ぎます。
--
--   ★なぜ 決まり（RLS）では なく 引き金（trigger）か
--     ★★`memberships` の 決まりの 中から `memberships` を 引くと、
--       ★★42P17（★終わらない 繰り返し）に なります。★9月に 踏みました。
--     ★★`for all` の 決まりは、★書く ときにも その 条件が かかります。
--       ★★1本 足すと、★ほかの 列の 書きまで 巻き添えに します。
--     ★★引き金なら、★**その 列が 変わった ときだけ** 見られます。
--       ★ほかの 列の 書きに、★1ミリも 触りません。
--
--   ★★裏口（service role）は 素通しに します。
--     ★★`auth.uid()` が 空の ときは 見ません。
--     ★★裏口を 通る 道は、★その 経路の コードが 守ります（★この家の 形）。
--
--   ★★1つずつ 流して ください。
-- ============================================================================


-- ────────────────────────────────────────────────────────────────
-- ① ★いま どうなって いるか（★読むだけ）
-- ────────────────────────────────────────────────────────────────
select tgname as "引き金の 名前", tgenabled as "生きて いるか"
from pg_trigger
where tgrelid = 'public.memberships'::regclass and not tgisinternal;

-- ★★期待（★直す 前）── ★この 名前の 引き金は まだ 無い。


-- ────────────────────────────────────────────────────────────────
-- ② ★has_can が 居る ことを 確かめる（★読むだけ）
--    ★★無ければ ここで 止めて ください。★③は 流せません。
-- ────────────────────────────────────────────────────────────────
select p.proname as "関数", pg_get_function_identity_arguments(p.oid) as "受け取る もの"
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'has_can';

-- ★★期待 ── 1行。★(uuid, text) の ような 形。


-- ────────────────────────────────────────────────────────────────
-- ③ ★見張りの 中身を 作る
--    ★★`security definer` に しません。★呼んだ 方の まま 見ます。
--      ★★中で 呼ぶ has_can の ほうが definer です。
-- ────────────────────────────────────────────────────────────────
create or replace function public.guard_grade_label()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  -- ★★裏口（service role）や、★入って おられない ときは 見ません。
  --   ★★裏口は、★その 経路の コードが 守ります。
  if auth.uid() is null then
    return new;
  end if;

  -- ★★入れる とき ── ★札を 入れて いる ときだけ 見ます。
  if tg_op = 'INSERT' then
    if new.grade_label is null then
      return new;
    end if;
    if not public.has_can(new.org_id, 'meibo') then
      raise exception '学年の札は、名簿をお預かりの方が決めます。'
        using errcode = '42501';
    end if;
    return new;
  end if;

  -- ★★直す とき ── ★**札が 変わった ときだけ** 見ます。
  --   ★★同じ 値の 書き戻しは 通します。★変わって いないので。
  --   ★★ほかの 列の 書きには 1ミリも 触りません。
  if new.grade_label is distinct from old.grade_label then
    if not public.has_can(new.org_id, 'meibo') then
      raise exception '学年の札は、名簿をお預かりの方が決めます。'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;


-- ────────────────────────────────────────────────────────────────
-- ④ ★引き金を 立てる
-- ────────────────────────────────────────────────────────────────
drop trigger if exists guard_grade_label on public.memberships;

create trigger guard_grade_label
  before insert or update of grade_label on public.memberships
  for each row
  execute function public.guard_grade_label();


-- ────────────────────────────────────────────────────────────────
-- ⑤ ★確かめ（★読むだけ）
-- ────────────────────────────────────────────────────────────────
select tgname as "引き金の 名前", tgenabled as "生きて いるか"
from pg_trigger
where tgrelid = 'public.memberships'::regclass and not tgisinternal;

-- ★★期待（★直した あと）── `guard_grade_label` が 1行。★生きて いるか は O。


-- ────────────────────────────────────────────────────────────────
-- ⑥ ★誰も 締め出されて いない ことを 数える（★読むだけ）
--    ★★いま 札が 入って いる 方が 何人 いて、
--      ★その 学校に 名簿を 預かる 方が いるか。
--    ★★預かる 方の いない 学校に 札が あると、★もう 直せません。
-- ────────────────────────────────────────────────────────────────
select o.name as "学校",
       count(*) filter (where m.grade_label is not null) as "札の ある 方",
       count(*) filter (
         where m.post_id is not null
           and (select (q.perms ->> 'meibo')::boolean
                  from public.org_posts q where q.id = m.post_id) is true
       ) as "名簿を 預かる 方"
from public.organizations o
join public.memberships m on m.org_id = o.id
group by o.name
having count(*) filter (where m.grade_label is not null) > 0
order by o.name;

-- ★★「札の ある 方」が 居て「名簿を 預かる 方」が 0 の 学校が あれば、
--   ★★その 学校は 札を 直せなく なります。★お知らせ ください。


-- ────────────────────────────────────────────────────────────────
-- ⑦ ★戻し方（★もし 何か あった とき）
-- ────────────────────────────────────────────────────────────────
-- drop trigger if exists guard_grade_label on public.memberships;
-- drop function if exists public.guard_grade_label();
