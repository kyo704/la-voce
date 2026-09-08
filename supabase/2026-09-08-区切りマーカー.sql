-- ============================================================================
-- 区切りマーカー（★理由の欄を作らない）── 2026年9月8日
--
--   ★出どころ docs/lavoce-食事と就寝の設計.md §6
--            docs/opus/woolsong-00-実行ルート-v5（9月7日・夜・正）.md 2-7
--
--   ★★何をするか
--     ★「この日から、記録の見方を分ける」という印を、1つ置けるようにします。
--
--   ★★★理由の欄を、作りません。
--     ★服薬・受診そのものを、記録させません（★設計 §9 の8番）。
--     ★治療の内容は、要配慮性がさらに上がり、そのわりに分析には効きません。
--     ★何があったかは、ご本人だけが知っていれば足ります。
--
--   ★★列は3つだけです。
--       user_id / marked_on / created_at
--     ★reason も note も memo も、★作りません。
--     ★あとから足さないでください。★足した時点で、服薬の記録になります。
--
--   ★★先生には、渡しません。
--     ★cycle_periods と同じ形にします。
--     ★ポリシーは1枚だけ（auth.uid() = user_id）。
--     ★★SECURITY DEFINER の関数を、1つも作りません。
--       ★他人の行へ届く道を、はじめから作らないためです。
--
--   ★何度実行しても、同じ結果になります。
--   ★既存の記録には、一切ふれません。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ⓪ 実行前の記録（★あとで見比べるため）
-- ---------------------------------------------------------------------------
select '⓪ 実行前' as "段階",
       (select count(*) from information_schema.tables
         where table_schema = 'public' and table_name = 'period_markers') as "表が在るか";

-- ---------------------------------------------------------------------------
-- ① 表
-- ---------------------------------------------------------------------------
create table if not exists public.period_markers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  marked_on   date not null,
  created_at  timestamptz not null default now(),
  -- ★★同じ日に、2つ置けません。★押すと外れる形にするためです。
  unique (user_id, marked_on)
);

create index if not exists period_markers_user_date_idx
  on public.period_markers (user_id, marked_on desc);

comment on table public.period_markers is
  '区切りマーカー。★理由の欄を作らないこと。服薬・受診を記録しない（食事と就寝の設計 §6）。';

-- ---------------------------------------------------------------------------
-- ② RLS ── ★1枚だけ
-- ---------------------------------------------------------------------------
alter table public.period_markers enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
     where schemaname = 'public' and tablename = 'period_markers'
       and policyname = 'period_markers_own'
  ) then
    -- ★★UPDATE を含めるので、★WITH CHECK を必ず書きます。
    --   ★WITH CHECK の無い UPDATE のポリシーは、欠陥です。
    --   ★USING だけだと、★自分の行を、他人の user_id に書き替えられます。
    create policy period_markers_own on public.period_markers
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- ③ 権限 ── ★先に剥がしてから、必要なものだけ渡します
--
--   ★★表ぜんたいの権限が残っていると、★列ごとの制限は効きません。
--     ★広いほうが、黙って勝ちます。
-- ---------------------------------------------------------------------------
revoke all on public.period_markers from anon;
revoke all on public.period_markers from authenticated;
grant select, insert, delete on public.period_markers to authenticated;
-- ★★update は渡しません。★置くか、外すか、それだけです。
--   ★日付を書き替える道を作ると、★あとから歴史を変えられます。

-- ---------------------------------------------------------------------------
-- ④ 確かめ
-- ---------------------------------------------------------------------------
select '④ 列' as "段階", column_name as "列", data_type as "型"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'period_markers'
 order by ordinal_position;

-- ★★理由の欄が、1つも無いこと。
select '④ 理由の欄' as "段階",
       count(*) as "★0 でなければ、誤りです"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'period_markers'
   and column_name ~* '(reason|why|note|memo|comment|detail|kind|type|medicat|visit|diagnos)';

select '④ ポリシー' as "段階", policyname as "名前", cmd as "操作",
       (qual is not null) as "USING", (with_check is not null) as "WITH CHECK"
  from pg_policies
 where schemaname = 'public' and tablename = 'period_markers';

select '④ 権限' as "段階", grantee as "相手", privilege_type as "権限"
  from information_schema.table_privileges
 where table_schema = 'public' and table_name = 'period_markers'
   and grantee in ('anon', 'authenticated')
 order by 1, 2;

-- ★★SECURITY DEFINER の関数が、1つも無いこと。
select '④ 定義者権限の関数' as "段階",
       count(*) as "★0 でなければ、誤りです"
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.prosecdef
   and p.prosrc ilike '%period_markers%';
