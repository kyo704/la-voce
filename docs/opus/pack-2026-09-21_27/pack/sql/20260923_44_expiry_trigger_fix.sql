-- 20260923_44 ★sql/33 の引き金の直し（引き金の順番と連鎖を確かめて見つけた）
-- 見つけたもの（2026-09-23 Opus が本番で確認）:
--   sql/33 で入れた「期限を過ぎたら書けない」引き金が、★人の意思でない書き込みまで止めていた
--   ① 退会: koen_members.user_id は ★ON DELETE SET NULL → 退会すると この表を UPDATE する
--      期限切れの公演に入っていた人は ★退会できない（裁定その9「いつでも退会できます」に反する）
--   ② 公演を消す: koen を消すと 子の表を連鎖で消す → 引き金が DELETE を止める
--      → ★期限切れの公演は 消せない
--   ③ 出演者を消すと koen_cells.member_id が SET NULL → これも止まる
-- いまの実害: koen は0行。★実害が出るのは 公演を使い始めてから
-- ★33 を当てたあとに、これを当てる（33 の引き金の中身を置き換える）

-- ① 公演を消している最中の印（org_contacts と同じ考え・裁定173）
create or replace function public.mark_closing_koen()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  perform set_config('app.closing_koen', old.id::text, true);
  return old;
end $$;
revoke all on function public.mark_closing_koen() from public, anon, authenticated;
drop trigger if exists koen_mark_closing on public.koen;
create trigger koen_mark_closing before delete on public.koen
  for each row execute function public.mark_closing_koen();

-- ② 期限の見張りを置き換える
create or replace function public.koen_block_after_expiry()
returns trigger language plpgsql set search_path to 'public' as $$
declare v_koen uuid; v_row jsonb;
begin
  v_row := to_jsonb(case when tg_op='DELETE' then old else new end);
  v_koen := coalesce((v_row ->> 'koen_id')::uuid,
                     (select r.koen_id from public.koen_rows r where r.id = (v_row ->> 'row_id')::uuid));
  if v_koen is null then return case when tg_op='DELETE' then old else new end; end if;

  -- ★公演を消している最中は止めない（止めると 期限切れの公演が消せなくなる）
  if coalesce(current_setting('app.closing_koen', true),'') = v_koen::text then
    return case when tg_op='DELETE' then old else new end;
  end if;
  -- ★公演そのものが もう無いときも止めない
  if not exists (select 1 from public.koen k where k.id = v_koen) then
    return case when tg_op='DELETE' then old else new end;
  end if;

  -- ★退会・出演者の削除による「印を消すだけ」の更新は止めない
  --   （user_id・member_id が null になるだけの更新。人が公演を編集しているのではない）
  if tg_op = 'UPDATE' then
    if (to_jsonb(old) - 'user_id' - 'member_id') = (to_jsonb(new) - 'user_id' - 'member_id')
       and ((to_jsonb(new) ->> 'user_id') is null or (to_jsonb(old) ->> 'user_id') is null
            or (to_jsonb(new) ->> 'member_id') is null or (to_jsonb(old) ->> 'member_id') is null)
    then
      return new;
    end if;
  end if;

  if not public.koen_is_open(v_koen) then
    raise exception 'KOEN_EXPIRED: 使える期限が過ぎています。読むことと書き出すことはできます';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
revoke all on function public.koen_block_after_expiry() from public, anon, authenticated;

-- 確かめ（試しの環境で・★実際に動かすこと）
-- 1 期限切れの公演に 稽古を足す → KOEN_EXPIRED（守りは効いたまま）
-- 2 ★期限切れの公演に入っている人が 退会する → 通る（koen_members.user_id が null になる）
-- 3 ★期限切れの公演を消す → 通る（子の表も一緒に消える）
-- 4 期限内の公演は いままでどおり（稽古を足せる・直せる）
-- 5 引き金の順番: koen_members では 期限の見張り → 人数の確かめ の順（名前の順）。
--    ★期限が先に見られるのは正しい（期限切れなら人数を数える意味がない）
