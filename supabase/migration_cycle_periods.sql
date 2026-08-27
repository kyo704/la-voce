-- ============================================================================
-- La Voce: 周期の記録（周期記録の設計.md §3）
--
-- Supabase の SQL Editor で実行してください（何度実行しても安全です）。
--
-- ★日数は保存しません（§3-1）。保存するのは開始日と、あれば終了日だけ。
--   「◯日目」「周期◯日」「出血◯日」はすべて開始日から導出します。
--   日数を保存すると、開始日を直したときに全部を書き換える処理が要ります。
--   開始日だけ持っていれば、直せば全部が自動で直ります。
--
-- ★教師・管理者向けのポリシーを1つも作りません（§2・§3-4）。
--   SECURITY DEFINER 関数（get_student_entries）からも参照しません。
--   「設定でオフ」ではなく、そもそも他人が読める経路を作らない、が方針です。
-- ============================================================================

create table if not exists public.cycle_periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  start_date date not null,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  -- §3-2 入力の検証。画面側だけでなく、ここでも守る。
  constraint cycle_periods_end_after_start check (end_date is null or end_date >= start_date),
  -- 同じ日に2つの開始日を作れない
  constraint cycle_periods_unique_start unique (user_id, start_date)
);

create index if not exists cycle_periods_user_start_idx
  on public.cycle_periods (user_id, start_date desc);

alter table public.cycle_periods enable row level security;

-- ★本人だけ。教師・管理者向けのポリシーは作らない。
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'cycle_periods' and policyname = 'Users can manage own cycle periods') then
    create policy "Users can manage own cycle periods"
      on public.cycle_periods for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 設定（§3-1 CycleSetting）
--   enabled     … 既存の profiles.track_cycle をそのまま使う（既定 false）
--   showOnHome  … ここで追加（既定 true。enabled のときだけ意味を持つ）
--   ★hormonalTreatment は作らない。分析（§7）でしか使わず、いまは分析を見送るため。
--     取得しない項目を増やさない、という方針（§4-4 と同じ考え方）。
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists cycle_show_on_home boolean not null default true;

comment on column public.profiles.cycle_show_on_home is
  '周期をホームに出すか（§4-3 の3段階の②）。track_cycle が true のときだけ意味を持つ。';

-- ---------------------------------------------------------------------------
-- 既存データの移行
--   entries.cycle_start が立っている日を、開始日として引き継ぎます。
--   終了日は分からないので空のままです（あとから「終わった」で入ります）。
--   ★何度実行しても重複しません（on conflict do nothing）。
--   ★元の entries.cycle_start は消しません。読み取りは新テーブルに切り替えますが、
--     移行が正しかったか確認できるよう、しばらく残します。
-- ---------------------------------------------------------------------------
insert into public.cycle_periods (user_id, start_date)
select e.user_id, e.date
from public.entries e
where e.cycle_start = true
on conflict (user_id, start_date) do nothing;
