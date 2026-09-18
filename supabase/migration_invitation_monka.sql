-- ===========================================================================
-- ★合言葉に 門下を 持たせる（★裁定 その83 訂正・2026-09-18）
--
--   ★★★もとの 裁定は `references assignments_group(id)` でした。
--     ★★その 表は この 台帳に ありません（★数えました ── 0）。
--     ★★この 蔵では、★門下は **先生の 番号** で 決まります
--       （★`assignments.teacher_id` ／ `org_messages.teacher_id`）。
--     ★★訂正の お決め（★㋐）── `monka_teacher_id uuid references auth.users(id)`。
--
--   ★★★なぜ 要る か ── ★きょう、★私が 欠けを 作りました。
--     ★★名簿の「＋ 招く」は、★`teacher_id` に **押した 方**（学長など）を 入れます。
--     ★★受け取りの 道は、★その `teacher_id` で `assignments` を 作ります。
--     ★★★つまり ── ★学長が 招いた 生徒の 先生が、★学長に なります。
--     ★★「誰が 出したか」と「どの 門下か」は、★別の こと です。★分けます。
--
--   ★★何度 走らせても 同じに なります。
--   ★★`BEGIN` も `ROLLBACK` も 使って いません（★2026-09-15 の 一件）。
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 【一】★列
--
--   ★★`null` … ★学校だけ。★門下は 未定 です。
--   ★★入って いれば … ★その 先生の 門下まで。
--   ★★★`teacher_id`（出した 方）と 混ぜません。★別の 列 です。
-- ---------------------------------------------------------------------------
alter table public.teacher_invitations
  add column if not exists monka_teacher_id uuid references auth.users(id) on delete set null;

comment on column public.teacher_invitations.monka_teacher_id is
  '門下の先生（null なら学校だけ）。teacher_id＝出した方とは別。裁定その83訂正・2026-09-18。';

create index if not exists teacher_invitations_monka_idx
  on public.teacher_invitations (monka_teacher_id);

-- ---------------------------------------------------------------------------
-- 【二】★昔の 行を、★いまの ふるまいに 合わせます
--
--   ★★★これまで、★受け取りの 道は `teacher_id` で 受け持ちを 作って いました。
--     ★★先生が 自分の 生徒を 招く 道 では、★それで 正しかった のです。
--   ★★★だから、★**まだ 使われて いない** 昔の 行だけ、
--     ★★`monka_teacher_id = teacher_id` に します。
--     ★★これを しないと、★きょうから 受け持ちが 作られなく なります。
--
--   ★★★使われた 行は 触りません。★済んだ ことを 書き換えません。
--   ★★★「埋め戻し」を 広げません（★2026-09-13 の 決まり ──
--     ★★選んだ のか 既定なのかを、★あとから 見分けられる ように）。
--     ★★ここは 例外 です ── ★昔の 行に「選んだ」も 何も ありません。
--     ★★いまの ふるまいを 保つ ため だけ の もの です。
-- ---------------------------------------------------------------------------
update public.teacher_invitations
   set monka_teacher_id = teacher_id
 where monka_teacher_id is null
   and used_at is null;

-- ---------------------------------------------------------------------------
-- 【三】★確かめ
-- ---------------------------------------------------------------------------

-- ★① 列が 付いたか
select column_name as 列, data_type as 型, is_nullable as 空可
from information_schema.columns
where table_schema = 'public' and table_name = 'teacher_invitations'
  and column_name = 'monka_teacher_id';

-- ★② いま どう なって いるか
select count(*)                                                   as ぜんぶ,
       count(*) filter (where used_at is null)                     as まだ使って いない,
       count(*) filter (where used_at is null and monka_teacher_id is null) as 学校だけ,
       count(*) filter (where used_at is null and monka_teacher_id is not null) as 門下つき
from public.teacher_invitations;
