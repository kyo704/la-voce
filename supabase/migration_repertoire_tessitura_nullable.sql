-- ============================================================================
-- repertoire_tessitura.tessitura_note の NOT NULL を外す
--
--   ★これがいま利用者を止めている原因です（2026-08-29 に判明）。
--     新しい曲で、先に歌唱言語のチップを押すと、こう出ていました。
--
--       code 23502
--       null value in column "tessitura_note" of relation
--       "repertoire_tessitura" violates not-null constraint
--
--     書き込みが 400 で弾かれ、画面には何も出ないため、
--     利用者からは「チップが反応しない」に見えていました。
--
--   ★なぜ外すのが正しいか
--     ・画面には「テッシトゥーラも入力する（任意）」と書いてあります。
--     ・handleSaveRepertoire は前から tessitura_note に null を書きます。
--     ・実データでも top_note / singing_language / d_override は null が入って
--       おり、tessitura_note だけが NOT NULL のまま残っていました。
--       この表が「テッシトゥーラだけを覚える表」だった頃の名残です。
--
--   ★仮の値を入れて通す、はしません。
--     テッシトゥーラは負荷（songFactor）の計算に使う数値です。
--     入っていない事実を、入っているように見せてはいけません。
--
--   ★何度実行しても同じ結果になります。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 実行の前に、いまの状態を見る（★記録として残してください）
-- ---------------------------------------------------------------------------
select column_name as "列", data_type as "型", is_nullable as "null可"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'repertoire_tessitura'
 order by ordinal_position;

-- ---------------------------------------------------------------------------
-- ② NOT NULL を外す
-- ---------------------------------------------------------------------------
alter table public.repertoire_tessitura
  alter column tessitura_note drop not null;

-- ★兄弟の列も、任意であるべきものは同じにしておきます。
--   すでに外れていれば、この文は何も変えません。
alter table public.repertoire_tessitura
  alter column top_note drop not null;
alter table public.repertoire_tessitura
  alter column singing_language drop not null;
alter table public.repertoire_tessitura
  alter column d_override drop not null;

comment on column public.repertoire_tessitura.tessitura_note is
  'テッシトゥーラ。★任意。画面にも「（任意）」と書いてある。NOT NULL に戻さないこと。歌唱言語だけを先に登録できなくなる。';

-- ---------------------------------------------------------------------------
-- ③ 確かめる（★4列とも「YES」になっていること）
-- ---------------------------------------------------------------------------
select column_name as "列", is_nullable as "null可（YESであること）"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'repertoire_tessitura'
   and column_name in ('tessitura_note', 'top_note', 'singing_language', 'd_override')
 order by column_name;

-- ★ほかに NOT NULL が残っていないか（user_id と repertoire_name だけのはず）
select column_name as "まだ必須の列"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'repertoire_tessitura'
   and is_nullable = 'NO'
 order by ordinal_position;
