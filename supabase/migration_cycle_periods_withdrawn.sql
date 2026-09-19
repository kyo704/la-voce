-- ============================================================================
-- ★周期の 撤回の 門（★お決め D87・2026-09-19）
--
--   ★★★`entries` は もう 見て います ──
--     `entries_insert_own_not_withdrawn` ／ `entries_update_own_not_withdrawn`。
--   ★★★`cycle_periods` は 見て いません でした。★決まりは 1本（`for all`）だけ。
--     ★★同意を 撤回した あとでも、★通信を 直に 叩けば 書けます。
--     ★★台帳07 の 10番「まだ 終わって いない こと」の 半分 です。
--
--   ★★★形は `entries` に 揃えます。★新しい 形を 作りません。
--     ★読む・消す …… ★ご本人（★撤回した あとも できます）
--       ★★撤回は「書くのを 止める」こと です。★取り上げる ことでは ありません。
--       ★★消す 道を 閉じると、★撤回した 方が ご自分の 行を 消せなく なります。
--     ★書く・直す …… ★ご本人 かつ 撤回して いない こと
--
--   ★★★よそへの 道は 作りません（★この 表の 決め）。
--     ★★先生の 決まりも、★`security definer` の 読み道も、★1つも 作りません。
--     ★★★4本に 分かれても、★どれも「ご本人 だけ」です。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ★① いまの 1本を 落とす
-- ---------------------------------------------------------------------------
--   ★★落としてから 作ります。★「広い 許しが 残った まま」に しません。
drop policy if exists "Users can manage own cycle periods" on public.cycle_periods;

-- ---------------------------------------------------------------------------
-- ★② 4本に 分ける
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
                 where c.relname = 'cycle_periods' and p.polname = 'cycle_periods_select_own') then
    create policy cycle_periods_select_own on public.cycle_periods
      for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
                 where c.relname = 'cycle_periods' and p.polname = 'cycle_periods_delete_own') then
    create policy cycle_periods_delete_own on public.cycle_periods
      for delete using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
                 where c.relname = 'cycle_periods'
                   and p.polname = 'cycle_periods_insert_own_not_withdrawn') then
    create policy cycle_periods_insert_own_not_withdrawn on public.cycle_periods
      for insert with check (
        auth.uid() = user_id and not public.consent_withdrawn(auth.uid())
      );
  end if;

  if not exists (select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
                 where c.relname = 'cycle_periods'
                   and p.polname = 'cycle_periods_update_own_not_withdrawn') then
    create policy cycle_periods_update_own_not_withdrawn on public.cycle_periods
      for update using (
        auth.uid() = user_id and not public.consent_withdrawn(auth.uid())
      ) with check (
        auth.uid() = user_id and not public.consent_withdrawn(auth.uid())
      );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- ★確かめ（★流した あとに、★別に 流して ください）
-- ---------------------------------------------------------------------------
--   select p.polname, p.polcmd,
--          pg_get_expr(p.polqual, p.polrelid),
--          pg_get_expr(p.polwithcheck, p.polrelid)
--   from pg_policy p join pg_class c on c.oid = p.polrelid
--   where c.relname = 'cycle_periods';
--
--   ★★4本 で ある こと。★どれも `auth.uid() = user_id` を 持つ こと。
--   ★★書く 2本 だけ が `consent_withdrawn` を 見る こと。
