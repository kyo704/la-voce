-- ============================================================================
-- ★ログの範囲と、16組・14件の招待を突き合わせる（2026-09-03・読むだけ）
--
--   ★使い方
--     Logs Explorer で edge_logs を★絞り込み無しで開き、
--     いちばん古い行まで送って、その timestamp をそのまま控えてください。
--     ★「24時間前」と計算しないこと。実際に残っている量は、
--       設定の保持期間と一致しないことがあります。
--
--   ★下の 'T' を、その時刻に置き換えてください（3か所）。
--     例：timestamptz '2026-09-02 11:20:00+00'
--     ★時刻帯を必ず付けてください。付けないと、この画面の設定（UTC）で
--       読まれます。今日、それで9時間ずれかけました。
--
--   ★何も書き換えません。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 16組を、1件ずつログの範囲と比べる
-- ---------------------------------------------------------------------------
with 組 as (
  select 'つながり' as 種類, l.id::text as id, l.invited_at as 始まり,
         l.status as 状態
    from public.teacher_student_links l
  union all
  select '教室の担当', a.id::text, a.started_at,
         case when a.ended_at is null then 'active' else 'ended' end
    from public.assignments a
)
select 種類, id, 状態,
       始まり as "できた時刻（UTC）",
       始まり at time zone 'Asia/Tokyo' as "同・JST",
       case
         when 始まり is null then '★時刻が空（比べられません）'
         when 始まり >= timestamptz 'T' then 'ログの範囲内'
         else '★ログより前（確かめられない期間）'
       end as "★判定",
       case when 始まり is not null and 始まり < timestamptz 'T'
            then round(extract(epoch from (timestamptz 'T' - 始まり))/3600, 1)
       end as "ログより何時間前か"
  from 組
 order by 始まり asc nulls first;

-- ---------------------------------------------------------------------------
-- ② まとめ（★「時刻が空」を0にしません）
-- ---------------------------------------------------------------------------
with 組 as (
  select l.invited_at as 始まり from public.teacher_student_links l
  union all
  select a.started_at from public.assignments a
)
select
  count(*) as "組の総数",
  count(*) filter (where 始まり is null) as "★時刻が空（別に見る必要あり）",
  count(*) filter (where 始まり >= timestamptz 'T') as "★ログの範囲内",
  count(*) filter (where 始まり <  timestamptz 'T') as "★ログより前（確かめられない）",
  min(始まり) as "いちばん古い組（UTC）",
  min(始まり) at time zone 'Asia/Tokyo' as "同・JST"
  from 組;
-- ★「ログの範囲内」が総数と一致すれば、
--   ★16組すべてについて、確かめられない期間はゼロになります。

-- ---------------------------------------------------------------------------
-- ③ 招待14件も、同じ物差しで
--
--   ★発行時刻は expires_at − 7日で逆算します。
--     式は VocalTracker.jsx:9469 で固定されており、
--     ★2026-08-26 19:52 以降、一度も変わっていません（git で確認）。
--   ★ただし、その時刻は★発行した人の端末の時計に基づきます。
-- ---------------------------------------------------------------------------
select i.code,
       (i.expires_at - interval '7 days') as "★発行（逆算・UTC）",
       (i.expires_at - interval '7 days') at time zone 'Asia/Tokyo' as "同・JST",
       i.expires_at as "期限", i.used_at as "使われた日時",
       tu.email as "発行した人", coalesce(tp.is_internal,false) as "発行者は内部か",
       su.email as "使った人",
       case
         when (i.expires_at - interval '7 days') >= timestamptz 'T'
           then 'ログの範囲内' else '★ログより前'
       end as "★判定"
  from public.teacher_invitations i
  left join auth.users tu on tu.id = i.teacher_id
  left join public.profiles tp on tp.id = i.teacher_id
  left join auth.users su on su.id = i.used_by_student_id
 order by 2;

-- ---------------------------------------------------------------------------
-- ④ ★5組のつながりが、画面の経路を通ったのか（used_at が空である理由）
--
--   画面の経路は 9556（つながり）→ 9589（同意）→ 9592（used_at）の順です。
--   ★同意の記録があれば、9589 までは通っています。
--   ★link_consents は 2026-09-01 17:01 にできた表なので、
--     それより前のつながりには、そもそも記録がありません。
-- ---------------------------------------------------------------------------
select l.id, l.teacher_id, l.student_id, l.status,
       l.invited_at as "つながった時刻（UTC）",
       (c.student_id is not null) as "★同意の記録があるか"
  from public.teacher_student_links l
  left join public.link_consents c
    on c.teacher_id = l.teacher_id and c.student_id = l.student_id
 order by l.invited_at nulls first;
