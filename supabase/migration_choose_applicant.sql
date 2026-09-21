-- ============================================================================
-- La Voce / Woolsong ── ★この方に 決める（★見本 `SC['応募者の詳細']` の 札）
--   ★裁定 その94 §4e／見本の 断り「決めると、ほかの 応募は 閉じます。」
--
-- ★Supabase の SQL Editor で 実行してください（★何度 実行しても 安全です）。
--
-- ★★★なぜ 関数が 要るか
--   ★★`applications` の 書き換えは、★**応募した ご本人 だけ** に 開いて います。
--   ★★募集を 出した 方は、★門からは 1文字も 書けません。
--   ★★★2つを 一度に 済ませる 必要も あります ──
--     ★① 決めた 応募を `chosen` に する
--     ★② 募集を 閉じる（★ほかの 応募が 一覧から 外れます）
--   ★★片方だけ 通ると、★どっちつかずの 姿が 残ります。
--
-- ★★★「落ちました」を 作りません（★見本の 断り）。
--   ★★ほかの 応募の `status` は **触りません**。★`sent` の ままです。
--   ★★応募した 方には「この募集は 終わりました」と だけ 見えます。
--   ★★★ほかの方に 決まったのか、★取り下げられたのかは 分かりません。
--     ★★負けた、と 伝える 道を 作りません。
-- ============================================================================

create or replace function public.choose_applicant(p_application_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_posting uuid;
begin
  -- ★★その 応募が、★自分の 募集の もので あること。
  --   ★★取り下げられて いない こと。★切れて いない こと。
  select p.id into v_posting
  from public.applications a
  join public.postings p on p.id = a.posting_id
  where a.id = p_application_id
    and p.owner_user_id = auth.uid()
    and p.status = 'open'
    and a.status <> 'withdrawn'
    and public.matching_visible(auth.uid(), a.applicant_user_id);

  if v_posting is null then
    return false;
  end if;

  update public.applications set status = 'chosen' where id = p_application_id;
  -- ★★募集を 閉じます。★ほかの 応募の 状態は 触りません。
  update public.postings set status = 'closed' where id = v_posting;
  return true;
end;
$$;

revoke all on function public.choose_applicant(uuid) from public, anon;
grant execute on function public.choose_applicant(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- ★応募した 募集 ── ★決まった ぶんは「終わったもの」に 落としません。
--
--   ★★募集は 閉じますが、★その 方に とっては **成立** です。
--   ★★終わったもの に 入れると、★決まった ことが 見えなく なります。
-- ----------------------------------------------------------------------------
drop function if exists public.get_my_applications();
create or replace function public.get_my_applications()
returns table (
  id uuid,
  posting_id uuid,
  posting_title text,
  posting_kind text,
  posting_days text[],
  template_key text,
  available_days text[],
  status text,
  ended text,
  reply_template_key text,
  reply_pieces text[],
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select a.id, p.id, p.title, p.kind, p.days::text[],
         a.template_key, a.available_days::text[], a.status,
         case
           -- ★決まった ぶんは 終わりでは ありません。
           when a.status = 'chosen' then null
           when p.status <> 'open' then 'closed'
           when p.expires_at is not null and p.expires_at <= now() then 'expired'
           else null
         end,
         (select m.template_key from public.application_messages m
          where m.application_id = a.id
            and m.sender_user_id = p.owner_user_id
          order by m.created_at desc limit 1),
         (select m.pieces from public.application_messages m
          where m.application_id = a.id
            and m.sender_user_id = p.owner_user_id
          order by m.created_at desc limit 1),
         a.created_at
  from public.applications a
  join public.postings p on p.id = a.posting_id
  where a.applicant_user_id = auth.uid()
    and public.matching_visible(auth.uid(), p.owner_user_id)
  order by a.created_at desc
$$;

revoke all on function public.get_my_applications() from public, anon;
grant execute on function public.get_my_applications() to authenticated;

-- ----------------------------------------------------------------------------
-- ★自分の 募集 ── ★閉じた ものも「終わった」に します。
--
--   ★★★これまで `ended` は 期限 だけ を 見て いました（★裁定 その130）。
--     ★★決めて 閉じた 募集が、★まだ 続いて いる ように 見えました
--       （★`status: closed` なのに `ended: false`・2026-09-21 に 測りました）。
--   ★★閉じた も、★期限切れも、★出す 側から 見れば 終わり です。
-- ----------------------------------------------------------------------------
drop function if exists public.get_my_postings();
create or replace function public.get_my_postings()
returns table (
  id uuid,
  title text,
  kind text,
  days text[],
  status text,
  application_count integer,
  expires_at timestamptz,
  ended boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.id, p.title, p.kind, p.days::text[], p.status,
         (select count(*)::integer from public.applications a
          where a.posting_id = p.id
            and a.status <> 'withdrawn'
            and public.matching_visible(auth.uid(), a.applicant_user_id)),
         p.expires_at,
         (p.status <> 'open'
          or (p.expires_at is not null and p.expires_at <= now())),
         p.created_at
  from public.postings p
  where p.owner_user_id = auth.uid()
  order by p.created_at desc
$$;

revoke all on function public.get_my_postings() from public, anon;
grant execute on function public.get_my_postings() to authenticated;

-- ----------------------------------------------------------------------------
-- ★成立した 相手（★見本 `SC['成立後']`）。
--
--   ★★決まった 組 だけ が 見られます。★どちら側からも 引けます。
--   ★★出す のは、★応募の ときに ご本人が 選んだ ものだけ です。
--   ★★★連絡先の 列は ありません。★交換の 道を まだ 作って いません。
--     ★★§4「after_match: 本人が 判断して 連絡先を 交換（自由）」。
--     ★★どこに どう 置くかが 決まって いません。★作りません。
-- ----------------------------------------------------------------------------
drop function if exists public.get_match(uuid);
create or replace function public.get_match(p_application_id uuid)
returns table (
  application_id uuid,
  -- ★★相手の 鍵。★通報の ときに 要ります（★§6）。
  --   ★★お名前だけでは、★誰を 止めるかを 台帳に 渡せません。
  other_user_id uuid,
  posting_title text,
  posting_kind text,
  posting_days text[],
  other_display_name text,
  other_instrument text,
  i_am_owner boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select a.id,
         case when p.owner_user_id = auth.uid() then a.applicant_user_id
              else p.owner_user_id end,
         p.title, p.kind, p.days::text[],
         case when p.owner_user_id = auth.uid() then pa.display_name
              else po.display_name end,
         case when p.owner_user_id = auth.uid() then
                (select f.instrument from public.portfolios f
                 where f.user_id = a.applicant_user_id)
              else
                (select f.instrument from public.portfolios f
                 where f.user_id = p.owner_user_id)
         end,
         (p.owner_user_id = auth.uid()),
         a.created_at
  from public.applications a
  join public.postings p on p.id = a.posting_id
  join public.profiles pa on pa.id = a.applicant_user_id
  join public.profiles po on po.id = p.owner_user_id
  where a.id = p_application_id
    and a.status = 'chosen'
    and (a.applicant_user_id = auth.uid() or p.owner_user_id = auth.uid())
    and public.matching_visible(a.applicant_user_id, p.owner_user_id)
$$;

revoke all on function public.get_match(uuid) from public, anon;
grant execute on function public.get_match(uuid) to authenticated;
