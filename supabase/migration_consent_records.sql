-- ============================================================================
-- 同意の記録（EUの下地づくり.md §3-2・作業指示-研究利用の同意.md §3-1）
--
--   ★1つの仕組みで、日本の要配慮個人情報の同意と、EUの下地の両方を満たします。
--     §3-4「EU 用に別の仕組みを作らないでください」。
--
--   ★行を消しません。撤回は withdrawn_at を入れます。
--     「撤回した」という事実そのものが、記録として要ります。
--   ★IPは保存しません（§3-2 の ip?: never）。
--   ★文言の版とハッシュを必ず入れます。あとから
--     「あの人は何に同意したのか」を答えられなくなるためです。
--
--   ★何度実行しても同じ結果になります。
-- ============================================================================

create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  -- 目的ごとに1行。★まとめて1つにしないこと（§3-3）
  purpose_key text not null,
  -- 表示した文面の版と、その文面のハッシュ
  policy_version text not null,
  text_hash text not null,
  locale text not null default 'ja',
  -- どう取ったか（チェックボックス／ボタン）
  method text not null default 'checkbox',
  granted_at timestamptz not null default now(),
  -- ★撤回。行は消さず、ここに時刻を入れる
  withdrawn_at timestamptz,
  created_at timestamptz not null default now()
);

-- 同じ目的について、同意→撤回→再同意 が並びます。
-- いちばん新しい granted_at を見るので、一意制約は付けません。
create index if not exists consent_records_user_purpose_idx
  on public.consent_records (user_id, purpose_key, granted_at desc);

alter table public.consent_records enable row level security;

-- ★本人だけ。教師にも管理者にも、読む道を作りません。
do $$
begin
  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'consent_records'
                   and policyname = 'Users can view own consent records') then
    create policy "Users can view own consent records"
      on public.consent_records for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'consent_records'
                   and policyname = 'Users can insert own consent records') then
    create policy "Users can insert own consent records"
      on public.consent_records for insert with check (auth.uid() = user_id);
  end if;
  -- ★撤回のための update だけを許します。
  --   delete のポリシーは作りません。行を消せないようにするためです。
  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'consent_records'
                   and policyname = 'Users can withdraw own consent') then
    create policy "Users can withdraw own consent"
      on public.consent_records for update using (auth.uid() = user_id);
  end if;
end $$;

comment on table public.consent_records is
  '同意の記録。★行を消さないこと（撤回は withdrawn_at）。★IPを保存しないこと。目的ごとに1行。';
comment on column public.consent_records.purpose_key is
  '目的（health.record / health.cycle / health.meal_sleep / research.anonymized）。正は lib/consent.js。';
comment on column public.consent_records.text_hash is
  '★表示した文面のハッシュ。省略しないこと。文言を変えたあと、誰が何に同意したかを答えられなくなる。';
comment on column public.consent_records.withdrawn_at is
  '★撤回した時刻。行は消さない。「撤回した」という事実の記録が要る。';

-- 確認
select column_name as "列", data_type as "型", is_nullable as "null可"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'consent_records'
 order by ordinal_position;

select policyname as "ポリシー", cmd as "操作"
  from pg_policies
 where schemaname = 'public' and tablename = 'consent_records'
 order by policyname;
