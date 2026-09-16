-- ===========================================================================
-- ★台帳の 側にも 塩を 入れます（★2026-09-16・書き直し その2）
--
--   ★★はじめ `alter database postgres set app.code_pepper = …` と 書きました。
--     ★★`permission denied` で 止まりました。★あれは 一番 上の 人の 権限 です。
--     ★★Supabase の SQL Editor からは 触れません。★私の 見落とし です。
--
--   ★★だから、★**1行の 表**に 置きます。★権限は 要りません。
--     ★★この 表には 決まりを 1つも 作りません（★`code_attempts` と 同じ 形）。
--     ★★`anon` からも `authenticated` からも 取り上げます。
--     ★★読めるのは、★持ち主の 力で 動く 関数（SECURITY DEFINER）だけ です。
--
--   ★★★これで 何が 守れるか、★正直に 書きます。
--     ★★守れる …… ★`code_attempts` だけ が 漏れた とき。
--       ★★塩を 知らなければ、★8,530億通りを 総当たりしても 戻せません。
--     ★★守れない …… ★台帳ぜんたいが 漏れた とき。
--       ★★塩の 表も 一緒に 出ます。★これは 塩の 置き方の 話では ありません。
--     ★★`vault` が お使いに なれる なら、★そちらの ほうが 強い です
--       （★鍵が 別に なります）。★お確かめの うえ、★お決め ください。
--
--   ★何度 走らせても 同じに なります。
-- ===========================================================================

-- ══════════ ①-1 `pgcrypto`（★`digest` を 使う ため）══════════
create extension if not exists pgcrypto;

-- ══════════ ①-2 塩を しまう 1行の 表 ══════════
create table if not exists public.app_secrets (
  name  text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

revoke all on public.app_secrets from anon, authenticated;
alter table public.app_secrets enable row level security;
alter table public.app_secrets force row level security;
-- ★決まりを 1つも 作りません。★誰も 読めません。
--   ★★`service_role` にも 与えません ── ★読むのは 関数 だけ です。

-- ══════════ ①-3 塩を 入れます ══════════
--   ★★`◯◯◯` を、★貼る 前に 書き換えて ください。
--     ★作り方（手元で）… openssl rand -base64 32
--   ★★書き換えずに 走らせると、★塩が `◯◯◯` に なります。
--     ★★下の 見張り（②の 中）が、★短すぎる 塩を 止めます。

insert into public.app_secrets (name, value)
values ('code_pepper', '◯◯◯')
on conflict (name) do update
  set value = excluded.value, updated_at = now();

-- ══════════ ② 関数を、塩つきに します ══════════
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
  v_pepper text;
begin
  if auth.uid() is null then
    return null;
  end if;

  v_code := upper(trim(p_code));
  if v_code is null or v_code = '' then
    return null;
  end if;

  select value into v_pepper from public.app_secrets where name = 'code_pepper';

  -- ★★塩が 無い／短い ときは、★進めません。
  --   ★★「塩なしで とりあえず 動かす」を しません。
  --     ★★動いて しまうと、★誰も 気づかない まま 戻せる ハッシュが 貯まります。
  --   ★★`◯◯◯` の まま でも ここで 止まります（★3文字）。
  if v_pepper is null or length(v_pepper) < 20 then
    raise warning '★code_pepper が ありません（または 短すぎます）。合言葉を 引けません。';
    return null;
  end if;

  v_hash := encode(digest(v_pepper || ' code ' || v_code, 'sha256'), 'hex');

  select count(*) into v_tries
  from public.code_attempts
  where code_hash = v_hash
    and at > now() - interval '24 hours';

  -- ★★10回で 止めます。★止めた ことも 1行 残します。
  if v_tries >= 10 then
    insert into public.code_attempts (code_hash) values (v_hash);
    return null;   -- ★理由を 返しません。★見つからない ときと 同じ です。
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

-- ══════════ ③ 塩なしで 貯まった ぶんを 捨てます ══════════
--   ★★古い ハッシュは もう 引き当てられません。★残す 意味が ありません。
--   ★★止めて いた ぶんも 消えます ── ★24時間 待たずに 開きます。
--     ★★いまは まだ 誰も 使って いないので、★困る 人は いません。
delete from public.code_attempts;

-- ══════════ ④ 確かめ（★読むだけ）══════════
--   ★★塩が 入ったか。★値は 出しません。★長さ だけ 見ます。
select name, length(value) as 塩の長さ, updated_at
from public.app_secrets where name = 'code_pepper';
