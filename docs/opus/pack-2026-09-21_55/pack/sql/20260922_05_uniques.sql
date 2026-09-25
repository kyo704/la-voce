-- 20260922_05 同時に押したときの重複を止める（裁定169 ★5 ★6）
-- 本番の重複は 0件（2026-09-22 Opus が数えた）。そのまま当てられる
create unique index if not exists assignments_active_unique
  on public.assignments(org_id, teacher_id, student_id) where ended_at is null;
create unique index if not exists org_billing_org_unique
  on public.org_billing(org_id);
