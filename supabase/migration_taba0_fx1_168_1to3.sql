-- ★束0 ── 退会で 記録が 消える／退会が 止まる（裁定161 FX1 ＋ 裁定168 ★1〜3）
--
--   ★★★3つの 話が 1つの 移行に 入って います。★同じ 表の 外部キーを 触る から です。
--
--   ★168 ★1 …… 退会が **止まる**（NO ACTION）。★規約9条「いつでも 退会できます」が 守れません。
--   ★168 ★2 …… 審査員が 退会すると、★学生の 点と 講評が **消える**（CASCADE）。
--   ★168 ★3 …… 先生が 退会すると、★門下の 連絡が **全部 消える**（CASCADE）。
--   ★161 FX1 … 記録の 表（*_log）が、★退会で 消える（CASCADE）。
--
--   ★★★人が 消えても、★**記録は 残します**。
--     ★★名前が 要る ところは、★そのときの 名前を **写して** 残します。
--     ★★写さないと、★あとで 誰の ことか 分からなく なります。
--
--   ★★★`organizations.contract_owner_user_id` は **そのまま**（NO ACTION）です。
--     ★★契約者が 黙って 消えると、★お金の 行き先が 無く なります。
--     ★★画面で「先に 契約者を 移して ください」と お伝えします（★裁定168 ★1）。
--
--   ★★何度 流しても 同じに なります。

begin;

-- ===========================================================================
-- 一 ── そのときの 名前を 写す 列（★先に 作ります）
-- ===========================================================================
--   ★★`*_name_at` …… ★その とき の 名前。★あとから 変わりません。
--     ★★人が 消えた あとも、★誰の ことかが 分かります。
--     ★★人が 残って いる あいだは、★`profiles.display_name` の ほうが 新しい です。
--       ★★画面は「人が 居れば そちら、★居なければ 写し」の 順に 見ます。

alter table public.evaluation_scores  add column if not exists judge_name_at   text;
alter table public.evaluation_reviews add column if not exists judge_name_at   text;
alter table public.org_messages       add column if not exists author_name_at  text;
-- ★★`teacher_name_at` は 裁定168 ★3 に 書かれて いません。★足しました。
--   ★わけ …… `teacher_id` も SET NULL に します。★どの 門下の 連絡かが 分からなく なります。
--   ★★`author_name_at` だけ だと、★「誰が 書いたか」は 残り「どこの 話か」が 消えます。
alter table public.org_messages       add column if not exists teacher_name_at text;
-- ★★`monka_read_log` には `name_at`（見た 人）が すでに あります。
--   ★見られた 側の 名前が ありません。★足します。
alter table public.monka_read_log     add column if not exists target_name_at  text;

comment on column public.evaluation_scores.judge_name_at is
  'そのときの審査員の名前。judge_id は退会で null になる。裁定168 ★2。';
comment on column public.evaluation_reviews.judge_name_at is
  'そのときの審査員の名前。judge_id は退会で null になる。裁定168 ★2。';
comment on column public.org_messages.author_name_at is
  'そのときの書いた人の名前。author_id は退会で null になる。裁定168 ★3。';
comment on column public.org_messages.teacher_name_at is
  'そのときの門下の先生の名前。teacher_id は退会で null になる。裁定168 ★3（Code の追補）。';
comment on column public.monka_read_log.target_name_at is
  'そのときの見られた門下の先生の名前。target_monka_id は退会で null になる。裁定161 FX1。';

-- ===========================================================================
-- 二 ── 退会が 止まる ところ（裁定168 ★1）── NO ACTION → SET NULL
-- ===========================================================================
--   ★★レッスン・出欠は「学校の 運営の 記録」として 残します。
--     ★「やめると どう なるか」の 画面の 約束の とおり です。

alter table public.lessons drop constraint if exists lessons_student_id_fkey;
alter table public.lessons add constraint lessons_student_id_fkey
  foreign key (student_id) references auth.users(id) on delete set null;

alter table public.lessons drop constraint if exists lessons_teacher_id_fkey;
alter table public.lessons add constraint lessons_teacher_id_fkey
  foreign key (teacher_id) references auth.users(id) on delete set null;

alter table public.lessons drop constraint if exists lessons_created_by_fkey;
alter table public.lessons add constraint lessons_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

alter table public.lessons drop constraint if exists lessons_attendance_by_fkey;
alter table public.lessons add constraint lessons_attendance_by_fkey
  foreign key (attendance_by) references auth.users(id) on delete set null;

alter table public.organizations drop constraint if exists organizations_created_by_fkey;
alter table public.organizations add constraint organizations_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

alter table public.org_invitations drop constraint if exists org_invitations_used_by_fkey;
alter table public.org_invitations add constraint org_invitations_used_by_fkey
  foreign key (used_by) references auth.users(id) on delete set null;

alter table public.org_invitations drop constraint if exists org_invitations_invited_by_fkey;
alter table public.org_invitations add constraint org_invitations_invited_by_fkey
  foreign key (invited_by) references auth.users(id) on delete set null;

alter table public.roster_drafts drop constraint if exists roster_drafts_linked_user_id_fkey;
alter table public.roster_drafts add constraint roster_drafts_linked_user_id_fkey
  foreign key (linked_user_id) references auth.users(id) on delete set null;

alter table public.roster_drafts drop constraint if exists roster_drafts_imported_by_fkey;
alter table public.roster_drafts add constraint roster_drafts_imported_by_fkey
  foreign key (imported_by) references auth.users(id) on delete set null;

alter table public.lesson_presets drop constraint if exists lesson_presets_created_by_fkey;
alter table public.lesson_presets add constraint lesson_presets_created_by_fkey
  foreign key (created_by) references auth.users(id) on delete set null;

alter table public.teacher_invitations drop constraint if exists teacher_invitations_used_by_student_id_fkey;
alter table public.teacher_invitations add constraint teacher_invitations_used_by_student_id_fkey
  foreign key (used_by_student_id) references auth.users(id) on delete set null;

-- ★★`organizations.contract_owner_user_id` は **触りません**。
--   ★わざと NO ACTION の まま です。★画面で 先に お伝えします。

-- ===========================================================================
-- 三 ── 消えては いけない のに 消える ところ（裁定168 ★2・★3）
-- ===========================================================================
alter table public.evaluation_scores drop constraint if exists evaluation_scores_judge_id_fkey;
alter table public.evaluation_scores add constraint evaluation_scores_judge_id_fkey
  foreign key (judge_id) references auth.users(id) on delete set null;

alter table public.evaluation_reviews drop constraint if exists evaluation_reviews_judge_id_fkey;
alter table public.evaluation_reviews add constraint evaluation_reviews_judge_id_fkey
  foreign key (judge_id) references auth.users(id) on delete set null;

alter table public.org_messages drop constraint if exists org_messages_author_id_fkey;
alter table public.org_messages add constraint org_messages_author_id_fkey
  foreign key (author_id) references auth.users(id) on delete set null;

alter table public.org_messages drop constraint if exists org_messages_teacher_id_fkey;
alter table public.org_messages add constraint org_messages_teacher_id_fkey
  foreign key (teacher_id) references auth.users(id) on delete set null;

-- ★★`evaluation_*.student_id` は **触りません**。
--   ★学生 ご本人が 退会したら、★その方の 点は 消えて よい もの です（★ご本人の もの）。

-- ===========================================================================
-- 四 ── 記録の 表（裁定161 FX1）
-- ===========================================================================
alter table public.monka_read_log drop constraint if exists monka_read_log_viewer_user_id_fkey;
alter table public.monka_read_log add constraint monka_read_log_viewer_user_id_fkey
  foreign key (viewer_user_id) references auth.users(id) on delete set null;

alter table public.monka_read_log drop constraint if exists monka_read_log_target_monka_id_fkey;
alter table public.monka_read_log add constraint monka_read_log_target_monka_id_fkey
  foreign key (target_monka_id) references auth.users(id) on delete set null;

alter table public.post_change_log drop constraint if exists post_change_log_target_user_id_fkey;
alter table public.post_change_log add constraint post_change_log_target_user_id_fkey
  foreign key (target_user_id) references auth.users(id) on delete set null;

alter table public.score_log drop constraint if exists score_log_editor_user_id_fkey;
alter table public.score_log add constraint score_log_editor_user_id_fkey
  foreign key (editor_user_id) references auth.users(id) on delete set null;

-- ★★`export_log.user_id` は **触りません**。★決めが 要ります（下の 註）。
--   ★裁定161 FX1 は 4表 と して います。★けれど `export_log` は
--     ★「その方が 自分の 記録を 書き出した」記録 です。★ご本人の もの です。
--   ★★ご本人の ものを 退会で 消すのは、★ほかの「消えて よい」表と 同じ 扱い です。
--   ★★★これを 残すと、★退会した 方の 行が 名前なしで 残ります。★何の 役に 立つかが 決まって いません。
--   ★when …… 「書き出しの 記録を 何年 残すか」が 決まった 日。

commit;

-- ★★★確かめ（当てた あとに 流して ください）
--   select rel.relname, con.conname, con.confdeltype
--     from pg_constraint con join pg_class rel on rel.oid = con.conrelid
--    where con.contype='f' and rel.relname in
--      ('lessons','organizations','org_invitations','roster_drafts','lesson_presets',
--       'teacher_invitations','evaluation_scores','evaluation_reviews','org_messages',
--       'monka_read_log','post_change_log','score_log');
