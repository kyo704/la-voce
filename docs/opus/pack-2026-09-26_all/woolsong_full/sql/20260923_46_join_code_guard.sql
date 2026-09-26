-- 20260923_46 公演の合言葉の守り（2026-09-23 に本番を読んで見つけた2件）
-- 見つけたもの:
--   ① ★合言葉の総当たりに 回数制限が無い
--      join_koen_by_code は 理由を返さない作り（正しい）だが、★何回でも試せる
--      教室の招待には code_attempts（code_hash・ip_hash・at）がある。★公演では使っていない
--   ② ★人数の段に達しても 合言葉が閉じない
--      見本は「人数に達したら この合言葉は自動で閉じます」と約束している
--      いまは 段を超えると 引き金（check_koen_tier）が例外を投げるだけ＝★入ろうとした人にエラーが出る
-- ★12・20 のあと。本番で確かめた: code_attempts の列・check_koen_tier の中身・koen_join_codes の列
-- ★落とし穴（本番で確認）: pgcrypto は ★extensions スキーマにある。
--   関数は search_path を 'public' に固定しているので、★digest( ではなく extensions.digest( と書く
--   （そのまま書くと「関数が見つかりません」で 合言葉が使えなくなる）

-- ① 合言葉の失敗を数える／多すぎたら断る
create or replace function public.join_koen_by_code(p_code text, p_name text)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare v_koen uuid; v_id uuid; v_code text; v_hash text; v_recent integer; v_n integer; v_tier integer;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  v_code := upper(btrim(p_code));
  v_hash := encode(extensions.digest(v_code, 'sha256'), 'hex');

  -- ★同じ人の 直近15分の失敗が10回を超えたら 断る（理由は変えない）
  select count(*) into v_recent from public.code_attempts a
   where a.ip_hash = encode(extensions.digest(auth.uid()::text, 'sha256'), 'hex')
     and a.at > now() - interval '15 minutes';
  if v_recent >= 10 then raise exception 'NO_MATCH'; end if;   -- ★断る理由を分けない

  select c.koen_id into v_koen from public.koen_join_codes c
   where c.code = v_code and (c.expires_at is null or c.expires_at > now());

  if v_koen is null then
    insert into public.code_attempts(code_hash, ip_hash)
    values (v_hash, encode(extensions.digest(auth.uid()::text,'sha256'),'hex'));
    raise exception 'NO_MATCH';                                -- ★無い・切れた・済んだ を分けない
  end if;

  -- ② 段に達していたら ★合言葉を閉じて、入ろうとした人には「合っていない」と同じ答えを返す
  select count(*) into v_n from public.koen_members m where m.koen_id = v_koen and m.left_at is null;
  select k.tier_people into v_tier from public.koen k where k.id = v_koen;
  if v_tier is not null and v_n >= v_tier then
    update public.koen_join_codes set expires_at = now() where koen_id = v_koen and (expires_at is null or expires_at > now());
    raise exception 'NO_MATCH';
  end if;

  insert into public.koen_members(koen_id, user_id, name_at, part, joined_at)
  values (v_koen, auth.uid(), left(btrim(p_name), 40), 'cast', now())
  on conflict (koen_id, user_id) where user_id is not null do update set left_at = null
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.join_koen_by_code(text, text) from public, anon;
grant execute on function public.join_koen_by_code(text, text) to authenticated;

-- ★運営には「閉じた理由」を出す（入ろうとした人には出さない）
create or replace function public.koen_code_status(p_koen uuid)
returns table(code text, open boolean, closed_at timestamptz, people integer, tier integer, failed_15min integer)
language sql stable security definer set search_path to 'public' as $$
  select c.code,
         (c.expires_at is null or c.expires_at > now()),
         case when c.expires_at is not null and c.expires_at <= now() then c.expires_at end,
         (select count(*)::int from public.koen_members m where m.koen_id = p_koen and m.left_at is null),
         (select k.tier_people from public.koen k where k.id = p_koen),
         (select count(*)::int from public.code_attempts a
           where a.code_hash = encode(extensions.digest(c.code,'sha256'),'hex') and a.at > now() - interval '15 minutes')
    from public.koen_join_codes c
   where c.koen_id = p_koen and public.koen_can_manage(p_koen);
$$;
revoke all on function public.koen_code_status(uuid) from public, anon;
grant execute on function public.koen_code_status(uuid) to authenticated;

-- 確かめ（試しの環境で）
-- 合っていない合言葉を11回 → 11回目も ★NO_MATCH（同じ答え）。code_attempts に10行たまる
-- 正しい合言葉 → 入れる。★失敗は記録しない
-- 段が5人で すでに5人 → ★合言葉が閉じる。次の人は NO_MATCH（★段を超えた とは言わない）
-- 期限切れの公演 → 入れない（期限の引き金が止める）
-- 運営が koen_code_status → 閉じたこと・人数・段・直近15分の失敗の回数が見える
-- ★出演者が koen_code_status → 0行
