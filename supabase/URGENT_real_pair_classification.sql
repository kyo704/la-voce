-- ============================================================================
-- ★16組を、はっきり分ける（2026-09-03・読むだけ）
--
--   ★弁護士の文書にいちばん効くのは、次の1文です。
--     「第三者どうしの組が0件だった」
--   ★それを言うには、0であることを★機械が数える必要があります。
--     目で読んだ結果を、そのまま文書に載せません。
--
--   ★運営者ご自身の口座について
--     kyo0703opera が運営者ご本人のものである、というのは
--     ★データから導けることではありません。ご本人の申告です。
--     だから、この照会では★別の欄として分けて出します。
--     「実在どうし」に黙って混ぜることも、黙って外すこともしません。
--     ★どちらにするかは、事実を見てから決めていただきます。
--
--   ★姓の一致では人を同定しません（2026-09-02 に撤回した方法です）。
--     ここで使うのは、メールアドレスの完全一致だけです。
--
--   ★何も書き換えません。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ★運営者ご本人の口座（★ここだけ、ご本人の申告に基づきます）
--   ★ほかのアドレスを足すときは、1件ずつ確かめてから足してください。
-- ---------------------------------------------------------------------------
create temporary view 運営者の口座 as
  select unnest(array[
    'kyo0703opera@gmail.com'
  ]) as email;

-- ---------------------------------------------------------------------------
-- ① 16組を、1件ずつ分類する（★これが本体です）
-- ---------------------------------------------------------------------------
with 組 as (
  select '先生と生徒のつながり' as 種類, l.teacher_id as a, l.student_id as b,
         l.status as 状態, l.invited_at as 始まり, l.revoked_at as 終わり
    from public.teacher_student_links l
  union all
  select '教室の担当', x.teacher_id, x.student_id,
         case when x.ended_at is null then 'active' else 'ended' end,
         x.started_at, x.ended_at
    from public.assignments x
),
印 as (
  select c.*,
         au.email as a_email, bu.email as b_email,
         ap.is_internal as a_内部, bp.is_internal as b_内部,
         (au.email in (select email from 運営者の口座)) as a_運営者,
         (bu.email in (select email from 運営者の口座)) as b_運営者,
         (ap.id is null or bp.id is null) as 判定できない
    from 組 c
    left join auth.users au on au.id = c.a
    left join auth.users bu on bu.id = c.b
    left join public.profiles ap on ap.id = c.a
    left join public.profiles bp on bp.id = c.b
)
select
  種類, 状態, a_email as "先生側", b_email as "生徒側",
  始まり, 終わり,
  case
    when 判定できない then '★判定できない（profiles の行が無い）'
    when a_運営者 or b_運営者 then '★運営者ご本人が片側（別枠）'
    when coalesce(a_内部,false) and coalesce(b_内部,false) then '内部どうし'
    when coalesce(a_内部,false) <> coalesce(b_内部,false) then '片方だけ内部'
    else '★第三者どうし（これが0であることが要点）'
  end as "★分類"
  from 印
 order by 始まり asc nulls last;

-- ---------------------------------------------------------------------------
-- ② ★数（1と2に、そのまま答えます）
--
--   ★「判定できない」を0にしません。あれば、あるまま出します。
--     判定できないものがあることを隠さないのが、この記録の値打ちです。
-- ---------------------------------------------------------------------------
with 組 as (
  select l.teacher_id as a, l.student_id as b from public.teacher_student_links l
  union all
  select x.teacher_id, x.student_id from public.assignments x
),
印 as (
  select c.*,
         ap.is_internal as a_内部, bp.is_internal as b_内部,
         (au.email in (select email from 運営者の口座)) as a_運営者,
         (bu.email in (select email from 運営者の口座)) as b_運営者,
         (ap.id is null or bp.id is null) as 判定できない
    from 組 c
    left join auth.users au on au.id = c.a
    left join auth.users bu on bu.id = c.b
    left join public.profiles ap on ap.id = c.a
    left join public.profiles bp on bp.id = c.b
)
select
  count(*) as "組の総数",
  count(*) filter (where 判定できない) as "★判定できない",
  count(*) filter (where not 判定できない
                     and (a_運営者 or b_運営者)) as "★運営者ご本人が片側",
  count(*) filter (where not 判定できない and not (a_運営者 or b_運営者)
                     and coalesce(a_内部,false) and coalesce(b_内部,false)) as "内部どうし",
  count(*) filter (where not 判定できない and not (a_運営者 or b_運営者)
                     and coalesce(a_内部,false) <> coalesce(b_内部,false)) as "片方だけ内部",
  count(*) filter (where not 判定できない and not (a_運営者 or b_運営者)
                     and not coalesce(a_内部,false) and not coalesce(b_内部,false))
    as "★第三者どうし（0であることが要点）"
  from 印;

-- ---------------------------------------------------------------------------
-- ③ ★運営者ご本人の組を、中身まで出す（別枠の内訳）
--
--   ★「運営者ご本人 × ご自身の試験用の器」なのか、
--     「運営者ご本人 × 別の実在の方」なのかで、意味がまるで違います。
--   ★前者なら、ご自身のデータをご自身が見られただけです。
-- ---------------------------------------------------------------------------
with 組 as (
  select l.teacher_id as a, l.student_id as b, l.invited_at as 始まり from public.teacher_student_links l
  union all
  select x.teacher_id, x.student_id, x.started_at from public.assignments x
)
select au.email as "先生側", coalesce(ap.is_internal,false) as "先生側は内部か",
       bu.email as "生徒側", coalesce(bp.is_internal,false) as "生徒側は内部か",
       c.始まり
  from 組 c
  left join auth.users au on au.id = c.a
  left join auth.users bu on bu.id = c.b
  left join public.profiles ap on ap.id = c.a
  left join public.profiles bp on bp.id = c.b
 where au.email in (select email from 運営者の口座)
    or bu.email in (select email from 運営者の口座)
 order by c.始まり;

-- ---------------------------------------------------------------------------
-- ④ ★いつできたか（露出の窓）
--
--   ★9/1 12:05 の控えでは、どちらの表も0行でした（実物で確認済み）。
--     ★16組すべてが、それより後にできているはずです。
--     もし 9/1 12:05 より前の日付が出たら、★控えのほうが不完全です。
-- ---------------------------------------------------------------------------
with 組 as (
  select l.invited_at as 始まり from public.teacher_student_links l
  union all
  select x.started_at from public.assignments x
)
select min(始まり) as "★いちばん古い組", max(始まり) as "いちばん新しい組",
       count(*) filter (where 始まり < timestamptz '2026-09-01 12:05:26+09')
         as "★9/1 12:05 より前にできた組（0であるはず）"
  from 組;
