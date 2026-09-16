-- ============================================================================
-- Q2 ── 「研究への協力」の同意を、数える（★読むだけ・書きません）
--
-- ★出どころ [ACTION] Opus → Code（2026-09-15・SEV1）
--   「Q2 how many consent_records reference the 係数較正 clause?
--     count, and the date range」
--
-- ★★BEGIN / ROLLBACK は使いません（SQLエディタが効かせないため）。
-- ★★3つとも select だけです。1行も書き換えません。
--
-- ★★列の名前が違うかもしれません（consent_key / granted_at / revoked_at）。
--   違えば、そのままお知らせください。こちらを直します。
--   ★先に ④ で、実際の列名をご覧になれます。
-- ============================================================================

-- ① 件数・人数・いつからいつまで
select
  count(*)                as "件数",
  count(distinct user_id) as "人数",
  min(granted_at)::date   as "はじめ",
  max(granted_at)::date   as "おわり"
from public.consent_records
where consent_key = 'research.anonymized';


-- ② 月ごと（★人を特定できない粒度にしています。日ではなく月です）
select
  to_char(granted_at, 'YYYY-MM') as "月",
  count(*)                       as "件数"
from public.consent_records
where consent_key = 'research.anonymized'
group by 1
order by 1;


-- ③ いま「入」の方が何人か（★取り消しも見ます）
select
  count(*) filter (where revoked_at is null)     as "いま 入",
  count(*) filter (where revoked_at is not null) as "取り消し済み"
from public.consent_records
where consent_key = 'research.anonymized';


-- ④ ★①〜③ が 0行 や エラーになったときだけ ── 実際の列名を見ます
select column_name as "列", data_type as "型"
from information_schema.columns
where table_schema = 'public' and table_name = 'consent_records'
order by ordinal_position;

-- ★どんな consent_key が入っているかも見ます（★中身は出ません。名前だけ）
select consent_key as "同意の鍵", count(*) as "件数"
from public.consent_records
group by 1
order by 2 desc;
