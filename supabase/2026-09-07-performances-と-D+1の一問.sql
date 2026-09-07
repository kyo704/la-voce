-- 本番モード §1・§7 ── 本番の日と、D+1 の一問（2026年9月7日）
--
--   出どころ docs/opus/lavoce-仕様-本番モードの実装（9月6日・詳細版）.md §1 §7
--            docs/opus/001-本番モード仕様書の状態（9月7日）.md の訂正1・2
--
--   ★★仕様書の名前 events を、performances に変えました（訂正1）。
--     ★すでに events という表があります（★行動ログ）。まったく別のものです。
--     ★lib/events.js は、★健康の値が入ってきたら実行時に弾く作りです。
--     ★同じ名前にすると、★その境界を守れません。
--
--   ★★load_coef を、列ごと落としました（訂正2）。
--     ★負荷の比（ACWR）をやめたので、★係数そのものが要りません。
--     ★recovery_coef も、★同じ理由で落としました。
--     ★★あとで要るようになったら、★そのとき足します。
--       ★使わない列を先に作ると、★「あるのに動かない」になります。
--
--   ★何度流しても大丈夫です。

-- ===========================================================================
-- ① 本番の日
-- ===========================================================================
create table if not exists public.performances (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  -- ★★date 型です。★時刻を持ちません（§1.3）。
  --   ★「今日」は、★端末のローカル日付で判定します。
  --   ★UTC で判定すると、★イタリアにいらっしゃるとき、当日に「あと1日」と出ます。
  performed_on date not null,
  kind         text not null,
  -- ★★任意の名前。★アプリは読みません。★そのまま出すだけです（§1.2）。
  --   ★だから「自由記述を作らない」の決まりには触れません。
  label        text,
  org_event_id uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint performances_kind_ok check (kind in (
    'honban', 'rehearsal', 'lesson_take', 'lesson_give',
    'recording', 'audition', 'travel', 'rest'
  )),
  constraint performances_label_len check (label is null or char_length(label) <= 40)
);

create index if not exists performances_user_date
  on public.performances (user_id, performed_on);
create index if not exists performances_user_kind_date
  on public.performances (user_id, kind, performed_on);

-- ===========================================================================
-- ② D+1 の一問の答え
-- ===========================================================================
--   ★★1つの本番に、1件だけ（unique）。★押し直しは上書きします。
--   ★★この表は、要配慮個人情報になりません。
--     ★病名でも、受診の結果でもありません。★ご本人の主観の3択です。

create table if not exists public.performance_results (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  performance_id uuid not null references public.performances(id) on delete cascade,
  result         text not null check (result in ('out', 'partial', 'not_out')),
  answered_at    timestamptz not null default now(),
  unique (performance_id)
);

create index if not exists performance_results_user
  on public.performance_results (user_id);

-- ===========================================================================
-- ③ ★ご本人のものだけ（RLS）
-- ===========================================================================
--   ★★先生には見せません。★共有の道を、はじめから作りません。
--     ★cycle_periods と同じ考えです。★道が無ければ、設定を誤りようがありません。

alter table public.performances        enable row level security;
alter table public.performance_results enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies
                 where schemaname='public' and tablename='performances'
                   and policyname='performances_own') then
    create policy performances_own on public.performances
      for all to authenticated
      using (auth.uid() = user_id)
      -- ★★WITH CHECK の無い UPDATE のポリシーは、欠陥です。例外はありません。
      with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies
                 where schemaname='public' and tablename='performance_results'
                   and policyname='performance_results_own') then
    create policy performance_results_own on public.performance_results
      for all to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

-- ★★権限は、表ぜんたいではなく、必要なものだけ。
--   ★先に剥がしてから渡します。★順番が逆だと、広いほうが勝ちます。
revoke all on public.performances        from anon;
revoke all on public.performance_results from anon;
revoke truncate, delete on public.performances        from authenticated;
revoke truncate on public.performance_results from authenticated;
grant select, insert, update, delete on public.performances        to authenticated;
grant select, insert, update, delete on public.performance_results to authenticated;

-- ★★performances の delete を戻しています。
--   ★本番の予定は、★ご本人が消せる必要があります（★入れ間違い）。
--   ★記録そのものではないので、★消せてよいものです。

-- ===========================================================================
-- ④ 確かめ（★読むだけ）
-- ===========================================================================
select table_name as "表", column_name as "列", data_type as "型"
from information_schema.columns
where table_schema = 'public'
  and table_name in ('performances', 'performance_results')
order by table_name, ordinal_position;

-- ★★load_coef と recovery_coef が、★無いこと。
select count(*) as "あってはいけない列の数"
from information_schema.columns
where table_schema = 'public' and table_name = 'performances'
  and column_name in ('load_coef', 'recovery_coef');

-- ★★ポリシーが、1つずつあること。
select tablename as "表", policyname as "ポリシー",
       case when with_check is null then '★WITH CHECK が無い' else 'あります' end as "WITH CHECK"
from pg_policies
where schemaname = 'public' and tablename in ('performances', 'performance_results');
