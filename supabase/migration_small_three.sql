-- ============================================================================
-- ★小口 3件 ── ★招く の 学年・学科 ／ 開いた 記録 ／ 確かめ（★2026-09-19）
--
--   ★★★① 招く ときに 学年・学科を 決めて おく（★見本 `P_maneku`）
--     ★★合言葉を お渡しした あと、★ご本人が 入った ときに 在籍の 行が できます。
--     ★★そのとき、★招いた 方が 決めて おいた 学年・学科を 写します。
--     ★★★「あとから ご本人が 直せます」── ★見本の 字 の とおり です。
--
--   ★★★② 確かめ（★見本 `P_setPost` の warn）
--     ★★ご本人が 自分で 選んだ ままの 役職 か どうか を 見分けます。
--     ★★`verified_at` が 空なら「ご自分で 選んだまま」です。
--     ★★★誰が 確かめたかも 残します。★あとで たどれます。
--
--   ★★③ 開いた 記録は、★表も 決まりも すでに あります（`org_message_reads`）。
--     ★★足す ものは ありません。★画面だけ の 話 です。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ★① 招く ときの 学年・学科
-- ---------------------------------------------------------------------------
alter table public.teacher_invitations add column if not exists grade_year int;
alter table public.teacher_invitations
  add column if not exists division_id uuid references public.org_divisions(id);

comment on column public.teacher_invitations.grade_year is
  '招く ときに 決めて おく 学年（数）。入った ときに enrollments へ 写します。';
comment on column public.teacher_invitations.division_id is
  '招く ときに 決めて おく 学科・分野。入った ときに enrollments へ 写します。';

-- ---------------------------------------------------------------------------
-- ★② 確かめ
-- ---------------------------------------------------------------------------
alter table public.memberships add column if not exists verified_at timestamptz;
alter table public.memberships
  add column if not exists verified_by uuid references auth.users(id) on delete set null;

comment on column public.memberships.verified_at is
  '役職を 学校が 確かめた 日時。空なら「ご自分で 選んだまま」。見本 P_setPost。';
comment on column public.memberships.verified_by is '確かめた 方。';

-- ---------------------------------------------------------------------------
-- ★確かめ
-- ---------------------------------------------------------------------------
--   select column_name from information_schema.columns
--   where table_schema='public'
--     and ((table_name='teacher_invitations' and column_name in ('grade_year','division_id'))
--       or (table_name='memberships' and column_name in ('verified_at','verified_by')));
--
--   ★4つ とも ある はず です。
