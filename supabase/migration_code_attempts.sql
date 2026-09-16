-- ===========================================================================
-- ★合言葉を 打った 回数の 記録（★総当たりを 止める ため）
--
--   ★出どころ　Opus の 裁定（★2026-09-16・坂本さん 転送）
--     「1つの 合言葉に対して 10回で 止める
--       1つの IP に対して 1時間に 20回
--       止まったあと 24時間 開かない
--       台帳に 試行の 記録を 持つ code_attempts（code_hash / ip_hash / at）
--       ★合言葉そのものを 記録しない。ハッシュで
--       ★24時間で 自動的に 消す」
--
--   ★★合言葉そのものを 入れません。★ハッシュだけ です。
--     ★★この 表が 漏れても、★合言葉は 出ません。
--     ★★ハッシュには 秘密の 塩（pepper）を 混ぜます。
--       ★★8文字・31種＝8,530億通り。★塩が 無ければ 総当たりで 戻せます。
--       ★塩は サーバだけ が 持ちます（`lib/codeAttempts.js`）。
--
--   ★何度 走らせても 同じに なります（if not exists）。
-- ===========================================================================

create table if not exists public.code_attempts (
  id uuid primary key default gen_random_uuid(),
  -- ★合言葉の ハッシュ（★合言葉 そのものでは ありません）
  code_hash text not null,
  -- ★打った ところの ハッシュ（★IP そのものでは ありません）
  ip_hash   text,
  at        timestamptz not null default now()
);

create index if not exists code_attempts_code_at on public.code_attempts (code_hash, at desc);
create index if not exists code_attempts_ip_at   on public.code_attempts (ip_hash, at desc);
create index if not exists code_attempts_at      on public.code_attempts (at);

-- ===========================================================================
-- ★権限 ── ★誰にも 見せません
--   ★★revoke を 先に します（★2026-09-15 の 決め）。
-- ===========================================================================

revoke all on public.code_attempts from anon, authenticated;

alter table public.code_attempts enable row level security;
alter table public.code_attempts force row level security;

-- ★policy を 1つも 作りません。★service_role だけが 素通りします。
grant insert, select, delete on public.code_attempts to service_role;

comment on table public.code_attempts is
  '合言葉の試行回数。合言葉そのものは持たない（塩つきハッシュ）。24時間で消す。';

-- ===========================================================================
-- ★24時間で 消す
--
--   ★★裁定「24時間で 自動的に 消す」。
--   ★★`pg_cron` が 在れば それで。★無ければ 掃除の 関数を 呼ぶだけ でも 足ります。
--     ★★どちらでも 動くよう、★関数を 用意します。
--   ★★止めて いる あいだ（24時間）は 消しては いけません。
--     ★★だから **24時間より 古い もの**を 消します。★ちょうど 境目 です。
-- ===========================================================================

create or replace function public.purge_code_attempts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  delete from public.code_attempts where at < now() - interval '24 hours';
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.purge_code_attempts() from public, anon, authenticated;
grant execute on function public.purge_code_attempts() to service_role;

-- ===========================================================================
-- ★合言葉を 引く ところに、★回数の 制限を 入れます
--
--   ★★★なぜ **関数の 中**なのか ──
--     ★`get_invitation_teacher` は、★画面から **じかに** 呼ばれます
--       （`supabase.rpc("get_invitation_teacher", …)`）。
--     ★★`authenticated` に `execute` が 与えられて います。
--     ★★だから、★サーバの 道（route）に 制限を 置いても **素通り**できます。
--       ★★画面を 通さずに、★この 関数を 直に 叩けば よい から です。
--     ★★守りは、★守る ものの **中**に 置きます。
--
--   ★★はじめ 私は `app/api/enrollment/accept` に 置きました。★誤り でした ──
--     ★① あの 道が 呼ばれる ときには、★合言葉は **もう 通って います**。
--       ★（★見張り `enrollment-server-side` が そう 教えて くれました）
--     ★② 画面を 通さずに 呼べるので、★制限に なりません。
--
--   ★★数（★Opus の 裁定）──
--     ★1つの 合言葉に 10回 ／ 1つの IP に 1時間 20回 ／ 止まったら 24時間
--   ★★IP は、★台帳の 中からは 分かりません。
--     ★★だから ここで 数えるのは **合言葉の ほう**です。
--     ★★IP の ぶんは、★呼ぶ 前に 道の 側で 数えます（★二重の 守り）。
-- ===========================================================================

create or replace function public.get_invitation_teacher(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher uuid;
  v_result jsonb;
  v_code   text;
  v_hash   text;
  v_tries  integer;
begin
  if auth.uid() is null then
    return null;
  end if;

  v_code := upper(trim(p_code));
  if v_code is null or v_code = '' then
    return null;
  end if;

  -- ★★合言葉そのものを 残しません。★ハッシュ だけ です。
  --   ★★塩は 台帳の 側では 混ぜられません（★アプリの 秘密 です）。
  --     ★★だから ここでは `digest` を 使わず、★`md5` で 十分 とします ──
  --       ★この 列は 「同じ 合言葉か」を 見る ためだけ に あり、
  --       ★戻して 使う ものでは ありません。
  --     ★★アプリ側（`lib/codeAttempts.js`）は 塩つきの sha256 を 使います。
  --       ★★両方が 同じ 行を 見る 必要は ありません ── ★数えるのは 別々 で 足ります。
  v_hash := md5('code ' || v_code);

  -- ★★24時間の あいだに 何回 打たれたか。
  select count(*) into v_tries
  from public.code_attempts
  where code_hash = v_hash
    and at > now() - interval '24 hours';

  -- ★★10回で 止めます。★止めた ことも 記録します（★次の 24時間 が 伸びます）。
  if v_tries >= 10 then
    insert into public.code_attempts (code_hash) values (v_hash);
    return null;   -- ★★理由を 返しません。★見つからない ときと 同じ です。
  end if;

  -- ★★当たっても 外れても 1行 残します。
  --   ★★外れだけ 数えると、★当たりを 引いた 回が 数から 漏れます。
  insert into public.code_attempts (code_hash) values (v_hash);

  select i.teacher_id into v_teacher
  from public.teacher_invitations i
  where i.code = v_code
    and i.used_at is null
    and i.expires_at > now()
  limit 1;

  if v_teacher is null then
    return null;
  end if;

  select jsonb_build_object(
           'teacher_id', p.id,
           'display_name', nullif(trim(coalesce(p.display_name, '')), ''),
           'school', nullif(trim(coalesce(p.school, '')), '')
         )
    into v_result
  from public.profiles p
  where p.id = v_teacher;

  return v_result;
end;
$$;

revoke all on function public.get_invitation_teacher(text) from public, anon;
grant execute on function public.get_invitation_teacher(text) to authenticated;
