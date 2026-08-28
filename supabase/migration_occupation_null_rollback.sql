-- ============================================================================
-- 職業を、選んでいない人については null に戻す
--
--   ★migration_occupation.sql の ③ は、既存の全員に既定値を入れました。
--     「自分で選んだ」と「既定で入った」の区別がつかなくなっています。
--     坂本さんの判断で、区別を残すほうへ戻します。
--
--   ★いま戻して安全な理由：職業を選ぶ画面はまだ作っていません（Day 3）。
--     つまり、いま入っている値は全員ぶん例外なく既定値です。
--     自分で選んだ人は1人もいないので、戻して失われるものがありません。
--
--   ★vocal_profession はそのまま残っています。表示に必要な職業は
--     lib/occupation.js の occupationOf() が、そこから読み替えます。
--     画面の見た目は、戻しても1文字も変わりません。
--
--   ★何度実行しても同じ結果になります。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 戻す前に数える
-- ---------------------------------------------------------------------------
select occupation as "いまの職業", count(*) as "人数"
  from public.profiles
 group by 1
 order by 2 desc;

-- ---------------------------------------------------------------------------
-- ② 既定値と一致する行だけ null に戻す
--
--   ★「既定値と一致する行だけ」に限っています。
--     万一どこかで本人が選んでいた場合に、その選択を消さないためです。
--     いまは全員が既定値なので、結果として全行が戻ります。
-- ---------------------------------------------------------------------------
update public.profiles
   set occupation = null
 where occupation is not null
   and occupation = case coalesce(vocal_profession, 'singer')
                      when 'singer'      then 'classical'
                      when 'pop_musical' then 'pops'
                      when 'announcer'   then 'announcer'
                      when 'voice_actor' then 'voiceActor'
                      when 'other'       then 'other'
                      else 'classical'
                    end;

comment on column public.profiles.occupation is
  '職業（11種）。★本人が選ぶまで null。null のときは vocal_profession から読み替える（lib/occupation.js の occupationOf）。v1では分析の説明変数に使わないこと。';

-- ---------------------------------------------------------------------------
-- ③ 結果（★null が①の合計と同じ人数になっていること）
-- ---------------------------------------------------------------------------
select coalesce(occupation, '(未選択＝既定で表示)') as "職業",
       count(*) as "人数"
  from public.profiles
 group by 1
 order by 2 desc;
