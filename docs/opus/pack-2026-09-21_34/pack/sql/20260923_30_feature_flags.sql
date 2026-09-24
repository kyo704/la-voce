-- 20260923_30 機能の切り替え（裁定176。「作り終えて本番に隠して置く」の仕組み）
-- 坂本さんの決定（2026-09-23）: 実装と配置は進める。公開と案内は、安全の証明が済んでから
-- ★1か所で見える形にする。出発の朝の確認に「切ってある機能の一覧」が要るため

create table if not exists public.feature_flags (
  key          text primary key check (key ~ '^[a-z][a-z0-9_]{2,40}$'),
  title        text not null,                         -- 人が読む名前（公演・ホームページ など）
  state        text not null default 'off'
                 check (state in ('off','internal','beta','on')),
  -- off=誰にも見せない ／ internal=運営（is_internal）だけ ／ beta=印のついた人だけ ／ on=全員
  note         text,                                  -- なぜ切ってあるか（★証明が済んでいない など）
  proved_at    timestamptz,                           -- 安全の証明が済んだ日
  turned_on_at timestamptz,
  updated_at   timestamptz not null default now()
);
alter table public.feature_flags enable row level security;
revoke all on public.feature_flags from anon, authenticated;
grant select on public.feature_flags to authenticated;
drop policy if exists feature_flags_read on public.feature_flags;
create policy feature_flags_read on public.feature_flags for select to authenticated using (true);
-- 書くのはサーバ（service role）だけ。★画面からは変えられない

-- beta の人（内輪の試し。利用者ごと）
create table if not exists public.feature_flag_testers (
  key      text not null references public.feature_flags(key) on delete cascade,
  user_id  uuid not null references auth.users(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (key, user_id)
);
alter table public.feature_flag_testers enable row level security;
revoke all on public.feature_flag_testers from anon, authenticated;
grant select on public.feature_flag_testers to authenticated;
drop policy if exists feature_flag_testers_own on public.feature_flag_testers;
create policy feature_flag_testers_own on public.feature_flag_testers for select to authenticated using (user_id = auth.uid());

-- ★判定は1か所（画面ごとに書かない）
create or replace function public.feature_on(p_key text)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select case (select f.state from public.feature_flags f where f.key = p_key)
    when 'on' then true
    when 'internal' then coalesce((select p.is_internal from public.profiles p where p.id = auth.uid()), false)
    when 'beta' then coalesce((select p.is_internal from public.profiles p where p.id = auth.uid()), false)
                 or exists (select 1 from public.feature_flag_testers t where t.key = p_key and t.user_id = auth.uid())
    else false end;                                   -- ★無い鍵は false（fail closed）
$$;
revoke all on function public.feature_on(text) from public, anon;
grant execute on function public.feature_on(text) to authenticated;

-- いま切ってある機能の一覧（出発の朝の確認・裁定171）
create or replace function public.features_hidden()
returns table(key text, title text, state text, note text)
language sql stable security definer set search_path to 'public' as $$
  select f.key, f.title, f.state, f.note from public.feature_flags f
   where f.state <> 'on' order by f.key;
$$;
revoke all on function public.features_hidden() from public, anon, authenticated;   -- 運営（サーバ）だけ

-- いまの機能（状態は off。証明が済んだものから開ける）
insert into public.feature_flags(key, title, note) values
 ('koen',            '公演',                       '台帳は入れた。画面と証明が済んでから'),
 ('koen_children',   '公演の子ども・緊急の連絡先', '★記録が残ることを確かめてから開ける（裁定147）'),
 ('lesson_rounds',   'レッスン割',                 '証明が済んでから'),
 ('portfolio_public','ポートフォリオの公開ページ', '除外（切った相手・止められている人）の証明が済んでから'),
 ('homepage',        'ホームページ（15型）',       '型の鍵の突き合わせが済んでから'),
 ('works_catalog',   '作品の雛形',                 'データの確かめが済んでから'),
 ('pricing',         '値段・お支払い',             '★販売開始まで開けない'),
 ('student_price',   '学生の値段',                 '同意の仕組みの証明が済んでから'),
 ('matching',        'さがす',                     '★電気通信事業の届出の後（裁定157 T3）'),
 ('scoring',         '採点',                       '審査員の表（裁定165）が入ってから')
on conflict (key) do nothing;

-- 確かめ（実在の試しの利用者で）
-- ふつうの利用者: feature_on('koen') → false／内輪の人（is_internal）: state='internal' なら true
-- 無い鍵: feature_on('nonexistent') → false（★勝手に開かない）
-- 画面から feature_flags を update → 権限エラー
-- features_hidden(): 状態が on でない機能が並ぶ（★出発の朝はこれを見る）
