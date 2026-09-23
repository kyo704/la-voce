-- 20260923_70 種類の ことばを 裁定148 に 合わせる（★私の 誤りの 直し）
-- 何が起きたか（2026-09-23・Code の指摘④で 分かった）:
--   ★sql/38 で koen_kind_words を 作ったとき、私は ★自分で ことばを 考えました
--   ★裁定148 に 表が あるのに 見ていません（見本は 裁定どおりでした）
--   → Code は ★台帳に従って 実装したので、★画面の ことばが 裁定と 違う形に
--   ★正は 裁定148（＝見本）です。★台帳を 直します
-- ★38 のあと

-- ① 裁定148 の 表のとおりに 直す
update public.koen_kind_words set row_word='曲',   col_word='パート',      cast_word='担当', tbl_word='乗り番表'     where kind='orchestra';
update public.koen_kind_words set row_word='曲',   col_word='声部',        cast_word='歌う方', tbl_word='出番表'      where kind='chorus';
update public.koen_kind_words set row_word='演目', col_word='出演者・団体', cast_word='出演',  tbl_word='出番表'      where kind='gala';
update public.koen_kind_words set row_word='曲',   col_word='奏者',        cast_word='奏者',  tbl_word='曲目と 奏者'  where kind='chamber';
update public.koen_kind_words set row_word='曲',   col_word='メンバー',    cast_word='メンバー', tbl_word='セットリスト' where kind='band';
update public.koen_kind_words set row_word='ナンバー', col_word='ダンサー', cast_word='ダンサー', tbl_word='香盤表'    where kind='dance';
update public.koen_kind_words set row_word='行',   col_word='列',          cast_word='担当',  tbl_word='表'          where kind='other';
-- ★オペラ・ミュージカル・演劇 は 裁定148 では 1つのまとまり → ことばも 同じ
update public.koen_kind_words set row_word='場面', col_word='役', cast_word='配役', tbl_word='香盤表' where kind in ('opera','drama');
-- ★収録・発表会は 2026-09-23 に 足した新しい種類（裁定148 には 無い）→ そのまま

-- ② これから 入れ直すときも 同じになるように（★既定を 裁定148 に）
insert into public.koen_kind_words(kind,row_word,col_word,cast_word,tbl_word) values
  ('opera','場面','役','配役','香盤表'),
  ('drama','場面','役','配役','香盤表'),
  ('chorus','曲','声部','歌う方','出番表'),
  ('orchestra','曲','パート','担当','乗り番表'),
  ('gala','演目','出演者・団体','出演','出番表'),
  ('chamber','曲','奏者','奏者','曲目と 奏者'),
  ('band','曲','メンバー','メンバー','セットリスト'),
  ('dance','ナンバー','ダンサー','ダンサー','香盤表'),
  ('recording','巻（シーン）','役','配役','収録の 香盤表'),
  ('recital','出演順','出演者','出演','進行表'),
  ('other','行','列','担当','表')
on conflict (kind) do update set row_word=excluded.row_word, col_word=excluded.col_word,
  cast_word=excluded.cast_word, tbl_word=excluded.tbl_word;

-- 確かめ（試しの環境で）
-- select kind, tbl_word from koen_kind_words order by kind;
--   orchestra → ★乗り番表（★編成表 ではない）
--   chorus    → ★出番表（★香盤表 ではない）
--   band      → ★セットリスト／chamber → ★曲目と 奏者／gala → ★出番表
--   dance     → 香盤表（行は ★ナンバー）
-- ★見本（裁定148）と 1字ずつ 突き合わせる

-- ═══════ ★私の 誤りの 記録 ═══════
-- ★台帳に ことばを 入れるときは、★先に 裁定を 見る。
--   見本は 裁定どおりに 作られています。★台帳だけ 私が 考えて 書きました。
--   ★「台帳が正」と 思い込ませてしまい、Code に 二度手間を かけました
