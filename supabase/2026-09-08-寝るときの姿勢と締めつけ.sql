-- 寝るときの姿勢と、締めつけ（2026年9月8日）
--
--   ★出どころ docs/opus/woolsong-仕様-分析機能の全体（9月7日・夜）§3-3・§5-2
--            docs/lavoce-食事と就寝の設計.md §13-1・§14
--
--   ★★これは、★要配慮個人情報にあたります。
--     「★逆流性食道炎は病名なので、病歴として明確に要配慮個人情報です」
--     ★頭の側を上げて寝るのは、★逆流に対して★することです。
--     ★だから、★記録そのものが、★病歴に近づきます。
--
--   ★★守ること（★周期の記録と、同じ構造にします）
--     ・★既定オフ。★同意が無ければ、記録させない
--     ・★オンにする前に、専用の同意画面（consents の health.reflux_care）
--     ・★先生からは完全に隔離（lib/shareScope.js の NEVER_SHARED_COLUMNS）
--     ・★病名を、画面のどこにも書かない
--
--   ★BEGIN / ROLLBACK は使っていません（2026-09-05 の事故のため）。
--   ★何度流しても、同じ結果になります。

-- ===========================================================================
-- ① 列を足します
-- ===========================================================================
alter table public.entries
  add column if not exists sleep_side  text,
  add column if not exists head_raised text,
  add column if not exists belly_tight text;

-- ★★決まった言葉しか入らないようにします。★画面から何が来ても、ここで止めます。
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'entries_sleep_side_ok') then
    alter table public.entries add constraint entries_sleep_side_ok
      check (sleep_side is null or sleep_side in ('left','right','back','front','unknown'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'entries_head_raised_ok') then
    alter table public.entries add constraint entries_head_raised_ok
      check (head_raised is null or head_raised in ('yes','no','unknown'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'entries_belly_tight_ok') then
    alter table public.entries add constraint entries_belly_tight_ok
      check (belly_tight is null or belly_tight in ('yes','no','unknown'));
  end if;
end $$;

comment on column public.entries.sleep_side is
  '寝るときの向き。要配慮個人情報。先生には渡しません（lib/shareScope.js）。正は lib/refluxCare.js。';
comment on column public.entries.head_raised is
  '頭の側を上げたか。要配慮個人情報。先生には渡しません。';
comment on column public.entries.belly_tight is
  'おなかを締めつけていたか。要配慮個人情報。先生には渡しません。';

-- ===========================================================================
-- ①-2 同意を受け取った日時（★これが門です）
-- ===========================================================================
--   ★★null なら、★記録させません。★既定は null です。
--   ★撤回されたら、★null に戻します。★日時を消すのではなく、null にします。
--   ★周期の記録（track_cycle）と、同じ形にしてあります。

alter table public.profiles
  add column if not exists reflux_care_consent_at timestamptz;

comment on column public.profiles.reflux_care_consent_at is
  '寝るときの姿勢と締めつけの記録に、同意を受け取った日時。null なら記録させません。要配慮個人情報。正は lib/refluxCare.js。';

-- ===========================================================================
-- ② 確かめます（★読むだけ）
-- ===========================================================================
select column_name as 列, data_type as 型, is_nullable as 空を許すか
from information_schema.columns
where table_schema = 'public' and table_name = 'entries'
  and column_name in ('sleep_side', 'head_raised', 'belly_tight')
order by column_name;

select column_name as 列, data_type as 型
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
  and column_name = 'reflux_care_consent_at';

-- ★1行 出れば、門の列ができています。

-- ★3行 出れば、成功です。★どれも text／YES です。

select conname as 決まりの名前, pg_get_constraintdef(oid) as 中身
from pg_constraint
where conrelid = 'public.entries'::regclass
  and conname in ('entries_sleep_side_ok','entries_head_raised_ok','entries_belly_tight_ok')
order by conname;

-- ★3行 出れば、決まった言葉しか入りません。

-- ===========================================================================
-- ③ ★先生に渡っていないことを、確かめます（★読むだけ）
-- ===========================================================================
--   ★get_student_entries は、★渡す列を1つずつ並べて作っています。
--   ★★並んでいなければ、渡りません。★0 が正しい答えです。

select count(*) as 先生に渡している数
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'get_student_entries'
  and (p.prosrc like '%sleep_side%' or p.prosrc like '%head_raised%'
       or p.prosrc like '%belly_tight%' or p.prosrc like '%meal_marks%');

-- ★★0 でなければ、★ここで止めてください。★病歴が先生に渡っています。

-- ===========================================================================
-- ④ 埋まっている数（★読むだけ・★流した直後は 0 のはずです）
-- ===========================================================================
select
  count(*) filter (where sleep_side  is not null) as 寝る向きを書いた日,
  count(*) filter (where head_raised is not null) as 頭の側を書いた日,
  count(*) filter (where belly_tight is not null) as 締めつけを書いた日
from public.entries;

-- ★★3つとも 0 が、正しい状態です。★いっせいに埋めません。
--   ★同意がある方が、★その日から書き始めるものです。
