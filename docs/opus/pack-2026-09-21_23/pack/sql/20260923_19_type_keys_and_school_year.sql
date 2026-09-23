-- 20260923_19 型の鍵の縛り（裁定146・型キーの一覧）と 年度の切り替え（裁定138・169 P6）

-- ① 型の鍵は 見本の一覧のものだけ（大文字小文字を区別する）
alter table public.portfolios drop constraint if exists portfolios_web_type_check;
alter table public.portfolios add constraint portfolios_web_type_check check (
  web_type is null or web_type in ('t01','t02','t03','t04','t05','t06','t07','t08','t09','t10','t11','t12','t13','t14','t15'));
alter table public.portfolios drop constraint if exists portfolios_paper_type_check;
alter table public.portfolios add constraint portfolios_paper_type_check check (
  paper_type is null or paper_type in ('T1','T2','T3','T4','T5','T6'));   -- ★紙は6型（見本・裁定127。裁定146 の「12型」は誤り）
alter table public.portfolios drop constraint if exists portfolios_field_check;
alter table public.portfolios add constraint portfolios_field_check check (
  field is null or field in ('music','voice','stage','teacher'));
alter table public.page_types_owned drop constraint if exists page_types_owned_type_check;
alter table public.page_types_owned add constraint page_types_owned_type_check check (
  type_key in ('t01','t02','t03','t04','t05','t06','t07','t08','t09','t10','t11','t12','t13','t14','t15'));   -- 持ち物は Web の形だけ

-- ② 年度の切り替え（4月）── 進級・卒業は「状態を変える」だけ。★行は消さない
--    いまの enrollments: status は 'active' / 'left'。卒業を分けて数えられるようにする
alter table public.enrollments drop constraint if exists enrollments_status_check;
alter table public.enrollments add constraint enrollments_status_check check (status in ('active','paused','left','graduated'));   -- ★'paused'（休会）は本番にある。落とさない（2026-09-23 確認）
-- ★卒業・退会の日は 既にある left_at を使う（新しい列を足さない。2026-09-23 本番で確認）
alter table public.enrollments add column if not exists grade_label_history jsonb not null default '[]'::jsonb;  -- 学年の移り変わり

-- 進級（学年の付け替え）。★学生の記録は触らない。名簿の学年だけ
create or replace function public.promote_grades(p_org_id uuid, p_map jsonb)
returns integer language plpgsql security definer set search_path to 'public' as $$
declare n integer := 0; m integer;
begin
  if not public.has_can(p_org_id, 'meibo') then raise exception 'NO_MEIBO'; end if;
  -- p_map の例: {"1年":"2年","2年":"3年","3年":"4年","4年":"__graduate__"}
  update public.enrollments e
     set grade_label = p_map ->> e.grade_label,
         grade_label_history = e.grade_label_history || jsonb_build_object('on', (now() at time zone 'Asia/Tokyo')::date, 'from', e.grade_label)
   where e.org_id = p_org_id and e.status = 'active'
     and p_map ? e.grade_label and p_map ->> e.grade_label <> '__graduate__';
  get diagnostics m = row_count; n := m;
  update public.enrollments e
     set status = 'graduated', left_at = now(),
         grade_label_history = e.grade_label_history || jsonb_build_object('on', (now() at time zone 'Asia/Tokyo')::date, 'from', e.grade_label, 'graduated', true)
   where e.org_id = p_org_id and e.status = 'active'
     and p_map ? e.grade_label and p_map ->> e.grade_label = '__graduate__';
  get diagnostics m = row_count; return n + m;
end $$;
revoke all on function public.promote_grades(uuid, jsonb) from public, anon;
grant execute on function public.promote_grades(uuid, jsonb) to authenticated;

-- 卒業しても、学生の記録は本人に残る（entries に学校への外部キーが無いことの確認・裁定138 S2）
-- ★この移行では entries に一切触れない

-- 確かめ（実在の試しの利用者で）
-- 休会（paused）の人が promote_grades で動かないこと（active だけを動かす）
-- 型: portfolios.web_type='t16' → check 違反／'T01' → 違反（大文字小文字を区別）／paper_type='T7' → 違反
-- 年度: meibo を持つ事務が promote_grades(学校, {"1年":"2年",...,"4年":"__graduate__"}) → 学年が上がり、4年は graduated に
--      持たない人が呼ぶ → NO_MEIBO
--      卒業した学生が自分の記録を見る → そのまま見える（entries は触っていない）
--      卒業した学生は 学校の画面（名簿・連絡）から外れる（status が active でないため）
-- ★Code に確かめる: いまの画面が status='left' を「やめた人」として扱っているか。'graduated' を足したことで、
--   画面の絞り込み（status = 'active'）が壊れないか
