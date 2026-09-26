-- 20260926_98 選ぶ値を ★記号に（★9言語の 下ごしらえ・その2）
-- ★sql/97 は ★止まった ときの ことば。★こちらは ★★値そのもの
-- 見つけたもの（★2026-09-26）:
--   repertoire_tessitura.status  'はじめたばかり','さらい中','本番済み','しばらく置く'
--   overlap_notices.status       'まだ','知らせた','解決'
--   postings.kind                '実技試験','コンクール','演奏会','録音'
--   postings.fee_unit            '1回の本番','1回の練習','時給','まとめて'
-- ★★これは ★エラー文より ★重い です:
--   ★★値が 日本語 ＝ ★ドイツの 方が 選んだ 値も ★日本語で 入ります
--   ★★あとから 直すと ★入っている 行を ★全部 書き換えます
-- ★★いま 11行しか ありません（★repertoire_tessitura のみ）
--   ★★いちばん 安い のは ★いま です
-- ★97 のあと

-- ① ★repertoire_tessitura.status
alter table public.repertoire_tessitura drop constraint if exists repertoire_status_check;
update public.repertoire_tessitura set status = case status
  when 'はじめたばかり' then 'just_started'
  when 'さらい中'       then 'practising'
  when '本番済み'       then 'performed'
  when 'しばらく置く'   then 'resting'
  else status end
 where status is not null;
alter table public.repertoire_tessitura add constraint repertoire_status_check
  check (status is null or status in ('just_started','practising','performed','resting'));

-- ② ★overlap_notices.status（★0行）
alter table public.overlap_notices drop constraint if exists overlap_notices_status_check;
update public.overlap_notices set status = case status
  when 'まだ' then 'open' when '知らせた' then 'notified'
  when '解決' then 'resolved' else status end;
alter table public.overlap_notices alter column status set default 'open';
alter table public.overlap_notices add constraint overlap_notices_status_check
  check (status in ('open','notified','resolved'));

-- ③ ★postings.kind・fee_unit（★0行）
alter table public.postings drop constraint if exists postings_kind_check;
update public.postings set kind = case kind
  when '実技試験' then 'exam' when 'コンクール' then 'competition'
  when '演奏会' then 'concert' when '録音' then 'recording' else kind end;
alter table public.postings add constraint postings_kind_check
  check (kind in ('exam','competition','concert','recording'));

alter table public.postings drop constraint if exists postings_fee_unit_check;
update public.postings set fee_unit = case fee_unit
  when '1回の本番' then 'per_show' when '1回の練習' then 'per_rehearsal'
  when '時給' then 'per_hour' when 'まとめて' then 'lump_sum' else fee_unit end
 where fee_unit is not null;
alter table public.postings add constraint postings_fee_unit_check
  check (fee_unit is null or fee_unit in ('per_show','per_rehearsal','per_hour','lump_sum'));

-- ★★画面が 引く ことば（★i18n_keyの決めごと §2 のとおり）
--   page.rep.just_started ＝ はじめたばかり
--   page.rep.practising   ＝ さらい中
--   page.rep.performed    ＝ 本番済み
--   page.rep.resting      ＝ しばらく置く
--   school.overlap.open / notified / resolved
--   find.kind.exam / competition / concert / recording
--   find.fee.perShow / perRehearsal / perHour / lumpSum

-- ★★これで ★台帳の 日本語は:
--   ★止まった ときの ことば ── ★記号つき（sql/97）
--   ★★選ぶ 値 ── ★記号だけ（★この SQL）
--   ★注記 ── ★日本語の まま（★これは 人が 読む もの。★残します）

-- 確かめ（試しの環境で）
-- ★日本語の check 制約 ＝ 0件
-- ★repertoire_tessitura の 11行が ★記号に 変わっている
-- ★日本語を 入れようとすると ★止まる
