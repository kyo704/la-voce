-- ============================================================================
-- role_master.voice_quality の 名前を 直す
--
--   ★出どころ 2026-09-14、★裁定 その49 CHANGE_2（★Opus）
--
--   ★★何が 起きて いたか。
--     ★★`voice_quality` という 名前が、★**2つの 表**に あります。
--       ★`entries.voice_quality`　 … 声の 出来（★5段に 丸めた 数）
--       ★`role_master.voice_quality` … ★その 役に 求められる 声の 質（★自由な 字）
--     ★★同じ 名前で、★別の ものです。★数と 字です。
--     ★★読む 人が 取り違えます。★分析の 項目一覧に 並べたら なおさらです。
--
--   ★★新しい 名前　`required_voice_character`
--     ★「その 役が 求める 声の 性格」。★数では ない ことが 名前で 分かります。
--
--   ★★★名前を 付け替えません（rename を しません）。
--     ★★`alter ... rename` は 一瞬で 終わりますが、
--       ★その 一瞬、★古い 名前で 書く 画面が まだ 動いて います。
--     ★★だから「足す → 写す → あとで 落とす」に します。
--       ★★見えない ものを 先に 作る、という 決めの とおりです。
--
--   ★★この 紙は 何度 流しても 安全です。
--
--   ★★★2026-09-14、★この 紙は 流されませんでした。
--     ★★坂本さんが `alter ... rename column` で 付け替えました。
--       ★本番・試し用 とも、★`voice_quality` は もう ありません。
--     ★★★この 紙は 流さないで ください。
--       ★流すと、★落としたはずの 古い 列が 生き返ります。
--     ★★残して あるのは、★どう 直したかの 記録の ためです。
-- ============================================================================

-- ★★① いまの 形を 見ます。★流す 前と 後で くらべて ください。
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'role_master'
order by ordinal_position;

-- ★★② 新しい 列を 足します。★中身は まだ 空です。
alter table public.role_master
  add column if not exists required_voice_character text;

comment on column public.role_master.required_voice_character is
  '★その役に求められる声の性格（自由な字）。'
  '★2026-09-14、voice_quality から 名前を 移しました。'
  '★entries.voice_quality（声の出来・5段の数）とは 別ものです。';

-- ★★③ 中身を 写します。★空の ものだけ 写します。
--   ★★何度 流しても、★新しい ほうに すでに 字が あれば 触りません。
update public.role_master
set required_voice_character = voice_quality
where required_voice_character is null
  and voice_quality is not null;

-- ★★④ 写せたかを 数えます。
select
  count(*) as 行,
  count(voice_quality) as 古い列に字あり,
  count(required_voice_character) as 新しい列に字あり,
  count(*) filter (
    where voice_quality is distinct from required_voice_character
  ) as 食いちがい
from public.role_master;

-- ★★⑤ 古い 列は、★**まだ 落としません**。
--   ★★画面が 両方に 書く ように なって います。
--   ★★しばらく 動かして、★食いちがいが 0 の ままなら、
--     ★別の 紙で 落とします。
--
-- alter table public.role_master drop column voice_quality;   -- ★まだ 流さない
