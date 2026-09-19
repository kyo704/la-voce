-- ============================================================================
-- ★お知らせの 宛先 ── ★見本 `P_write`（★2026-09-19）
--
--   ★★★見本は 宛先を 段で 狭めます ── ★学部 → 学科 → 学年 → 門下 → お名前。
--     ★★いまは「学校ぜんぶ」か「門下 1つ」しか ありません。
--
--   ★★★裁定 その89（行事の 対象）と 同じ 形に します。
--     ★★空の 配列＝全員。★`null` では ありません。
--     ★★「まだ 決めて いない」と「みなさんへ」を 同じに しない ため です。
--
--   ★★★読む 決まりも 直します。
--     ★★宛先を 決めた のに 全員に 届いて いては、★意味が ありません。
--     ★★当てはまる 方 か、★空（全員）の ときだけ 読めます。
--     ★★★運営（`renraku_all`）と 事故の とき（`monka_read`）は これまで どおり です。
--
--   ★★題（`title`）を 足します。★見本に あります。★いまは 本文 だけ でした。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

alter table public.org_messages add column if not exists title text;
alter table public.org_messages
  add column if not exists target_division_ids uuid[] not null default '{}';
alter table public.org_messages
  add column if not exists target_grade_years int[] not null default '{}';
alter table public.org_messages
  add column if not exists target_user_ids uuid[] not null default '{}';

comment on column public.org_messages.title is '題（見本 P_write）。無くても かまいません。';
comment on column public.org_messages.target_division_ids is
  '宛先の 学科・分野（org_divisions）。空＝しぼらない。裁定その89と同じ形。';
comment on column public.org_messages.target_grade_years is
  '宛先の 学年（数）。空＝しぼらない。';
comment on column public.org_messages.target_user_ids is
  '名ざしで 足した 方。空＝しぼらない。';

-- ---------------------------------------------------------------------------
-- ★読む 決まり ── ★宛先に 当てはまる 方 だけ
-- ---------------------------------------------------------------------------
--   ★★★もとの 4つの 枝は そのまま です。
--     ★① ご自分が 先生の 門下
--     ★② 受け持たれて いる 生徒（門下 ／ 学校ぜんぶ）
--     ★③ `renraku_all`（運営）
--     ★④ `monka_read`（事故の とき）
--   ★★②に「宛先に 当てはまるか」を 足します。
--     ★★★3つ とも 空なら、★これまで どおり 全員 です。
drop policy if exists org_messages_select on public.org_messages;
create policy org_messages_select on public.org_messages
  for select to authenticated
  using (
    (auth.uid() = teacher_id)
    or (
      exists (
        select 1 from public.assignments a
        where a.org_id = org_messages.org_id
          and a.student_id = auth.uid()
          and a.ended_at is null
          and (org_messages.teacher_id is null or a.teacher_id = org_messages.teacher_id)
      )
      and (
        -- ★★しぼって いない（3つ とも 空）── ★みなさんへ
        (
          cardinality(org_messages.target_division_ids) = 0
          and cardinality(org_messages.target_grade_years) = 0
          and cardinality(org_messages.target_user_ids) = 0
        )
        -- ★★名ざしで 足された 方
        or auth.uid() = any (org_messages.target_user_ids)
        -- ★★学科・分野が 当てはまる 方
        or exists (
          select 1 from public.enrollments e
          where e.org_id = org_messages.org_id
            and e.student_id = auth.uid()
            and e.status = 'active'
            and e.division_id = any (org_messages.target_division_ids)
        )
        -- ★★学年が 当てはまる 方
        or exists (
          select 1 from public.enrollments e
          where e.org_id = org_messages.org_id
            and e.student_id = auth.uid()
            and e.status = 'active'
            and e.grade_year = any (org_messages.target_grade_years)
        )
      )
    )
    or ((teacher_id is null) and has_can(org_id, 'renraku_all'))
    or ((teacher_id is not null) and has_can(org_id, 'monka_read'))
  );

-- ---------------------------------------------------------------------------
-- ★確かめ
-- ---------------------------------------------------------------------------
--   select column_name, column_default from information_schema.columns
--   where table_schema='public' and table_name='org_messages'
--     and column_name like 'target%';
--
--   ★3つ とも 既定は `'{}'::uuid[]` ／ `'{}'::integer[]` の はず です。
--   ★`null` に なって いない ことを ご覧ください。
