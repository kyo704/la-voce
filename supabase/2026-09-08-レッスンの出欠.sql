-- ============================================================================
-- レッスンの出欠 ── 第2便（2026年9月8日）
--
--   ★出どころ woolsong-裁定-全体レイアウトと教室機能・Sonnetへの引き継ぎ（9月8日）.md
--            §4-2（帯そのものが出欠の表）・§7-1（電波がなくても）・§7-2（1タップ）
--
--   ★★3つだけです。★増やさないこと。
--       came（来た）／ absent（休み）／ canceled（中止）
--     ★「遅刻」「早退」を、作りません。★細かくすると1タップで終わりません。
--
--   ★★健康の記録には、★1文字も触れません（★§7-7「層で分ける」）。
--     ★entries にも profiles にも、★列を足しません。
--
--   ★★押せるのは、★先生だけです。
--     ★生徒は、自分のレッスンを ★見られますが、★出欠は書けません。
--
--   ★何度実行しても、同じ結果になります。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ⓪ 実行前
-- ---------------------------------------------------------------------------
select '⓪ 実行前' as "段階", column_name as "いまの列"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'lessons'
 order by ordinal_position;

-- ---------------------------------------------------------------------------
-- ① 列
--
--   ★★null が「まだ押していない」です。★埋め戻しません。
--     ★「押していない」と「休みだった」は、★違うことです。
-- ---------------------------------------------------------------------------
alter table public.lessons
  add column if not exists attendance text,
  add column if not exists attendance_at timestamptz,
  add column if not exists attendance_by uuid references auth.users(id);

-- ★★3つ以外を、入れさせません。★画面の作りに頼らないこと。
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'lessons_attendance_check'
  ) then
    alter table public.lessons
      add constraint lessons_attendance_check
      check (attendance is null or attendance in ('came', 'absent', 'canceled'));
  end if;
end $$;

comment on column public.lessons.attendance is
  '出欠。came / absent / canceled の3つだけ。null は「まだ押していない」。';

-- ---------------------------------------------------------------------------
-- ② ★書けるのは、先生だけ
--
--   ★★UPDATE のポリシーには、★WITH CHECK を必ず書きます。
--     ★USING だけだと、★自分の行を、他人のものに書き替えられます。
--
--   ★★lessons は teacher_student_links か teacher_id で先生につながります。
--     ★どちらの形の行もあるので、★両方を見ます。
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'lessons'
       and policyname = 'lessons_attendance_teacher_update'
  ) then
    create policy lessons_attendance_teacher_update on public.lessons
      for update
      using (
        auth.uid() = teacher_id
        or exists (
          select 1 from public.teacher_student_links l
           where l.id = lessons.link_id and l.teacher_id = auth.uid()
        )
      )
      with check (
        auth.uid() = teacher_id
        or exists (
          select 1 from public.teacher_student_links l
           where l.id = lessons.link_id and l.teacher_id = auth.uid()
        )
      );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- ③ 権限 ── ★先に剥がしてから、必要な列だけ渡します
--
--   ★★表ぜんたいの UPDATE が残っていると、★列ごとの制限は効きません。
--     ★広いほうが、黙って勝ちます。
-- ---------------------------------------------------------------------------
revoke update on public.lessons from authenticated;
grant update (attendance, attendance_at, attendance_by)
  on public.lessons to authenticated;

-- ---------------------------------------------------------------------------
-- ④ 確かめ
-- ---------------------------------------------------------------------------
select '④ 列' as "段階", column_name as "列", data_type as "型"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'lessons'
   and column_name like 'attendance%'
 order by ordinal_position;

select '④ 3つだけか' as "段階", pg_get_constraintdef(oid) as "決まり"
  from pg_constraint where conname = 'lessons_attendance_check';

select '④ ポリシー' as "段階", policyname as "名前", cmd as "操作",
       (qual is not null) as "USING", (with_check is not null) as "WITH CHECK"
  from pg_policies
 where schemaname = 'public' and tablename = 'lessons'
 order by cmd, policyname;

-- ★★列ごとの UPDATE だけが渡っていること。★表ぜんたいの UPDATE が無いこと。
select '④ 権限' as "段階", grantee as "相手", privilege_type as "権限",
       column_name as "列"
  from information_schema.column_privileges
 where table_schema = 'public' and table_name = 'lessons'
   and grantee in ('anon', 'authenticated') and privilege_type = 'UPDATE'
 order by 1, 2, 4;

select '④ 表ぜんたいの UPDATE' as "段階",
       count(*) as "★0 でなければ、誤りです"
  from information_schema.table_privileges
 where table_schema = 'public' and table_name = 'lessons'
   and grantee in ('anon', 'authenticated') and privilege_type = 'UPDATE';

-- ★★健康の記録に、★1列も足していないこと。
select '④ entries に触っていないか' as "段階",
       count(*) as "★0 でなければ、誤りです"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'entries'
   and column_name like 'attendance%';
