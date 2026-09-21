-- ============================================================================
-- La Voce / Woolsong ── ★募集の 持ち主の 鍵を 返します（★2026-09-21）
--
-- ★Supabase の SQL Editor で 実行してください（★何度 実行しても 安全です）。
--
-- ★★★なぜ 要るか
--   ★★「この人との やりとりについて」で、★切る ときに 相手が 要ります。
--   ★★お名前だけでは、★誰を 切るかを 台帳に 渡せません。
--   ★★`get_match` にも 同じ 理由で `other_user_id` を 足して あります。
--
-- ★★★鍵（uuid）を 返しても、★中身は 増えません。
--   ★★お名前は もともと 返して います。★年齢・学年は 返して いません。
-- ============================================================================

drop function if exists public.get_posting_detail(uuid);
create or replace function public.get_posting_detail(p_posting_id uuid)
returns table (
  id uuid,
  owner_user_id uuid,
  title text,
  kind text,
  piece text,
  days text[],
  need_all_days boolean,
  fee_amount integer,
  fee_unit text,
  sodan boolean,
  owner_display_name text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.id, p.owner_user_id, p.title, p.kind, p.piece, p.days::text[],
         p.need_all_days, p.fee_amount, p.fee_unit, p.sodan,
         pr.display_name, p.created_at
  from public.postings p
  join public.profiles pr on pr.id = p.owner_user_id
  where p.id = p_posting_id
    and p.status = 'open'
    and (p.expires_at is null or p.expires_at > now())
    and p.owner_user_id <> auth.uid()
    and exists (
      select 1 from public.enrollments e
      where e.org_id = p.org_id
        and e.student_id = auth.uid()
        and e.status = 'active'
    )
    and public.matching_visible(auth.uid(), p.owner_user_id)
$$;

revoke all on function public.get_posting_detail(uuid) from public, anon;
grant execute on function public.get_posting_detail(uuid) to authenticated;
