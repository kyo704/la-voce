-- 20260923_33 公演の「使える期限」を台帳で持つ（裁定143・144。見本にはあるが★台帳に無かった）
-- 見本の決まり:
--   期限 ＝ ★お支払いのときの「本番の最後の日＋30日」。題名や本番の日を直しても 期限は変わらない
--   延期 ＝ ★1回だけ・90日まで
--   期限を過ぎたら ★読むだけ（新しい稽古・招く・配役の変更はできない。香盤表と出欠は書き出せる）
--   ★画面だけで止めない。台帳でも止める
-- ★18（koen_payments）のあとに当てる

alter table public.koen add column if not exists valid_until date;        -- 期限（お支払いのときに決まる）
alter table public.koen add column if not exists extended_at timestamptz; -- 延期した日（1回だけ）
alter table public.koen add column if not exists paid_at timestamptz;     -- お支払いの日

-- 期限の決め方（1か所にまとめる）。本番の最後の日＋30日
create or replace function public.koen_compute_valid_until(p_koen uuid)
returns date language sql stable security definer set search_path to 'public' as $$
  select (coalesce(
            (select max(s.starts_at at time zone 'Asia/Tokyo')::date
               from public.koen_sessions s
              where s.koen_id = p_koen and s.kind = 'show' and s.canceled_at is null),
            (select k.opens_on from public.koen k where k.id = p_koen),
            (now() at time zone 'Asia/Tokyo')::date)
          + interval '30 days')::date;
$$;
revoke all on function public.koen_compute_valid_until(uuid) from public, anon, authenticated;

-- 使えるか（1か所で判定。画面ごとに書かない）
create or replace function public.koen_is_open(p_koen uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select coalesce((select k.valid_until is null or k.valid_until >= (now() at time zone 'Asia/Tokyo')::date
                     from public.koen k where k.id = p_koen), false);
$$;
revoke all on function public.koen_is_open(uuid) from public, anon;
grant execute on function public.koen_is_open(uuid) to authenticated;

-- 期限を過ぎたら 書けない（★読むのは そのまま）
create or replace function public.koen_block_after_expiry()
returns trigger language plpgsql set search_path to 'public' as $$
declare v_koen uuid;
begin
  v_koen := coalesce(
    (to_jsonb(case when tg_op='DELETE' then old else new end) ->> 'koen_id')::uuid,
    (select r.koen_id from public.koen_rows r where r.id = (to_jsonb(case when tg_op='DELETE' then old else new end) ->> 'row_id')::uuid));
  if v_koen is not null and not public.koen_is_open(v_koen) then
    raise exception 'KOEN_EXPIRED: 使える期限が過ぎています。読むことと書き出すことはできます';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
revoke all on function public.koen_block_after_expiry() from public, anon, authenticated;
do $$
declare t text;
begin
  foreach t in array array['koen_members','koen_rows','koen_slots','koen_cells','koen_sessions','koen_calls','koen_rooms','koen_runsheet'] loop
    if exists (select 1 from information_schema.tables where table_schema='public' and table_name=t) then
      execute format('drop trigger if exists %I_expiry on public.%I', t, t);
      execute format('create trigger %I_expiry before insert or update or delete on public.%I for each row execute function public.koen_block_after_expiry()', t, t);
    end if;
  end loop;
end $$;
-- ★出欠（koen_attendance）は止めない: 期限を過ぎても、済んだ稽古の記録は直せるほうがよい

-- 延期（1回だけ・90日まで）
create or replace function public.extend_koen(p_koen uuid, p_new_until date)
returns table(ok boolean, reason text)
language plpgsql security definer set search_path to 'public' as $$
declare v koen;
begin
  select * into v from public.koen where id = p_koen;
  if v.id is null then return query select false, 'NO_SUCH_KOEN'; return; end if;
  if not public.koen_can_manage(p_koen) then return query select false, 'NOT_STAFF'; return; end if;
  if v.valid_until is null then return query select false, 'NOT_PAID_YET'; return; end if;
  if v.extended_at is not null then return query select false, 'ALREADY_EXTENDED'; return; end if;   -- ★1回だけ
  if p_new_until <= v.valid_until then return query select false, 'NOT_LATER'; return; end if;
  if p_new_until > v.valid_until + 90 then return query select false, 'OVER_90_DAYS'; return; end if;  -- ★90日まで
  perform set_config('app.koen_until','on',true);      -- ★同じ取引の中だけ
  update public.koen set valid_until = p_new_until, extended_at = now() where id = p_koen;
  perform set_config('app.koen_until','off',true);
  return query select true, ''::text;
end $$;
revoke all on function public.extend_koen(uuid, date) from public, anon;
grant execute on function public.extend_koen(uuid, date) to authenticated;

-- 題名・本番の日を直しても 期限は変わらない（★台帳でも守る）
create or replace function public.koen_keep_valid_until()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  -- ★印が置かれている取引（extend_koen・set_koen_paid の中）だけ、期限を変えてよい
  if coalesce(current_setting('app.koen_until', true),'') = 'on' then return new; end if;
  if new.valid_until is distinct from old.valid_until then
    new.valid_until := old.valid_until;   -- 直接の書き換えは黙って元に戻す
  end if;
  return new;
end $$;
revoke all on function public.koen_keep_valid_until() from public, anon, authenticated;
drop trigger if exists koen_keep_until on public.koen;
create trigger koen_keep_until before update on public.koen for each row execute function public.koen_keep_valid_until();
-- ★期限を入れてよいのは、印（app.koen_until）を置いた取引だけ＝ extend_koen と set_koen_paid の中だけ

create or replace function public.set_koen_paid(p_koen uuid)
returns date language plpgsql security definer set search_path to 'public' as $$
declare v_until date;
begin
  v_until := public.koen_compute_valid_until(p_koen);
  -- ★alter table で引き金を止めない（表に錠がかかる・所有者の権限が要る）。印で通す（裁定173 と同じ形）
  perform set_config('app.koen_until','on',true);
  update public.koen set valid_until = v_until, paid_at = now() where id = p_koen;
  perform set_config('app.koen_until','off',true);
  return v_until;
end $$;
revoke all on function public.set_koen_paid(uuid) from public, anon, authenticated;   -- ★サーバだけ

-- 確かめ（試しの環境で）
-- 支払い前: valid_until が空 → koen_is_open は true（作っている間は使える）
-- set_koen_paid → 本番の最後の日＋30日 が入る。題名や本番の日を直しても 変わらない
-- 画面から koen.valid_until を直接 update → 黙って元に戻る（延期は extend_koen だけ）
-- 画面が app.koen_until を勝手に置いても、koen の update は 運営の札が要る（ポリシーで止まる）
-- extend_koen: 90日以内 → ok／91日 → OVER_90_DAYS／2回目 → ALREADY_EXTENDED
-- 期限の翌日: 稽古を足す → KOEN_EXPIRED／香盤表を読む → 読める／出欠を直す → できる
