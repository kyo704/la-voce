-- ============================================================================
-- ★レッスンが実施されたかを、1つの列で持つ（2026-09-02）
--
--   ★出どころ
--     この裁定は会話で伝えられたもので、docs/ に文書がありませんでした。
--     探して無いことを確かめたうえで、指示に従って実装しています。
--     → docs/lavoce-判断のまとめ-20260902.md §1 に写しました。
--     ★あとから読む人が、根拠を探して迷わないように書き残します。
--
--   ★2値です。3値（実施／未実施／欠席）にしません。
--     「欠席」という値を作ると、そこが★理由の入口になります。
--       docs/lavoce-教室運営の範囲とカレンダー書き出し.md §4-3
--         「★欠席理由を聞かない」（要配慮個人情報）
--       docs/lavoce-作業指示-レッスンの希望申告と月の組み立て.md:317
--         「★先生の画面に、生徒の欠席理由を出さない（そもそも持っていない）」
--
--   ★既定値を付けません。埋め戻しもしません。
--     null は「まだ誰も答えていない」です。「実施しなかった」ではありません。
--     既定値を入れると、★「答えた」と「答えていない」が混ざります。
--
--   ★金額は1円も扱いません。数えるのは回数だけです。
--
--   ★新しいポリシーは要りません。
--     lessons の UPDATE は、既に先生だけに開いています
--     （2026-09-02 に直した Teacher can update or delete lessons /
--       Teachers can update or delete org lessons）。
--     ★生徒は SELECT だけなので、held を書けません。
--
--   ★何度実行しても同じ結果になります。行は1つも変えません。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 実行前の状態（★記録として残してください）
-- ---------------------------------------------------------------------------
select count(*) as "レッスンの総数" from public.lessons;

select column_name, data_type, is_nullable, column_default
  from information_schema.columns
 where table_schema = 'public' and table_name = 'lessons'
 order by ordinal_position;

-- ---------------------------------------------------------------------------
-- ② 列を足す（★既定値なし・NOT NULL にしない）
-- ---------------------------------------------------------------------------
alter table public.lessons
  add column if not exists held boolean;

comment on column public.lessons.held is
  '実施したか。true=実施 / false=実施しなかった / ★null=まだ答えていない。'
  '★理由は持たない（欠席理由は要配慮個人情報）。★金額の計算には使わない。';

-- ---------------------------------------------------------------------------
-- ③ 確かめる
-- ---------------------------------------------------------------------------
select column_name, data_type, is_nullable, column_default
  from information_schema.columns
 where table_schema = 'public' and table_name = 'lessons' and column_name = 'held';
-- ★is_nullable = YES、column_default が空であること。

select count(*) as "レッスンの総数",
       count(held) as "★答えのある行（0であること）"
  from public.lessons;
-- ★埋め戻していないので、既存の行はすべて null です。

-- ---------------------------------------------------------------------------
-- ④ ★書けるのは先生だけであることの確認（なりすまし・rollback します）
--
--   ★claims を先、role をあとに。
-- ---------------------------------------------------------------------------
-- begin;
-- select set_config('request.jwt.claims',
--   '{"sub":"<生徒の uuid>","role":"authenticated"}', true);
-- set local role authenticated;
-- update public.lessons set held = true
--  where id = '<その生徒のレッスンの uuid>'
-- returning id as "★生徒が書けてしまった行（0行であること）";
-- rollback;
