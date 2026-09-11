-- ============================================================================
-- 見本を 撮る ための アカウントの 記録を、「その日 書いた」印に する
--
--   ★なぜ 要るか
--     ★★くらべる（B01）の 判定は、★「その日〜翌日23:59 に 書いた日」だけを
--       ★使います（★lib/entrySource.js ／ ★裁定 §7）。
--     ★★見本を 撮る ための 30日ぶんは、★今日 まとめて 書いています。
--       ★だから 引き金が すべて 'later'（★○）を 付けます。★正しい 動きです。
--     ★★その ままだと、★点が ぜんぶ ○ に なり、★まんなかの 破線も 出ず、
--       ★見本（★●が ほとんど）と くらべられません。
--
--   ★★これは、★見本を 撮る ためだけの ものです。
--     ★本物の 記録では ありません。★分析の 結論を 作る ものでも ありません。
--     ★★アプリの 書き込みの 道は 変えて いません。★引き金も 変えて いません。
--       ★変えると、★本物の 記録にも 効いて しまいます。
--
--   ★★触るのは、★使い捨ての アカウント 1件の 行だけです。
--     ★★下の user_id を、★必ず 確かめてから 実行してください。
--     ★★ほかの どなたの 行にも 触れません。
--
--   ★実行　Supabase の SQL Editor に、★このまま 貼って ください。
--   ★★BEGIN／ROLLBACK を 使って いません。
--     ★SQL Editor が ROLLBACK を 効かせない ことが あるためです。
-- ============================================================================

-- ── ① 誰の 行を 触るか、★先に 目で 確かめる
--    ★★2行目の 結果が「kyo0703opera+forcode@gmail.com」で ある ことを
--      ★確かめてから、★②へ 進んで ください。
select
  u.id                                   as "user_id",
  u.email                                as "この方の メール",
  count(e.*)                             as "記録の 行数",
  count(*) filter (where e.source = 'live')   as "live（その日 書いた）",
  count(*) filter (where e.source = 'later')  as "later（あとから 書いた）",
  count(*) filter (where e.source = 'import') as "import（取り込み）",
  count(*) filter (where e.source is null)    as "印が 無い"
from auth.users u
left join public.entries e on e.user_id = u.id
where u.id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2'
group by u.id, u.email;


-- ── ② 印を live に する
--    ★★①の メールが ちがって いたら、★ここで 止めて ください。
--    ★★where の user_id は、★1件だけです。★書き換えないで ください。
update public.entries
   set source = 'live'
 where user_id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2'
   and source is distinct from 'live';


-- ── ③ そのあとの 数
select
  count(*)                                    as "記録の 行数",
  count(*) filter (where source = 'live')     as "live（その日 書いた）",
  count(*) filter (where source = 'later')    as "later（あとから 書いた）",
  min(date)                                   as "いちばん 古い日",
  max(date)                                   as "いちばん 新しい日"
from public.entries
where user_id = 'f7520dc1-9154-4524-a350-ba0bcddbf0b2';


-- ── ④ ほかの方に 触れて いないことの 確かめ
--    ★★「later の ある方」が ①より 減って いない ことを 見ます。
select
  count(distinct user_id) as "later を 持つ方の 人数",
  count(*)                as "later の 行数"
from public.entries
where source = 'later';
