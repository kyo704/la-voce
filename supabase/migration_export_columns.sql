-- ============================================================================
-- ★書き出しの ための 3列（★お決め D92・D93・D94・2026-09-20）
--
--   ★★★どれも「校務システムに 戻す」ための 列 です。
--     ①`enrollments.student_number` …… ★学籍番号（★学校ごと）
--     ②`lessons.place_id` ／ `lessons.kind` …… ★場所と 種別
--     ③`profiles.kana` …… ★氏名カナ（★カナで 並べる ため）
--
--   ★★★`profiles` に 学籍番号を 足しません（★お決めの とおり）。
--     ★★学校を またいで 同じ 番号に なって しまう ため です。
--
--   ★★★空の ままでも 動きます。★入れた 方の ぶん だけ 出ます。
--     ★★一括で 埋めません（★「選んだ」と「既定の まま」を 分ける ため）。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

-- ★① 学籍番号（★学校ごとに 1つ）
alter table public.enrollments
  add column if not exists student_number text;

--   ★★同じ 学校の 中で、★同じ 番号を 2人に 付けられません。
--   ★★空（null）は いくつ あっても かまいません。
create unique index if not exists enrollments_student_number_uniq
  on public.enrollments (org_id, student_number)
  where student_number is not null;

-- ★② レッスンの 場所と 種別
alter table public.lessons
  add column if not exists place_id uuid references public.org_places(id) on delete set null;
alter table public.lessons
  add column if not exists kind text;

-- ★③ 氏名カナ
alter table public.profiles
  add column if not exists kana text;

comment on column public.enrollments.student_number is
  '★学籍番号（学校ごと）。校務システムに 戻す ときの 鍵（★お決め D92・2026-09-20）';
comment on column public.lessons.place_id is
  '★どこで するか（`org_places`）。★消しても レッスンは 残ります（★お決め D93）';
comment on column public.lessons.kind is
  '★種別（学校が 決める 字）。★こちらからの 既定は ありません（★お決め D93）';
comment on column public.profiles.kana is
  '★氏名カナ。★ご本人が 入れます。★並べ替えに 使います（★お決め D94）';

-- ---------------------------------------------------------------------------
-- ★列の 権限（★`profiles` は 列ごとに 絞って あります）
-- ---------------------------------------------------------------------------
--   ★★`profiles` の 更新は 列ごとの 許しで 絞って います（★2026-09-15 の 一件）。
--   ★★だから `kana` にも はっきり 許しを 出します。★出さないと 書けません。
grant update (kana) on table public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- ★確かめ（★流した あとに、★別に 流して ください）
-- ---------------------------------------------------------------------------
--   select table_name, column_name from information_schema.columns
--   where table_schema='public'
--     and (table_name, column_name) in
--       (('enrollments','student_number'), ('lessons','place_id'),
--        ('lessons','kind'), ('profiles','kana'));
--   ★★4行 ある こと。
