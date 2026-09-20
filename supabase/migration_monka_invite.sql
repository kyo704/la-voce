-- ============================================================================
-- ★名簿から 招く（★見本 `P_monkaInvite` ②・裁定 その108・2026-09-20）
--
--   ★★★新しい 表を 作りません（★裁定 その108）。
--     ★★「同じ 性質の 表を 2つ 持つと、★片方が 腐る」。
--     ★★`teacher_invitations` に **3列** 足します。
--
--   ★★★足りるか 確かめました（★2026-09-20）──
--     ①主鍵は `code` です。★1行＝1つの 合言葉。
--       ★★だから「その方 1人への 1通」も、★1行で 表せます。
--     ②`used_at` は 1回で 閉じます。★名指しの 招きは 1人 です。★合います。
--     ③足りないのは **宛て先** と **いつ 出したか**、
--       ★そして「合言葉を 見せる」ものか「名指し」かの 見分け です。
--
--   ★★★もう 1つ 足りない ものが ありました ── ★**学生が 読む 道**。
--     ★★いまの 決まりは「先生が ご自分の ぶんを 読む」だけ です。
--     ★★★招かれた 方が「招かれて います」を 見られません。
--       ★★だから 道を 1本 足します。★宛て先が ご自分の ものだけ 返します。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

alter table public.teacher_invitations
  add column if not exists target_user_id uuid references auth.users(id) on delete cascade;
alter table public.teacher_invitations
  add column if not exists invited_at timestamptz;
--   ★★`open` …… 合言葉を 見せる（★誰でも 打てます）
--   ★★`named` …… 名簿から 名指しで 招く（★その方 だけ）
alter table public.teacher_invitations
  add column if not exists kind text not null default 'open';

comment on column public.teacher_invitations.target_user_id is
  '★名指しの 招きの 宛て先。★`open` の ときは null（★裁定 その108）';
comment on column public.teacher_invitations.invited_at is
  '★名指しで 出した 時刻。★「招待中」の 表示に 使います';
comment on column public.teacher_invitations.kind is
  '★`open`（合言葉を 見せる）／`named`（名簿から 招く）';

--   ★★名指しの 招きは、★同じ 方に いくつも 開いた ままに しません。
create unique index if not exists teacher_invitations_named_open_uniq
  on public.teacher_invitations (monka_teacher_id, target_user_id)
  where kind = 'named' and used_at is null;

-- ---------------------------------------------------------------------------
-- ★学生が「招かれて います」を 見る 道
-- ---------------------------------------------------------------------------
--   ★★★宛て先が ご自分の ものだけ 返します。★よその 方の 招きは 返しません。
--   ★★返すのは 4つ ── ★合言葉・先生の お名前・学校の 名・いつまで。
--     ★★合言葉を 返すのは、★その方 宛て だから です。
--       ★★押して 入る ときに 要ります（★もとから ある 道を 使います）。
create or replace function public.get_my_monka_invites()
returns table (
  code text,
  teacher_name text,
  org_name text,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select i.code,
         coalesce(nullif(trim(p.display_name), ''), '先生') as teacher_name,
         coalesce(o.name, '') as org_name,
         i.expires_at
  from public.teacher_invitations i
  left join public.profiles p on p.id = i.monka_teacher_id
  left join public.organizations o on o.id = i.org_id
  where i.kind = 'named'
    and i.target_user_id = auth.uid()
    and i.used_at is null
    and i.expires_at > now();
$$;

revoke all on function public.get_my_monka_invites() from public, anon;
grant execute on function public.get_my_monka_invites() to authenticated;

-- ---------------------------------------------------------------------------
-- ★確かめ（★流した あとに、★別に 流して ください）
-- ---------------------------------------------------------------------------
--   select column_name from information_schema.columns
--   where table_schema='public' and table_name='teacher_invitations'
--     and column_name in ('target_user_id','invited_at','kind');
--   ★★3行 ある こと。
--
--   select count(*) from public.teacher_invitations where kind <> 'open';
--   ★★0 の はず です（★いまある 34行は ぜんぶ「合言葉を 見せる」もの）。

-- ---------------------------------------------------------------------------
-- ★先生が「招待中」を 見る 道（★2026-09-20・見張りが 捕まえました）
-- ---------------------------------------------------------------------------
--   ★★★画面から `teacher_invitations` を 直に 引く ことを、
--     ★見張り（`components/tests/invitation-lookup.test.js`）が 禁じて います。
--     ★★わけ ── ★合言葉が そのまま 画面に 乗る 形を 作らない ため（★No.018）。
--   ★★★だから 道を 通します。★**合言葉は 返しません**。
--     ★★返すのは 3つ ── ★誰に・いつ 出したか・使われたか。
--     ★★先生は ご自分が 出した ものしか 見られません。
create or replace function public.get_my_named_invites(p_org_id uuid)
returns table (target_user_id uuid, invited_at timestamptz, used_at timestamptz)
language sql
stable
security invoker
set search_path = public
as $$
  select i.target_user_id, i.invited_at, i.used_at
  from public.teacher_invitations i
  where i.org_id = p_org_id
    and i.kind = 'named'
    and i.monka_teacher_id = auth.uid();
$$;

revoke all on function public.get_my_named_invites(uuid) from public, anon;
grant execute on function public.get_my_named_invites(uuid) to authenticated;
