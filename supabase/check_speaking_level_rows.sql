-- ============================================================================
-- speaking_level に、過去の記録が実際に入っているかを数える
--
--   ★消す前に確かめるためのものです。行は変更しません。
--
--   この項目は「入力がどこにも無い」ので、いまの画面からは書けません。
--   ただし git を見ると、コミット 1b38007 の時点では3択の入力が
--   画面に出ていて（本番外の発話の量）、febd5f9 で外されていました。
--   つまり、その間に記録した人の行には値が残っている可能性があります。
--
--   lib/vocalDose.js は、分単位の実測が無い日にこの値から発声量を
--   概算しています（「推定」として区別済み）。消すと、その日の
--   発声量が 0 に変わります。記録された事実が消えることになります。
--
--   ★0件なら消して構いません。1件でもあれば、消すのは
--     「利用者の記録を捨てる」ことになります。
-- ============================================================================

select count(*)                                              as "entries の全行",
       count(speaking_level)                                 as "★値が入っている行",
       count(*) filter (where speaking_level > 0)            as "0より大きい行",
       min(date)                                             as "最初の日",
       max(date) filter (where speaking_level is not null)   as "値がある最後の日",
       count(distinct user_id) filter (where speaking_level is not null) as "該当する人数"
  from public.entries;

-- 値がある日に、分単位の実測（non_performance_speech_minutes）もあるか。
-- 両方あるなら、speaking_level を消しても発声量は変わりません。
select count(*) as "speaking_levelがある行のうち、分の実測も入っている行"
  from public.entries
 where speaking_level is not null
   and non_performance_speech_minutes is not null;
