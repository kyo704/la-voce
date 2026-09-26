-- 20260926_104 ★raise が 記録を 取り消していた（★本番の 守りが 効いていません）
-- Code の 問い（2026-09-26）:
--   「★raise が 直前の 更新も 取り消す という 発見は、
--     ★ほかの『失敗回数を 記録してから エラーを 返す』関数にも 同じ 問題が 無いか」
-- ★★調べました。★★ありました
--
-- ★★全 plpgsql 関数を 洗い、★書き込み ＋ raise を 持つ ★46本 を 絞り、
--   ★★そのうち「★記録を 残したい」もの ＝ ★1本
--     ★★join_koen_by_code（公演の 合言葉）
--
-- ★★本番で 確かめました: ★失敗 3回 → ★code_attempts ★★0行
--   → ★★「★直近15分の 失敗が 10回を 超えたら 断る」が
--      ★★一度も 効いて いません
--
-- ★★もう 1つ 同じ 形:
--   ★段に 達したとき ★合言葉を 閉じる（update）→ raise
--   → ★★閉じたつもりで ★閉じて いません
--
-- ★★ほかの 45本は ★問題 ありません:
--   ★score_log・monka_read_log・export_log・ops_audit_log は
--   ★★「うまく いった とき」に 書いています（★raise は そのあと ありません）
--   ★★取り消されて 困る 記録では ありません
-- ★103 のあと

create or replace function public.join_koen_by_code(p_code text, p_name text)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare v_code text; v_hash text; v_recent int; v_koen uuid; v_n int; v_tier int; v_id uuid;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  v_code := upper(btrim(p_code));
  v_hash := encode(extensions.digest(v_code, 'sha256'), 'hex');

  select count(*) into v_recent from public.code_attempts a
   where a.ip_hash = encode(extensions.digest(auth.uid()::text, 'sha256'), 'hex')
     and a.at > now() - interval '15 minutes';
  if v_recent >= 10 then return null; end if;   -- ★断る理由を 分けない

  select c.koen_id into v_koen from public.koen_join_codes c
   where c.code = v_code and (c.expires_at is null or c.expires_at > now());

  -- ★★2026-09-26 の 直し:
  --   ★はじめ「★記録してから raise exception」と 書いていました
  --   ★★raise は ★直前の insert も 取り消します
  --   ★★本番で 確かめました: ★失敗 3回 → ★0行
  --   → ★★10回の 上限が ★一度も 効いて いませんでした
  --   ★★★raise を やめ、★null を 返します（★記録が 残ります）
  if v_koen is null then
    insert into public.code_attempts(code_hash, ip_hash)
    values (v_hash, encode(extensions.digest(auth.uid()::text,'sha256'),'hex'));
    return null;                                 -- ★無い・切れた・済んだ を 分けない
  end if;

  select count(*) into v_n from public.koen_members m
   where m.koen_id = v_koen and m.left_at is null;
  select k.tier_people into v_tier from public.koen k where k.id = v_koen;
  if v_tier is not null and v_n >= v_tier then
    -- ★★ここも 同じ: ★閉じてから raise だと ★閉じません でした
    update public.koen_join_codes set expires_at = now()
     where koen_id = v_koen and (expires_at is null or expires_at > now());
    return null;
  end if;

  insert into public.koen_members(koen_id, user_id, name_at, part, joined_at)
  values (v_koen, auth.uid(), left(btrim(p_name), 40), 'cast', now())
  on conflict (koen_id, user_id) where user_id is not null do update set left_at = null
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.join_koen_by_code(text, text) from public, anon;
grant execute on function public.join_koen_by_code(text, text) to authenticated;

-- ★★画面へ:
--   ★★null が 返ったら「★合っていません」と 出します
--   ★★理由を 分けません（★無い・切れた・満員 を 区別しない・もとの 方針どおり）
--   ★★t('err.NO_MATCH')

-- 確かめ（試しの環境で）
-- ★失敗 3回 → ★★code_attempts が ★3行（★前は 0行）
-- ★11回目 → ★null（★記録は 増えない）
-- ★正しい 合言葉 → ★id が 返る
