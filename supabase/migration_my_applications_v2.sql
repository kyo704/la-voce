-- ============================================================================
-- La Voce / Woolsong ── ★応募した 募集（★見本 `SC['応募した募集']`・裁定 その94 §4c）
--
-- ★Supabase の SQL Editor で 実行してください（★何度 実行しても 安全です）。
--
-- ★★★返す ものが 増えます。★`create or replace` では 変えられません（★42P13）。
--   ★★先に 落としてから 作り直します。
--
-- ★★★何を 足すか
--   ★★① 募集が 終わって いるか（★「いま」と「終わったもの」に 分ける ため）
--     ★★`closed` …… ★募集が 閉じられた
--     ★★`expired` …… ★期限が 過ぎた（★裁定 その130）
--     ★★★**わけは 返しません**（★見本の 断り）──
--       ★★「終わった 理由は 書きません。ほかの方に 決まったのか、
--         ★★取り下げられたのかは 分かりません。」
--       ★★誰に 決まったかを 知らせません。★比べる もとを 作りません。
--   ★★② たずねた ことへの お返事（★§4c `applicant_side`）
--     ★★`kyokumoku_kikitai` を 送った 人 だけに 関わります。
--     ★★返事は 相手（募集の 持ち主）が 送った 最後の 1つ です。
--
-- ★★★切れて いれば、★1行も 返しません（★これまで どおり）。
-- ============================================================================

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
         -- ★終わり方は 2つ だけ。★わけは 返しません。
         case
           when p.status <> 'open' then 'closed'
           when p.expires_at is not null and p.expires_at <= now() then 'expired'
           else null
         end,
         -- ★相手からの 最後の 1つ（★自分の 送った ものは 数えません）。
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

comment on function public.get_my_applications() is
  '★応募した 募集（★見本 SC[応募した募集]）。★終わった わけは 返しません。'
  '★誰に 決まったかを 知らせません（★裁定 その94・見本の 断り）。';
