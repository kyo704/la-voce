-- ★★★移行の 記録に 無い もの を、★あとから 書き起こしました（2026-09-22）。
--   ★2026-09-21 に 本番へ。★移行の 記録に 残って いません でした。
--   ★★もとの ファイル …… supabase/migration_monka_read_close.sql
--   ★★★時刻（20260921090000 の 下6桁）は **分かりません**。
--     ★当てた 順だけ 正しく 並べて あります。★本当の 時刻では ありません。
--   ★★★この ファイルは、★まだ `schema_migrations` に **入って いません**。
--     ★`apply_migration` の 口に 資格が なく、★403 で 止まりました。
--     ★入れ方は docs/reports/2026-09-22-移行の記録が残せません.md に 書いて あります。

-- ============================================================================
-- STEP_0 ── 門下の中身を monka_read で読む道を、台帳の側で閉じます
--           （裁定157 のあとの緊急対応・2026-09-21）
--
--   なぜ閉じるか
--     画面は「見ると 記録に 残ります。ご本人にも 伝わります」と約束しています
--     （lib/renraku.js の MONKA_READ_SELF_LINE・Renraku.jsx で出しています）。
--     ところが monka_read_log に書く処理がどこにもありません。
--     本番の monka_read_log は 0行です。
--
--     約束が偽のあいだ、読める状態を残しません。
--     画面で隠すだけにしません。画面の門は門ではありません。
--
--   いま誰に効くか
--     本番で monka_read を持つ役職は 0、持つ人も 0 です（数えました）。
--     いま困る方はいません。先に閉じておきます。
--
--   外す条件（★これを戻すとき）
--     中身を返す道（RPC）の中で、台帳が先に monka_read_log へ1行書き、
--     書けたときだけ中身を返す形（fail closed）ができた日。
--     そのとき、この紙の最後の1行を戻します。
--
--   触るのは最後の1つの枝だけです。
--     先生ご本人・門下の学生・renraku_all の枝は、1文字も変えていません。
-- ============================================================================

drop policy if exists org_messages_select on public.org_messages;

create policy org_messages_select on public.org_messages
  for select using (
    (auth.uid() = teacher_id)
    OR (
      (EXISTS (
        SELECT 1 FROM assignments a
         WHERE ((a.org_id = org_messages.org_id)
            AND (a.student_id = auth.uid())
            AND (a.ended_at IS NULL)
            AND ((org_messages.teacher_id IS NULL)
              OR (a.teacher_id = org_messages.teacher_id)))))
      AND (
        ((cardinality(target_division_ids) = 0)
         AND (cardinality(target_grade_years) = 0)
         AND (cardinality(target_user_ids) = 0))
        OR (auth.uid() = ANY (target_user_ids))
        OR (EXISTS (
          SELECT 1 FROM enrollments e
           WHERE ((e.org_id = org_messages.org_id)
              AND (e.student_id = auth.uid())
              AND (e.status = 'active'::text)
              AND (e.division_id = ANY (org_messages.target_division_ids)))))
        OR (EXISTS (
          SELECT 1 FROM enrollments e
           WHERE ((e.org_id = org_messages.org_id)
              AND (e.student_id = auth.uid())
              AND (e.status = 'active'::text)
              AND (e.grade_year = ANY (org_messages.target_grade_years)))))))
    OR ((teacher_id IS NULL) AND has_can(org_id, 'renraku_all'::text))
    -- ★2026-09-21 に外しました（STEP_0）。戻す条件は上の註にあります。
    --   OR ((teacher_id IS NOT NULL) AND has_can(org_id, 'monka_read'::text))
  );

comment on policy org_messages_select on public.org_messages is
  '門下の連絡を読める人。2026-09-21、monka_read の枝を外した（開いた記録が書かれていないため）。戻すのは、中身を返す道が先に monka_read_log へ書く形になってから。';
