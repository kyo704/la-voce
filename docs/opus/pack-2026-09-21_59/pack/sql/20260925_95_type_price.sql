-- 20260925_95 高級な 型の 値段（★裁定206）
-- 坂本さんの 決定（2026-09-25）:
--   ★試すのは 無料。★★公開の ときに 1,000円（買い切り）
--   ★★選んだ ときに「1,000円 かかります」と 出す
-- ★94 のあと

alter table public.page_types add column if not exists price_yen integer not null default 0;
alter table public.page_types drop constraint if exists page_types_price_ok;
alter table public.page_types add constraint page_types_price_ok
  check (price_yen >= 0 and price_yen <= 100000);

update public.page_types set price_yen = 1000 where paid;      -- ★高級 5つ
update public.page_types set price_yen = 0    where not paid;

-- ★★試すのは 無料。★公開の ときだけ 止めます
--   ★sql/94 の assert_type_allowed は ★「選ぶ」ときに 止めていました
--   → ★★選ぶのは 自由。★出す ときに 止めます
create or replace function public.assert_type_allowed()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare v_paid boolean;
begin
  if current_setting('app.bypass_guards', true) = 'on' then return new; end if;
  -- ★★公開していない あいだは ★何でも 選べます（★試せます）
  if coalesce(new.visibility,'self') = 'self' then return new; end if;
  if new.web_type is null then return new; end if;
  select paid into v_paid from public.page_types where type_key = new.web_type;
  if coalesce(v_paid,false)
     and not exists (select 1 from public.page_types_owned o
                      where o.user_id = new.user_id and o.type_key = new.web_type)
  then raise exception 'TYPE_NOT_PAID: この 型は、公開の ときに お支払いが 要ります'; end if;
  return new;
end $$;
drop trigger if exists trg_portfolios_type on public.portfolios;
create trigger trg_portfolios_type before insert or update of web_type, visibility on public.portfolios
  for each row execute function public.assert_type_allowed();
-- ★★visibility も 見ます（★self のまま 型を 変えるのは 自由）

-- ★★下見リンクも 無料です（★visibility は self のまま・sql/86）

-- ★★2026-09-26: ★94 が 返す 形と 違います → ★先に 落とします
drop function if exists public.my_page_types();
create function public.my_page_types()
returns table(type_key text, label text, group_name text, paid boolean,
              price_yen integer, owned boolean)
language sql stable security definer set search_path to 'public' as $$
  select t.type_key, t.label, t.group_name, t.paid, t.price_yen,
         (not t.paid)
         or exists (select 1 from public.page_types_owned o
                     where o.user_id = auth.uid() and o.type_key = t.type_key)
    from public.page_types t
   where t.active
   order by t.sort_order;
$$;
revoke all on function public.my_page_types() from public, anon;
grant execute on function public.my_page_types() to authenticated;

-- ★★手に入れた 型は 取り上げません（裁定146・205）
--   ★解約されても page_types_owned は 消しません

-- 確かめ（試しの環境で・★なりきって）
-- ★★self の まま t49 に する → ★通る（★試せる）
-- ★★下見リンクを 作る → ★通る（★self のまま）
-- ★★public に する → ★TYPE_NOT_PAID
-- ★手に入れてから public → ★通る
-- ★無料の 型は ★いつでも public に できる
